// Onboarding & linking — LIVE (FRONTEND_HANDOVER.md §1–3).
// The UI-collected payloads (NeoSeniorProfilePayload) are mapped to the richer
// contract request (CreateNeoSeniorProfileRequest) inside the service so the
// onboarding screens don't change.
import { http } from './http';
import { Endpoints } from '../constants/api';
import { NsrCode, PreferredLang, ConsentMap, ConsentCategory, parseConsent } from './types';

// --- UI-collected payloads (consumed by ElderlyProfileFlow / onboarding screens) ---

/** NeoCare's own details. NOTE: the contract has no endpoint for this — the
 *  NeoCare account is created via /auth/neo-care/register. Kept local-only. */
export interface NeoCareProfilePayload {
  fullName: string;
  livesWithElderly: string;
  address: string;
}

export interface NeoSeniorProfilePayload {
  fullName: string;
  phone: string;
  dateOfBirth?: string;       // ISO 'YYYY-MM-DD'
  conditions: string[];
  preferredLang: PreferredLang;
  // Condition-triggered thresholds (all optional — backend uses its defaults when omitted)
  bpHighThreshold?: number;   // Hypertension — CREATE + UPDATE
  sugarHighMmol?: number;     // Diabetes     — CREATE + UPDATE
  heartRateHigh?: number;     // Heart cond.  — UPDATE only (sent via follow-up PUT)
  heartRateLow?: number;      // Heart cond.  — UPDATE only (sent via follow-up PUT)
  spo2LowThreshold?: number;  // COPD         — UPDATE only (sent via follow-up PUT)
}

// --- Full contract shapes -------------------------------------------------

export interface PastSurgery {
  description: string;
  year: number;
}

/** POST /onboarding/neo-senior/profile body (CreateNeoSeniorProfileRequest). */
export interface CreateNeoSeniorProfileRequest {
  fullName: string; // required
  dateOfBirth?: string;
  phoneNumber?: string;
  conditions?: string[];
  preferredLang?: PreferredLang;
  bpHighThreshold?: number; // default 140
  sugarHighMmol?: number; // default 10.0
  nhisNumber?: string;
  bloodGroup?: string; // A+ … O-
  allergies?: string[];
  preferredHospital?: string;
  primaryDoctorName?: string;
  primaryDoctorPhone?: string;
  pastSurgeries?: PastSurgery[];
  strokeHistory?: boolean;
  strokeLastDate?: string;
  fallHistory?: boolean;
  fallLastDate?: string;
}

/** PUT body — create fields plus C-06 threshold overrides. Only non-null applied. */
export interface UpdateNeoSeniorProfileRequest extends Partial<CreateNeoSeniorProfileRequest> {
  spo2LowThreshold?: number;
  heartRateHigh?: number;
  heartRateLow?: number;
  weightAlertDeltaKg?: number;
}

export interface NeoSeniorProfile extends CreateNeoSeniorProfileRequest {
  neoSeniorId: NsrCode;
  profileId: string;
  linkStatus?: string;
  // Update-only threshold fields the GET endpoint also returns.
  spo2LowThreshold?: number;
  heartRateHigh?: number;
  heartRateLow?: number;
  weightAlertDeltaKg?: number;
}

export interface PendingLink {
  id: string;
  neoCareName: string;
  permissions: ConsentMap;
  createdAt: string;
}

/** Map the UI payload onto the CREATE contract body (snake_case).
 *  heartRate and spo2 thresholds are update-only — sent via a follow-up PUT. */
function toCreateBody(data: NeoSeniorProfilePayload) {
  // phone_number / date_of_birth are nullable on the backend, but
  // bp_high_threshold (integer) and sugar_high_mmol (number) are NOT — sending
  // null gets a 422, so omit them entirely when unset (backend applies defaults).
  const body: Record<string, unknown> = {
    full_name: data.fullName,
    phone_number: data.phone || null,
    date_of_birth: data.dateOfBirth ?? null,
    conditions: data.conditions,
    preferred_lang: data.preferredLang,
  };
  if (data.bpHighThreshold != null) body.bp_high_threshold = Math.round(data.bpHighThreshold);
  if (data.sugarHighMmol != null) body.sugar_high_mmol = data.sugarHighMmol;
  return body;
}

function toUpdateBody(p: UpdateNeoSeniorProfileRequest) {
  return {
    full_name: p.fullName,
    date_of_birth: p.dateOfBirth,
    phone_number: p.phoneNumber,
    conditions: p.conditions,
    preferred_lang: p.preferredLang,
    bp_high_threshold: p.bpHighThreshold != null ? Math.round(p.bpHighThreshold) : undefined,
    sugar_high_mmol: p.sugarHighMmol,
    nhis_number: p.nhisNumber,
    blood_group: p.bloodGroup,
    allergies: p.allergies,
    preferred_hospital: p.preferredHospital,
    primary_doctor_name: p.primaryDoctorName,
    primary_doctor_phone: p.primaryDoctorPhone,
    past_surgeries: p.pastSurgeries,
    stroke_history: p.strokeHistory,
    stroke_last_date: p.strokeLastDate,
    fall_history: p.fallHistory,
    fall_last_date: p.fallLastDate,
    spo2_low_threshold: p.spo2LowThreshold,
    heart_rate_high: p.heartRateHigh != null ? Math.round(p.heartRateHigh) : undefined,
    heart_rate_low: p.heartRateLow != null ? Math.round(p.heartRateLow) : undefined,
    weight_alert_delta_kg: p.weightAlertDeltaKg,
  };
}

// --- NeoCare-managed profile creation ------------------------------------

/** Local-only (no backend endpoint). Retained so Step 1 keeps working. */
export async function submitNeoCareProfile(data: NeoCareProfilePayload): Promise<void> {
  void data;
}

/** POST /onboarding/neo-senior/profile -> { neo_senior_id, profile_id }.
 *  If heartRate or spo2 thresholds are provided, a follow-up PUT is issued
 *  automatically (those fields are update-only in the contract). */
export async function submitNeoSeniorProfile(
  data: NeoSeniorProfilePayload,
): Promise<{ neoSeniorId: NsrCode; profileId: string }> {
  const { data: res } = await http.post<{ neo_senior_id: string; profile_id: string }>(
    Endpoints.onboarding.createProfile,
    toCreateBody(data),
  );
  const neoSeniorId = res.neo_senior_id as NsrCode;

  if (data.heartRateHigh != null || data.heartRateLow != null || data.spo2LowThreshold != null) {
    await updateNeoSeniorProfile(neoSeniorId, {
      heartRateHigh: data.heartRateHigh,
      heartRateLow: data.heartRateLow,
      spo2LowThreshold: data.spo2LowThreshold,
    });
  }

  return { neoSeniorId, profileId: res.profile_id };
}

export async function getNeoSeniorProfile(nsr: NsrCode): Promise<NeoSeniorProfile> {
  const { data } = await http.get<Record<string, unknown>>(Endpoints.onboarding.profile(nsr));
  const rawSurgeries = data.past_surgeries as Array<{ description: string; year: number }> | undefined;
  return {
    neoSeniorId: ((data.neo_senior_id as string) ?? nsr) as NsrCode,
    profileId: (data.profile_id as string) ?? '',
    linkStatus: data.link_status as string | undefined,
    fullName: (data.full_name as string) ?? '',
    dateOfBirth: data.date_of_birth as string | undefined,
    phoneNumber: data.phone_number as string | undefined,
    conditions: (data.conditions as string[] | undefined) ?? [],
    preferredLang: (data.preferred_lang as PreferredLang | undefined) ?? 'en',
    bpHighThreshold: data.bp_high_threshold as number | undefined,
    sugarHighMmol: data.sugar_high_mmol as number | undefined,
    nhisNumber: data.nhis_number as string | undefined,
    bloodGroup: data.blood_group as string | undefined,
    allergies: (data.allergies as string[] | undefined) ?? [],
    preferredHospital: data.preferred_hospital as string | undefined,
    primaryDoctorName: data.primary_doctor_name as string | undefined,
    primaryDoctorPhone: data.primary_doctor_phone as string | undefined,
    pastSurgeries: (rawSurgeries ?? []).map(s => ({ description: s.description, year: s.year })),
    strokeHistory: (data.stroke_history as boolean | undefined) ?? false,
    strokeLastDate: data.stroke_last_date as string | undefined,
    fallHistory: (data.fall_history as boolean | undefined) ?? false,
    fallLastDate: data.fall_last_date as string | undefined,
    spo2LowThreshold: data.spo2_low_threshold as number | undefined,
    heartRateHigh: data.heart_rate_high as number | undefined,
    heartRateLow: data.heart_rate_low as number | undefined,
    weightAlertDeltaKg: data.weight_alert_delta_kg as number | undefined,
  };
}

export async function updateNeoSeniorProfile(
  nsr: NsrCode,
  patch: UpdateNeoSeniorProfileRequest,
): Promise<{ message: string }> {
  const { data } = await http.put<{ message: string }>(
    Endpoints.onboarding.profile(nsr),
    toUpdateBody(patch),
  );
  return data;
}

// --- NeoSenior self-service ----------------------------------------------

export async function selfRegisterNeoSenior(
  data: NeoSeniorProfilePayload,
): Promise<{ neoSeniorId: NsrCode; profileId: string }> {
  const { data: res } = await http.post<{ neo_senior_id: string; profile_id: string }>(
    Endpoints.onboarding.selfRegister,
    toCreateBody(data),
  );
  const neoSeniorId = res.neo_senior_id as NsrCode;

  if (data.heartRateHigh != null || data.heartRateLow != null || data.spo2LowThreshold != null) {
    await updateNeoSeniorProfile(neoSeniorId, {
      heartRateHigh: data.heartRateHigh,
      heartRateLow: data.heartRateLow,
      spo2LowThreshold: data.spo2LowThreshold,
    });
  }

  return { neoSeniorId, profileId: res.profile_id };
}

/** GET /neo-senior/profile — NeoSenior reads their own profile (token-resolved). */
export async function getNeoSeniorOwnProfile(): Promise<NeoSeniorProfile> {
  const { data } = await http.get<Record<string, unknown>>(Endpoints.neoSenior.ownProfile);
  const rawSurgeries = data.past_surgeries as Array<{ description: string; year: number }> | undefined;
  return {
    neoSeniorId: (data.neo_senior_id as string) as NsrCode,
    profileId: (data.profile_id as string) ?? '',
    fullName: (data.full_name as string) ?? '',
    dateOfBirth: data.date_of_birth as string | undefined,
    phoneNumber: data.phone_number as string | undefined,
    conditions: (data.conditions as string[] | undefined) ?? [],
    preferredLang: (data.preferred_lang as PreferredLang | undefined) ?? 'en',
    bpHighThreshold: data.bp_high_threshold as number | undefined,
    sugarHighMmol: data.sugar_high_mmol as number | undefined,
    nhisNumber: data.nhis_number as string | undefined,
    bloodGroup: data.blood_group as string | undefined,
    allergies: (data.allergies as string[] | undefined) ?? [],
    preferredHospital: data.preferred_hospital as string | undefined,
    primaryDoctorName: data.primary_doctor_name as string | undefined,
    primaryDoctorPhone: data.primary_doctor_phone as string | undefined,
    pastSurgeries: (rawSurgeries ?? []).map(s => ({ description: s.description, year: s.year })),
    strokeHistory: (data.stroke_history as boolean | undefined) ?? false,
    strokeLastDate: data.stroke_last_date as string | undefined,
    fallHistory: (data.fall_history as boolean | undefined) ?? false,
    fallLastDate: data.fall_last_date as string | undefined,
    spo2LowThreshold: data.spo2_low_threshold as number | undefined,
    heartRateHigh: data.heart_rate_high as number | undefined,
    heartRateLow: data.heart_rate_low as number | undefined,
    weightAlertDeltaKg: data.weight_alert_delta_kg as number | undefined,
  };
}

/** PUT /neo-senior/profile — NeoSenior updates their own profile (token-resolved). */
export async function updateNeoSeniorOwnProfile(
  patch: UpdateNeoSeniorProfileRequest,
): Promise<{ message: string }> {
  const { data } = await http.put<{ message: string }>(
    Endpoints.neoSenior.ownProfile,
    toUpdateBody(patch),
  );
  return data;
}

/** Activate a NeoCare-created profile by NSR code. */
export async function activateProfile(neoSeniorId: NsrCode): Promise<{ message: string }> {
  const { data } = await http.post<{ message: string }>(Endpoints.onboarding.activate, {
    neo_senior_id: neoSeniorId,
  });
  return data;
}

/** Get my own NSR code to invite a caregiver. */
export async function inviteNeoCare(): Promise<{ neoSeniorId: NsrCode }> {
  const { data } = await http.post<{ neo_senior_id: string }>(
    Endpoints.onboarding.inviteNeoCare,
  );
  return { neoSeniorId: data.neo_senior_id };
}

// --- Link confirmation (NeoSenior side) ----------------------------------

export async function listPendingLinks(): Promise<PendingLink[]> {
  const { data } = await http.get<{
    pending_links: { id: string; neo_care_name: string; permissions: ConsentMap | string | null; created_at: string }[];
  }>(Endpoints.onboarding.confirmLink);
  return data.pending_links.map((l) => ({
    id: l.id,
    neoCareName: l.neo_care_name,
    permissions: parseConsent(l.permissions),
    createdAt: l.created_at,
  }));
}

export async function respondToLink(params: {
  linkId: string;
  accept: boolean;
  permissions?: Partial<Record<ConsentCategory, boolean>>;
}): Promise<{ status: string; message: string }> {
  const { data } = await http.post<{ status: string; message: string }>(
    Endpoints.onboarding.confirmLink,
    { link_id: params.linkId, accept: params.accept, permissions: params.permissions ?? null },
  );
  return data;
}

// --- NeoCare link management ---------------------------------------------

/** Link to an existing senior by NSR code. 409 if already linked. */
export async function createLink(
  neoSeniorId: NsrCode,
): Promise<{ linkId: string; status: string }> {
  const { data } = await http.post<{ link_id: string; status: string }>(
    Endpoints.links.create,
    { neo_senior_id: neoSeniorId },
  );
  return { linkId: data.link_id, status: data.status };
}

export async function removeLink(linkId: string): Promise<void> {
  await http.delete(Endpoints.links.remove(linkId));
}
