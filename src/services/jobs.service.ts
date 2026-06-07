// STUB

export type JobType = 'audio_transcribe' | 'photo_bp' | 'photo_sugar' | 'photo_strip';
export type JobStatus = 'pending' | 'processing' | 'complete' | 'failed';

export interface Job {
  jobId: string;
  clientJobId: string;
  status: JobStatus;
  result?: unknown;
}

export async function getSignedUploadUrl(
  mimeType: string,
  clientJobId: string,
): Promise<{ signedUrl: string; fileUrl: string }> {
  // POST /uploads/signed-url
  return {
    signedUrl: 'https://storage.googleapis.com/mock-signed-url',
    fileUrl: 'https://storage.googleapis.com/neovot-uploads/mock.m4a',
  };
}

export async function submitJob(params: {
  jobType: JobType;
  fileUrl: string;
  clientJobId: string;
  loggedAt: string;
  lang: string;
}): Promise<Job> {
  // POST /jobs
  return {
    jobId: 'job-mock-001',
    clientJobId: params.clientJobId,
    status: 'processing',
  };
}

export async function getJobStatus(jobId: string): Promise<Job> {
  // GET /jobs/{jobId}
  return { jobId, clientJobId: 'mock', status: 'complete' };
}
