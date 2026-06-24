// Async logging pipeline — LIVE (FRONTEND_HANDOVER.md §4).
// signed-url -> PUT to GCS -> POST /jobs -> poll GET /jobs/{id}.
import { Platform } from 'react-native';
import { File, UploadType } from 'expo-file-system';
import { http } from './http';
import { Endpoints } from '../constants/api';
import { JobType, JobStatus, ManualCategory, PreferredLang } from './types';

export interface SignedUrlResult {
  signedUrl: string;
  blobPath: string;
  clientJobId: string;
}

export interface SubmitJobParams {
  clientJobId: string;
  jobType: JobType;
  blobPath: string;
  lang: PreferredLang;
  loggedAt?: string;
  /** Required only on a C-09 `needs_classification` resubmit. */
  manualCategory?: ManualCategory;
}

export interface Job {
  jobId: string;
  status: JobStatus;
  jobType: JobType;
  resultLogId?: string;
  errorMessage?: string;
  queuedAt?: string;
  completedAt?: string;
}

interface JobDto {
  job_id: string;
  status: string; // raw backend value (e.g. "complete") — normalized below
  job_type: JobType;
  result_log_id?: string | null;
  error_message?: string | null;
  queued_at?: string | null;
  completed_at?: string | null;
}

/**
 * Map the backend's raw status string onto our canonical JobStatus. The backend
 * uses "complete" (not "completed"), so we match by prefix/keyword and by the
 * strongest signals (a result_log_id ⇒ done; an error_message ⇒ failed) rather
 * than exact strings, so spelling differences don't strand the poller.
 */
function normalizeStatus(raw: string, resultLogId?: string | null, errorMessage?: string | null): JobStatus {
  const s = (raw || '').toLowerCase();
  if (resultLogId || /^complete|done|success|finish/.test(s)) return 'completed';
  if (/classif/.test(s)) return 'needs_classification';
  if (errorMessage || /fail|error|reject/.test(s)) return 'failed';
  if (/process|running|in.?progress|transcrib|analy/.test(s)) return 'processing';
  return 'queued';
}

function toJob(j: JobDto): Job {
  return {
    jobId: j.job_id,
    status: normalizeStatus(j.status, j.result_log_id, j.error_message),
    jobType: j.job_type,
    resultLogId: j.result_log_id ?? undefined,
    errorMessage: j.error_message ?? undefined,
    queuedAt: j.queued_at ?? undefined,
    completedAt: j.completed_at ?? undefined,
  };
}

/** Step 1: ask the API where to upload. `clientJobId` is a UUID you generate. */
export async function getSignedUploadUrl(params: {
  jobType: JobType;
  mimeType: string;
  clientJobId: string;
}): Promise<SignedUrlResult> {
  const { data } = await http.post<{
    signed_url: string;
    blob_path: string;
    client_job_id: string;
  }>(Endpoints.uploads.signedUrl, {
    job_type: params.jobType,
    mime_type: params.mimeType,
    client_job_id: params.clientJobId,
  });
  return {
    signedUrl: data.signed_url,
    blobPath: data.blob_path,
    clientJobId: data.client_job_id,
  };
}

/**
 * Step 2: PUT the file bytes straight to GCS (not the API).
 * On native we use expo-file-system's File upload task — `fetch(fileUri).blob()`
 * is unreliable for local file:// URIs in React Native. Web (QA harness only)
 * keeps the fetch path.
 */
export async function uploadToGcs(
  signedUrl: string,
  fileUri: string,
  mimeType: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    let blob: Blob;
    try {
      const fileRes = await fetch(fileUri);
      blob = await fileRes.blob();
    } catch {
      throw new Error('Could not read the recording/photo to upload.');
    }
    let res: Response;
    try {
      res = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mimeType },
        body: blob,
      });
    } catch {
      // A "Failed to fetch" here (no status) means the browser blocked the
      // cross-origin PUT — the GCS bucket needs a CORS policy allowing PUT from
      // this web origin. (Native uploads don't hit browser CORS.)
      throw new Error(
        'Storage blocked the upload (CORS). The GCS bucket needs CORS configured for this web origin.',
      );
    }
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    return;
  }

  const file = new File(fileUri);
  const task = file.createUploadTask(signedUrl, {
    httpMethod: 'PUT',
    uploadType: UploadType.BINARY_CONTENT,
    headers: { 'Content-Type': mimeType },
  });
  const result = await task.uploadAsync();
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Upload failed (${result.status})`);
  }
}

/** Step 3: submit the job. Idempotent on clientJobId. */
export async function submitJob(params: SubmitJobParams): Promise<Job> {
  const { data } = await http.post<JobDto>(Endpoints.jobs.submit, {
    client_job_id: params.clientJobId,
    job_type: params.jobType,
    blob_path: params.blobPath,
    lang: params.lang,
    logged_at: params.loggedAt,
    manual_category: params.manualCategory,
  });
  return toJob(data);
}

/** Step 4: poll. `completed` -> fetch result_log_id; `needs_classification` ->
 *  ask for a device type then resubmit with the same clientJobId + manualCategory. */
export async function getJobStatus(jobId: string): Promise<Job> {
  const { data } = await http.get<JobDto>(Endpoints.jobs.status(jobId));
  return toJob(data);
}
