// Doctor summary / export — LIVE (FRONTEND_HANDOVER.md §9).
// Path param is the NeoSenior **user UUID**. `days` ∈ {7,14,30} only.
import { Platform } from 'react-native';
import { downloadAsync, cacheDirectory } from 'expo-file-system/legacy';
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
 * Download the auth-gated PDF and make it available for sharing.
 *
 * Native: downloads to the app cache via expo-file-system and returns a
 * local file:// URI the Share sheet can open.
 *
 * Web: fetches via axios (goes through auth interceptors), creates a Blob
 * URL, and triggers the browser's native download — no file URI is returned.
 */
export async function downloadSummaryPdf(
  userId: NeoSeniorUserId,
  days: SummaryWindow,
  idToken: string,
): Promise<string> {
  const url = getSummaryPdfUrl(userId, days);

  if (Platform.OS === 'web') {
    const { data } = await http.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
    const blob = new Blob([data], { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `neovot-summary-${userId}-${days}d.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
    return objectUrl;
  }

  const fileUri = `${cacheDirectory}summary-${userId}-${days}d-${Date.now()}.pdf`;
  const result = await downloadAsync(url, fileUri, {
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (result.status !== 200) {
    throw new Error(`PDF generation failed (HTTP ${result.status})`);
  }

  return result.uri;
}
