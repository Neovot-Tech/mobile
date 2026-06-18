// Doctor summary / export — LIVE (FRONTEND_HANDOVER.md §9).
// Path param is the NeoSenior **user UUID**. `days` ∈ {7,14,30} only.
import { File, Paths } from 'expo-file-system';
import { http } from './http';
import { API_BASE, Endpoints } from '../constants/api';
import { NeoSeniorUserId } from './types';

export type SummaryWindow = 7 | 14 | 30;

export interface DoctorSummary {
  windowDays: number;
  profile: Record<string, unknown>;
  vitalsSummary: unknown;
  medicationAdherence: unknown;
  symptomLog: unknown;
  aiFlags: unknown;
}

export async function getDoctorSummary(
  userId: NeoSeniorUserId,
  days: SummaryWindow = 7,
): Promise<DoctorSummary> {
  const { data } = await http.get<{
    window_days: number;
    profile: Record<string, unknown>;
    vitals_summary: unknown;
    medication_adherence: unknown;
    symptom_log: unknown;
    ai_flags: unknown;
  }>(Endpoints.summary.json(userId), { params: { days } });
  return {
    windowDays: data.window_days,
    profile: data.profile,
    vitalsSummary: data.vitals_summary,
    medicationAdherence: data.medication_adherence,
    symptomLog: data.symptom_log,
    aiFlags: data.ai_flags,
  };
}

/**
 * URL for the inline PDF (application/pdf). The endpoint is auth-gated, so it
 * must be fetched with the Bearer header (e.g. via expo-file-system download)
 * rather than opened directly in a browser/Linking.
 */
export function getSummaryPdfUrl(userId: NeoSeniorUserId, days: SummaryWindow = 7): string {
  return `${API_BASE}${Endpoints.summary.pdf(userId)}?days=${days}`;
}

/**
 * Download the auth-gated PDF to the cache and return its local file URI
 * (ready to hand to the Share sheet). `idToken` is passed in so the service
 * stays decoupled from the store.
 */
export async function downloadSummaryPdf(
  userId: NeoSeniorUserId,
  days: SummaryWindow,
  idToken: string,
): Promise<string> {
  const dest = new File(Paths.cache, `summary-${userId}-${days}d-${Date.now()}.pdf`);
  const file = await File.downloadFileAsync(getSummaryPdfUrl(userId, days), dest, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  return file.uri;
}
