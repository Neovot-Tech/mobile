import { useCallback, useEffect, useRef, useState } from 'react';
import * as Crypto from 'expo-crypto';

import {
  getSignedUploadUrl,
  uploadToGcs,
  submitJob,
  getJobStatus,
  submitTriageResponse,
} from '../services/jobs.service';
import { getApiErrorMessage } from '../services/http';
import {
  JobType,
  ManualCategory,
  PreferredLang,
  TriageFollowup,
  TriageAnswer,
} from '../services/types';

declare const __DEV__: boolean;

export type PipelineStatus =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'needs_classification'
  | 'triage_check'    // job complete — waiting ~2.5 s then re-polling for triage_followup
  | 'triage_pending'  // triage_followup present & status === 'pending'
  | 'done'
  | 'error';

interface PipelineState {
  status: PipelineStatus;
  error?: string;
  resultLogId?: string;
  triageFollowup?: TriageFollowup;
}

export interface StartParams {
  jobType: JobType;
  fileUri: string;
  mimeType: string;
  lang: PreferredLang;
}

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_ATTEMPTS = Math.ceil(120000 / POLL_INTERVAL_MS);
// Backend enrichment runs just after completion — re-poll after this window.
const TRIAGE_RECHECK_MS = 2500;

/**
 * Drives the async logging pipeline (FRONTEND_HANDOVER.md §4–6):
 *   signed-url → PUT to GCS → POST /jobs → poll
 *   → triage_check (2.5 s re-poll) → triage_pending | done
 */
export function useLogPipeline(onDone?: (resultLogId?: string) => void) {
  const [state, setState] = useState<PipelineState>({ status: 'idle' });

  const clientJobId = useRef<string | null>(null);
  const completedJobId = useRef<string | null>(null);
  const completedResultLogId = useRef<string | undefined>(undefined);
  const submitCtx = useRef<{
    jobType: JobType;
    blobPath: string;
    lang: PreferredLang;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const triageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attempts = useRef(0);
  const mounted = useRef(true);

  const clearPollTimer = () => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
  };
  const clearTriageTimer = () => {
    if (triageTimer.current) { clearTimeout(triageTimer.current); triageTimer.current = null; }
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearPollTimer();
      clearTriageTimer();
    };
  }, []);

  // After the poller sees 'completed': wait TRIAGE_RECHECK_MS then re-poll once
  // to pick up the enrichment step's triage_followup object.
  const handleCompletion = useCallback(
    (jobId: string, resultLogId?: string) => {
      completedJobId.current = jobId;
      completedResultLogId.current = resultLogId;
      setState({ status: 'triage_check', resultLogId });
      triageTimer.current = setTimeout(async () => {
        triageTimer.current = null;
        if (!mounted.current) return;
        try {
          const recheckJob = await getJobStatus(jobId);
          if (!mounted.current) return;
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log(
              '[logPipeline] triage_check re-poll:',
              JSON.stringify({
                jobId,
                status: recheckJob.status,
                triageFollowup: recheckJob.triageFollowup ?? null,
              }),
            );
          }
          if (recheckJob.triageFollowup?.status === 'pending') {
            setState({
              status: 'triage_pending',
              resultLogId,
              triageFollowup: recheckJob.triageFollowup,
            });
          } else {
            setState({ status: 'done', resultLogId });
            onDone?.(resultLogId);
          }
        } catch (e) {
          // Re-poll failure is non-blocking — treat as done.
          if (!mounted.current) return;
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log('[logPipeline] triage_check re-poll failed:', e);
          }
          setState({ status: 'done', resultLogId });
          onDone?.(resultLogId);
        }
      }, TRIAGE_RECHECK_MS);
    },
    [onDone],
  );

  const poll = useCallback(
    (jobId: string) => {
      clearPollTimer();
      attempts.current = 0;
      timer.current = setInterval(async () => {
        try {
          const job = await getJobStatus(jobId);
          if (!mounted.current) return;
          attempts.current += 1;
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log(
              `[logPipeline] job ${jobId} status="${job.status}" attempt ${attempts.current}`,
            );
          }

          if (job.status === 'completed' || job.resultLogId) {
            clearPollTimer();
            handleCompletion(jobId, job.resultLogId);
          } else if (job.status === 'failed') {
            clearPollTimer();
            setState({ status: 'error', error: job.errorMessage });
          } else if (job.status === 'needs_classification') {
            clearPollTimer();
            setState({ status: 'needs_classification' });
          } else if (attempts.current >= MAX_POLL_ATTEMPTS) {
            clearPollTimer();
            setState({
              status: 'error',
              error: `The update is taking longer than expected (last status: ${
                job.status ?? 'unknown'
              }). Please try again.`,
            });
          }
          // otherwise (queued / processing) → keep polling
        } catch (e) {
          if (!mounted.current) return;
          clearPollTimer();
          setState({ status: 'error', error: getApiErrorMessage(e) });
        }
      }, POLL_INTERVAL_MS);
    },
    [handleCompletion],
  );

  const start = useCallback(
    async ({ jobType, fileUri, mimeType, lang }: StartParams) => {
      clearPollTimer();
      clearTriageTimer();
      setState({ status: 'uploading' });
      try {
        const cjid = Crypto.randomUUID();
        clientJobId.current = cjid;

        const { signedUrl, blobPath } = await getSignedUploadUrl({
          jobType,
          mimeType,
          clientJobId: cjid,
        });
        await uploadToGcs(signedUrl, fileUri, mimeType);
        if (!mounted.current) return;

        setState({ status: 'processing' });
        submitCtx.current = { jobType, blobPath, lang };
        const job = await submitJob({ clientJobId: cjid, jobType, blobPath, lang });
        if (!mounted.current) return;
        poll(job.jobId);
      } catch (e) {
        if (!mounted.current) return;
        setState({ status: 'error', error: getApiErrorMessage(e) });
      }
    },
    [poll],
  );

  /** Resubmit after the user picks a device type (C-09 `needs_classification`). */
  const classify = useCallback(
    async (manualCategory: ManualCategory) => {
      const ctx = submitCtx.current;
      const cjid = clientJobId.current;
      if (!ctx || !cjid) return;
      setState({ status: 'processing' });
      try {
        const job = await submitJob({
          clientJobId: cjid,
          jobType: ctx.jobType,
          blobPath: ctx.blobPath,
          lang: ctx.lang,
          manualCategory,
        });
        if (!mounted.current) return;
        poll(job.jobId);
      } catch (e) {
        if (!mounted.current) return;
        setState({ status: 'error', error: getApiErrorMessage(e) });
      }
    },
    [poll],
  );

  /** Submit answers to the triage follow-up. Triage failure is non-blocking — we still mark done. */
  const answerTriage = useCallback(
    async (answers: TriageAnswer[]) => {
      const jid = completedJobId.current;
      const resultLogId = completedResultLogId.current;
      if (!jid) return;
      setState({ status: 'processing' });
      try {
        await submitTriageResponse(jid, answers);
      } catch {
        // Non-fatal — log was already saved.
      }
      if (!mounted.current) return;
      setState({ status: 'done', resultLogId });
      onDone?.(resultLogId);
    },
    [onDone],
  );

  /** Skip the triage (user tapped Cancel). The backend's triage_followup will expire. */
  const skipTriage = useCallback(() => {
    clearTriageTimer();
    const resultLogId = completedResultLogId.current;
    setState({ status: 'done', resultLogId });
    onDone?.(resultLogId);
  }, [onDone]);

  const reset = useCallback(() => {
    clearPollTimer();
    clearTriageTimer();
    clientJobId.current = null;
    completedJobId.current = null;
    completedResultLogId.current = undefined;
    submitCtx.current = null;
    setState({ status: 'idle' });
  }, []);

  return { ...state, start, classify, answerTriage, skipTriage, reset };
}
