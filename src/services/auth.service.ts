// Auth service — LIVE against the Cloud Run API (FRONTEND_HANDOVER.md §Auth).
// NeoCare signs in with email + password; NeoSenior with phone OTP. The backend
// proxies Firebase and returns {id_token, refresh_token}. The id_token JWT
// carries name/email but NOT the backend user UUID or role, so after sign-in we
// call GET /users/me/data — the authoritative source for the AuthUser (id, role,
// preferred_lang). Uses a bare axios client with no interceptors to avoid the
// refresh-on-401 loop while we don't yet have a stored session.
import axios from 'axios';
import { API_BASE, Endpoints } from '../constants/api';
import { AuthUser, UserRole } from '../store/auth.store';
import { StoredTokens } from './tokenStorage';
import { PreferredLang } from './types';

const api = axios.create({ baseURL: API_BASE });

/** A completed sign-in: the user profile plus the token pair to persist. */
export interface AuthResult {
  user: AuthUser;
  tokens: StoredTokens;
}

interface TokenResponse {
  id_token: string;
  refresh_token: string;
  expires_in?: string;
}

interface MeUser {
  id: string;
  role: UserRole;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  preferred_lang: PreferredLang | null;
}

interface MeProfile {
  neo_senior_id: string;
  activated_at: string | null;
}

interface MeLink {
  consent_given: boolean;
  status: string;
}

/** Shape of GET /users/me/data (only the fields we route on). */
interface MeData {
  user: MeUser;
  profile?: MeProfile | null;
  links?: MeLink[] | null;
}

/** Where a NeoSenior should land right after OTP verify. */
export type SeniorOnboardingStep = 'ready' | 'pending_link' | 'needs_activation';

export interface SeniorAuthResult extends AuthResult {
  onboarding: SeniorOnboardingStep;
}

/** GET /users/me/data. Token passed explicitly (store isn't set yet at sign-in). */
async function fetchMe(idToken: string): Promise<MeData> {
  const { data } = await api.get<MeData>(Endpoints.users.data, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  return data;
}

function toAuthUser(me: MeData): AuthUser {
  const u = me.user;
  return {
    id: u.id,
    role: u.role,
    displayName: u.full_name,
    language: u.preferred_lang ?? 'en',
    email: u.email ?? undefined,
    phone: u.phone_number ?? undefined,
    neoSeniorId: me.profile?.neo_senior_id ?? undefined,
  };
}

/**
 * Decide where a senior lands after OTP verify, from their backend state:
 * - no activated profile        → needs_activation (enter NSR / self-register)
 * - activated, a link awaiting consent and none active → pending_link (confirm)
 * - activated (with an active link, or none pending)    → ready (dashboard)
 */
function resolveSeniorOnboarding(me: MeData): SeniorOnboardingStep {
  const activated = !!me.profile && !!me.profile.activated_at;
  if (!activated) return 'needs_activation';
  const links = me.links ?? [];
  const hasActive = links.some((l) => l.consent_given && l.status === 'active');
  const hasPending = links.some((l) => !l.consent_given);
  if (!hasActive && hasPending) return 'pending_link';
  return 'ready';
}

function toTokens(r: TokenResponse): StoredTokens {
  return { idToken: r.id_token, refreshToken: r.refresh_token };
}

// --- NeoCare (email + password) ------------------------------------------

export async function registerNeoCare(
  email: string,
  password: string,
  fullName: string,
): Promise<{ userId: string; email: string }> {
  const { data } = await api.post<{ user_id: string; email: string }>(
    Endpoints.auth.neoCareRegister,
    { email, password, full_name: fullName },
  );
  return { userId: data.user_id, email: data.email };
}

export async function loginNeoCare(email: string, password: string): Promise<AuthResult> {
  const { data } = await api.post<TokenResponse>(Endpoints.auth.neoCareLogin, {
    email,
    password,
  });
  const tokens = toTokens(data);
  const me = await fetchMe(tokens.idToken);
  return { user: toAuthUser(me), tokens };
}

// --- NeoSenior (phone OTP) -----------------------------------------------

export async function requestSeniorOtp(phone: string): Promise<{ sessionInfo: string }> {
  // recaptcha_token is nullable on the live API; real AppCheck token is Phase 6.
  const { data } = await api.post<{ session_info: string }>(
    Endpoints.auth.seniorRequestOtp,
    { phone_number: phone, recaptcha_token: null },
  );
  return { sessionInfo: data.session_info };
}

export async function verifySeniorOtp(params: {
  sessionInfo: string;
  code: string;
  phone?: string;
  fullName?: string;
}): Promise<SeniorAuthResult> {
  const { data } = await api.post<TokenResponse>(Endpoints.auth.seniorVerifyOtp, {
    session_info: params.sessionInfo,
    code: params.code,
    phone_number: params.phone ?? null,
    full_name: params.fullName ?? null,
  });
  const tokens = toTokens(data);
  const me = await fetchMe(tokens.idToken);
  return { user: toAuthUser(me), tokens, onboarding: resolveSeniorOnboarding(me) };
}

// --- NeoSenior (web — Firebase phone auth) --------------------------------

/**
 * Called after the Firebase JS SDK completes phone auth on web.
 * Posts the Firebase ID token to the backend session endpoint (which provisions
 * the NeoSenior row on first sign-in), then fetches the full profile.
 * Returns the same SeniorAuthResult shape as verifySeniorOtp so callers are uniform.
 */
export async function seniorSessionCall(idToken: string): Promise<SeniorAuthResult> {
  await api.post(Endpoints.auth.seniorSession, { id_token: idToken });
  const me = await fetchMe(idToken);
  // refreshToken is empty on web — the Firebase JS SDK manages token renewal.
  return { user: toAuthUser(me), tokens: { idToken, refreshToken: '' }, onboarding: resolveSeniorOnboarding(me) };
}

// --- Token lifecycle ------------------------------------------------------

/** Exchange a refresh token for a fresh id_token after on-device biometric unlock. */
export async function biometricUnlock(refreshToken: string): Promise<{ idToken: string }> {
  const { data } = await api.post<TokenResponse>(Endpoints.auth.biometricToken, {
    refresh_token: refreshToken,
  });
  return { idToken: data.id_token };
}

export async function refresh(refreshToken: string): Promise<{ idToken: string }> {
  const { data } = await api.post<TokenResponse>(Endpoints.auth.refresh, {
    refresh_token: refreshToken,
  });
  return { idToken: data.id_token };
}

export async function logout(): Promise<void> {
  // Best-effort revoke; the local session is cleared by the store regardless.
  await api.post(Endpoints.auth.logout).catch(() => {});
}
