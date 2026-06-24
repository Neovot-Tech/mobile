// Exchanges a Google OAuth access token for a Firebase ID token + refresh token via
// the Firebase Identity Toolkit REST API — no Firebase native SDK required.
// Reference: https://firebase.google.com/docs/reference/rest/auth#section-sign-in-with-oauth-credential

const FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY!;
const IDENTITY_TOOLKIT_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`;

export interface FirebaseTokens {
  idToken: string;
  refreshToken: string;
}

export async function exchangeGoogleTokenForFirebase(
  googleAccessToken: string,
  redirectUri: string,
): Promise<FirebaseTokens> {
  const res = await fetch(IDENTITY_TOOLKIT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestUri: redirectUri,
      postBody: `access_token=${googleAccessToken}&providerId=google.com`,
      returnSecureToken: true,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message ?? 'Google sign-in failed');
  }
  return { idToken: data.idToken, refreshToken: data.refreshToken };
}
