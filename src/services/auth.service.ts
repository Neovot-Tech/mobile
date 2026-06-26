// Auth service — LIVE against the Cloud Run API (FRONTEND_HANDOVER.md §Auth).
// Both roles (neo_care and neo_senior) use the same phone-OTP and Google/session
// endpoints. Role is passed in the request body; the backend binds it to the account
// on first sign-in.
import axios from 'axios';
import { API_BASE, Endpoints } from '../constants/api';
import { AuthUser, UserRole } from '../store/auth.store';
import { StoredTokens } from './tokenStorage';
import { PreferredLang } from './types';

const api = axios.create({ baseURL: API_BASE });

export interface AuthResult {
  user: AuthUser;
  tokens: StoredTokens;
}

/** Returned by verifyOtp and signInWithGoogle. `created` is true for brand-new accounts. */
export interface OtpAuthResult extends AuthResult {
  created: boolean;
  /** NeoSenior only — where they land in the onboarding stack. */
  seniorOnboarding?: SeniorOnboardingStep;
}

/** For backward compat with web auth stub. */
export type SeniorAuthResult = OtpAuthResult;

export type SeniorOnboardingStep = 'ready' | 'pending_link' | 'needs_activation';

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

interface MeData {
  user: MeUser;
  profile?: MeProfile | null;
  links?: MeLink[] | null;
}

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

// --- Phone OTP (both roles) -----------------------------------------------

export async function requestOtp(phone: string): Promise<{ sessionInfo: string }> {
  const { data } = await api.post<{ session_info: string }>(Endpoints.auth.requestOtp, {
    phone_number: phone,
    recaptcha_token: null,
  });
  return { sessionInfo: data.session_info };
}

interface VerifyOtpParams {
  sessionInfo: string;
  code: string;
  role: UserRole;
  phone?: string;
  fullName?: string;
}

interface VerifyOtpResponse {
  id_token: string;
  refresh_token: string;
  user_id: string;
  created: boolean;
  /** Stored role returned by the backend — always the account's persisted role. */
  role: UserRole;
}

export async function verifyOtp(params: VerifyOtpParams): Promise<OtpAuthResult> {
  const { data } = await api.post<VerifyOtpResponse>(Endpoints.auth.verifyOtp, {
    session_info: params.sessionInfo,
    code: params.code,
    role: params.role,
    phone_number: params.phone ?? null,
    full_name: params.fullName ?? null,
  });
  const tokens = toTokens(data);
  const me = await fetchMe(tokens.idToken);
  const result: OtpAuthResult = { user: toAuthUser(me), tokens, created: data.created };
  if (me.user.role === 'neo_senior') {
    result.seniorOnboarding = resolveSeniorOnboarding(me);
  }
  return result;
}

// --- Google / web-phone session (both roles) --------------------------------

interface SessionParams {
  /** Firebase ID token obtained from the Google → Firebase Identity Toolkit exchange. */
  idToken: string;
  /** Refresh token from the same exchange — stored for /auth/refresh calls. */
  refreshToken?: string;
  role: UserRole;
  fullName?: string;
}

interface SessionResponse {
  user_id: string;
  created: boolean;
  role: string;
}

/**
 * Posts a client-completed Firebase ID token (Google sign-in) to the backend
 * session endpoint. The client retains its own Firebase tokens; the backend
 * only uses this call to provision/look up the user record and return role info.
 */
export async function signInWithGoogle(params: SessionParams): Promise<OtpAuthResult> {
  const { data } = await api.post<SessionResponse>(Endpoints.auth.session, {
    id_token: params.idToken,
    role: params.role,
    full_name: params.fullName ?? null,
  });
  const tokens: StoredTokens = {
    idToken: params.idToken,
    refreshToken: params.refreshToken ?? '',
  };
  const me = await fetchMe(params.idToken);
  const result: OtpAuthResult = { user: toAuthUser(me), tokens, created: data.created };
  if (me.user.role === 'neo_senior') {
    result.seniorOnboarding = resolveSeniorOnboarding(me);
  }
  return result;
}

// --- NeoSenior session (called by seniorWebAuth on web) ---------------------

export async function seniorSessionCall(idToken: string): Promise<SeniorAuthResult> {
  return signInWithGoogle({ idToken, role: 'neo_senior' });
}

// Kept for web compat — native uses requestOtp/verifyOtp directly.
export async function requestSeniorOtp(phone: string): Promise<{ sessionInfo: string }> {
  return requestOtp(phone);
}

export async function verifySeniorOtp(params: {
  sessionInfo: string;
  code: string;
  phone?: string;
  fullName?: string;
}): Promise<SeniorAuthResult> {
  return verifyOtp({ ...params, role: 'neo_senior' });
}

// --- Token lifecycle -------------------------------------------------------

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
  await api.post(Endpoints.auth.logout).catch(() => {});
}
