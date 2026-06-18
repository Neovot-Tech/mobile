import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { firebaseAuth, recaptchaReady } from './firebaseApp.web';
import { seniorSessionCall } from './auth.service';
import type { SeniorAuthResult } from './auth.service';

// Held between requestSeniorOtpWeb() and verifySeniorOtpWeb() calls.
let _confirmation: ConfirmationResult | null = null;

/**
 * Initiates phone sign-in via the Firebase JS SDK (browser-side reCAPTCHA).
 * Requires a DOM element with id="recaptcha-container" to be in the tree.
 */
export async function requestSeniorOtpWeb(phone: string): Promise<void> {
  // Ensure the reCAPTCHA config has been fetched from Firebase before attempting
  // phone auth. Without this, Firebase v10+ throws auth/error-code:-39.
  await recaptchaReady;
  const verifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
    size: 'invisible',
  });
  _confirmation = await signInWithPhoneNumber(firebaseAuth, phone, verifier);
}

/** Confirms the SMS code and exchanges the Firebase ID token for a backend session. */
export async function verifySeniorOtpWeb(code: string): Promise<SeniorAuthResult> {
  if (!_confirmation) throw new Error('Request OTP before verifying.');
  const cred = await _confirmation.confirm(code);
  const idToken = await cred.user.getIdToken();
  return seniorSessionCall(idToken);
}
