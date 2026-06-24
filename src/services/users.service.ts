// Account & device — LIVE (FRONTEND_HANDOVER.md §11). [Either]
import { http } from './http';
import { Endpoints } from '../constants/api';

interface UpdateMeParams {
  fullName?: string;
  address?: string;
  livesWithNeoSenior?: boolean;
}

/** Update the caller's own user record (NeoCare: name, address, lives-with flag). */
export async function updateMe(params: UpdateMeParams): Promise<{ message: string }> {
  const body: Record<string, unknown> = {};
  if (params.fullName !== undefined) body.full_name = params.fullName;
  if (params.address !== undefined) body.address = params.address;
  if (params.livesWithNeoSenior !== undefined) body.lives_with_neo_senior = params.livesWithNeoSenior;
  const { data } = await http.put<{ message: string }>(Endpoints.users.me, body);
  return data;
}

export async function updateFcmToken(fcmToken: string): Promise<{ message: string }> {
  const { data } = await http.put<{ message: string }>(Endpoints.users.fcmToken, {
    fcm_token: fcmToken,
  });
  return data;
}

/** Fetch the caller's own profile — used to sync displayName and display profile info. */
export async function getMyProfile(): Promise<{
  fullName: string | null;
  address: string | null;
  phone: string | null;
}> {
  const { data } = await http.get<{
    user: { full_name: string | null; address?: string | null; phone?: string | null };
  }>(Endpoints.users.data);
  return {
    fullName: data.user.full_name,
    address: data.user.address ?? null,
    phone: data.user.phone ?? null,
  };
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
