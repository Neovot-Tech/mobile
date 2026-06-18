import { useCallback, useEffect, useRef, useState } from 'react';
import * as Crypto from 'expo-crypto';

import {
  getSignedUploadUrl,
  uploadToGcs,
  submitJob,
  getJobStatus,
} from '../services/jobs.service';
import { getApiErrorMessage } from '../services/http';
import { JobType, ManualCategory, PreferredLang } from '../services/types';

declare const __DEV__: boolean;

export type PipelineStatus =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'needs_classification'
  | 'done'
  | 'error';

interface PipelineState {
  status: PipelineStatus;
  error?: string;
  resultLogId?: string;
}

export interface StartParams {
  jobType: JobType;
  fileUri: string;
  mimeType: string;
  lang: PreferredLang;
}

const POLL_INTERVAL_MS = 2500;
// Stop polling after ~2 min so a stuck/queued backend job doesn't spin forever.
const MAX_POLL_ATTEMPTS = Math.ceil(120000 / POLL_INTERVAL_MS);

/**
 * Drives the async logging pipeline (FRONTEND_HANDOVER.md §4):
 * signed-url → PUT to GCS → POST /jobs → poll, including the C-09
 * `needs_classification` device-picker resubmit (same client_job_id).
 */
export function useLogPipeline(onDone?: (resultLogId?: string) => void) {
  const [state, setState] = useState<PipelineState>({ status: 'idle' });

  const clientJobId = useRef<string | null>(null);
  const submitCtx = useRef<{ jobType: JobType; blobPath: string; lang: PreferredLang } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const attempts = useRef(0);
  const mounted = useRef(true);

  const clearTimer = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimer();
    };
  }, []);

  const poll = useCallback(
    (jobId: string) => {
      clearTimer();
      attempts.current = 0;
      timer.current = setInterval(async () => {
        try {
          const job = await getJobStatus(jobId);
          if (!mounted.current) return;
          attempts.current += 1;
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log(`[logPipeline] job ${jobId} status="${job.status}" attempt ${attempts.current}`);
          }
          // Treat a present result_log_id as completion too — the backend's
          // terminal status string may not be exactly "completed".
          if (job.status === 'completed' || job.resultLogId) {
            clearTimer();
            setState({ status: 'done', resultLogId: job.resultLogId });
            onDone?.(job.resultLogId);
          } else if (job.status === 'failed') {
            clearTimer();
            setState({ status: 'error', error: job.errorMessage });
          } else if (job.status === 'needs_classification') {
            clearTimer();
            setState({ status: 'needs_classification' });
          } else if (attempts.current >= MAX_POLL_ATTEMPTS) {
            // queued/processing too long, or an unrecognized status string.
            clearTimer();
            setState({
              status: 'error',
              error: `The update is taking longer than expected (last status: ${job.status ?? 'unknown'}). Please try again.`,
            });
          }
          // otherwise (queued / processing) → keep polling
        } catch (e) {
          if (!mounted.current) return;
          clearTimer();
          setState({ status: 'error', error: getApiErrorMessage(e) });
        }
      }, POLL_INTERVAL_MS);
    },
    [onDone],
  );

  const start = useCallback(
    async ({ jobType, fileUri, mimeType, lang }: StartParams) => {
      clearTimer();
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

  /** Resubmit after the user picks a device type (C-09). */
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

  const reset = useCallback(() => {
    clearTimer();
    clientJobId.current = null;
    submitCtx.current = null;
    setState({ status: 'idle' });
  }, []);

  return { ...state, start, classify, reset };
}
