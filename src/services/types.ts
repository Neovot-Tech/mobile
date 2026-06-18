// Shared API contract types — sourced from FRONTEND_HANDOVER.md.
// These shapes are the source of truth for every *.service.ts mock so that the
// real-API swap is zero-component-change.

/**
 * The human-shareable code, formatted `NSR-XXXXX`. Used in *onboarding* and
 * *linking* bodies only. NOT valid as a data-endpoint path param.
 * @see NeoSeniorUserId
 */
export type NsrCode = string;

/**
 * The NeoSenior's user UUID. This is the path param for the data endpoints
 * (`/health-logs`, `/vitals`, `/medications`, `/dashboard`, `/summary`).
 * Obtained from `GET /dashboard/linked-profiles` (`user_id`) or the senior's
 * own session. Do NOT pass an {@link NsrCode} here.
 */
export type NeoSeniorUserId = string;

/** Quick runtime check to catch an NSR code accidentally used as a UUID. */
export function looksLikeNsrCode(value: string): boolean {
  return /^NSR-/i.test(value);
}

/** Backend error envelope: non-2xx returns `{ detail: "<message>" }`. */
export interface ApiErrorBody {
  detail: string;
}

/** Consent categories on a NeoCare↔NeoSenior link's `permissions` map. */
export type ConsentCategory = 'vitals' | 'medications' | 'symptoms';
export type ConsentMap = Record<ConsentCategory, boolean>;

export const DEFAULT_CONSENT: ConsentMap = {
  vitals: true,
  medications: true,
  symptoms: true,
};

/**
 * The backend serializes a link's `permissions` as a JSON STRING
 * (e.g. `"{\"vitals\": true, ...}"`), and sometimes as an object. Normalize
 * either form into a ConsentMap (missing keys → false).
 */
export function parseConsent(raw: unknown): ConsentMap {
  let obj: Record<string, unknown> = {};
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      obj = {};
    }
  } else if (raw && typeof raw === 'object') {
    obj = raw as Record<string, unknown>;
  }
  return { vitals: !!obj.vitals, medications: !!obj.medications, symptoms: !!obj.symptoms };
}

export type PreferredLang = 'en' | 'tw';

/** Vital types written by the AI worker (never POSTed directly by the app). */
export type VitalType =
  | 'bp_systolic'
  | 'bp_diastolic'
  | 'pulse_rate'
  | 'blood_sugar_mmol'
  | 'spo2_pct'
  | 'heart_rate_bpm'
  | 'weight_kg';

/** Async logging pipeline job types. */
export type JobType = 'audio_transcribe' | 'photo_auto' | 'prescription_scan';

/** Device categories for the C-09 `needs_classification` resubmit. */
export type ManualCategory =
  | 'bp_monitor'
  | 'glucometer'
  | 'test_strip'
  | 'pulse_oximeter'
  | 'weight_scale';

export type JobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'needs_classification'
  | 'failed';
