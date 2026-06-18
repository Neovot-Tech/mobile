// Account & device — LIVE (FRONTEND_HANDOVER.md §11). [Either]
import { http } from './http';
import { Endpoints } from '../constants/api';

export async function updateFcmToken(fcmToken: string): Promise<{ message: string }> {
  const { data } = await http.put<{ message: string }>(Endpoints.users.fcmToken, {
    fcm_token: fcmToken,
  });
  return data;
}

/** Full data export (DPA right to access). Shape is open-ended. */
export async function getMyData(): Promise<Record<string, unknown>> {
  const { data } = await http.get<Record<string, unknown>>(Endpoints.users.data);
  return data;
}

/** Soft-delete now, hard purge in 30 days. */
export async function deleteMyAccount(): Promise<{ message: string; hardDeleteInDays: number }> {
  const { data } = await http.delete<{ message: string; hard_delete_in_days: number }>(
    Endpoints.users.delete,
  );
  return { message: data.message, hardDeleteInDays: data.hard_delete_in_days };
}
