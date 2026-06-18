import { firebaseAuth } from './firebaseApp.web';

// Force-refreshes the Firebase ID token. Called by http.ts on 401 when there is
// no backend refresh token (web sessions skip the backend token-refresh endpoint).
export async function getWebFreshToken(): Promise<string | null> {
  try {
    return (await firebaseAuth.currentUser?.getIdToken(true)) ?? null;
  } catch {
    return null;
  }
}
