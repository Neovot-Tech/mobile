import { signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { firebaseAuth, recaptchaReady } from './firebaseApp.web';
import { seniorSessionCall } from './auth.service';
import type { SeniorAuthResult } from './auth.service';

// Held between requestSeniorOtpWeb() and verifySeniorOtpWeb() calls.
let _confirmation: ConfirmationResult | null = null;

/**
 * Initiates phone sign-in via the Firebase JS SDK.
 * This project uses reCAPTCHA Enterprise — initializeRecaptchaConfig (called at
 * module load in firebaseApp.web.ts) fetches the Enterprise config so Firebase
 * handles verification internally. Passing a RecaptchaVerifier conflicts with
 * Enterprise mode and causes auth/error-code:-39.
 */
export async function requestSeniorOtpWeb(phone: string): Promise<void> {
  await recaptchaReady;
  _confirmation = await signInWithPhoneNumber(firebaseAuth, phone);
}

/** Confirms the SMS code and exchanges the Firebase ID token for a backend session. */
export async function verifySeniorOtpWeb(code: string): Promise<SeniorAuthResult> {
  if (!_confirmation) throw new Error('Request OTP before verifying.');
  const cred = await _confirmation.confirm(code);
  const idToken = await cred.user.getIdToken();
  return seniorSessionCall(idToken);
}
