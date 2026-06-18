import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeRecaptchaConfig } from 'firebase/auth';

// Firebase web config — set these in .env (EXPO_PUBLIC_ prefix exposes them to the client).
// Get values from: Firebase console → Project settings → Your apps → Web app → SDK setup.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);

// Firebase SDK v10+ requires fetching the project's reCAPTCHA configuration before
// signInWithPhoneNumber works. initializeRecaptchaConfig downloads whichever variant
// the project uses (reCAPTCHA v2/v3 or Enterprise) — the call itself is idempotent.
// We kick it off eagerly at module load and expose the promise so phone auth can await it.
export const recaptchaReady = initializeRecaptchaConfig(firebaseAuth).catch(() => {});
