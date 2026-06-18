// Native stub — on native the backend /auth/refresh endpoint handles token renewal.
export async function getWebFreshToken(): Promise<string | null> {
  return null;
}
