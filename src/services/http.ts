import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { API_BASE, Endpoints } from '../constants/api';
import { useAuthStore } from '../store/auth.store';
import { ApiErrorBody, ConsentCategory } from './types';
import { saveTokens, clearTokens } from './tokenStorage';

export const http = axios.create({ baseURL: API_BASE });

// Attach the short-lived Firebase ID token to every authenticated call.
http.interceptors.request.use((config) => {
  const idToken = useAuthStore.getState().idToken;
  if (idToken) {
    config.headers.Authorization = `Bearer ${idToken}`;
  }
  return config;
});

// --- Refresh-on-401 -------------------------------------------------------
// ID tokens expire quickly. On a 401 we attempt exactly one refresh using the
// long-lived refresh token, persist the new pair, then replay the request.
// A bare axios call avoids re-entering this interceptor.
let refreshing: Promise<string | null> | null = null;

async function refreshIdToken(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${API_BASE}${Endpoints.auth.refresh}`, {
      refresh_token: refreshToken,
    });
    const idToken: string = data.id_token;
    setTokens({ idToken, refreshToken });
    await saveTokens({ idToken, refreshToken });
    return idToken;
  } catch {
    logout();
    await clearTokens();
    return null;
  }
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as
      | (AxiosRequestConfig & { _retried?: boolean })
      | undefined;

    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      refreshing = refreshing ?? refreshIdToken();
      const newToken = await refreshing.finally(() => {
        refreshing = null;
      });
      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return http(original);
      }
    }
    return Promise.reject(error);
  },
);

/** Pull the backend's `{ detail }` message off any thrown error. */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as ApiErrorBody | undefined)?.detail ?? error.message ?? fallback;
  }
  return fallback;
}

/**
 * True when a NeoCare endpoint returned `403` for missing consent on the given
 * category — callers should hide/disable that section rather than error out.
 */
export function isConsentDenied(error: unknown, category?: ConsentCategory): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 403) return false;
  const detail = (error.response?.data as ApiErrorBody | undefined)?.detail ?? '';
  if (!category) return /consent/i.test(detail);
  return new RegExp(`consent.*${category}`, 'i').test(detail);
}
