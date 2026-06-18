import {
  signInWithPhoneNumber,
  initializeRecaptchaConfig,
  ConfirmationResult,
} from 'firebase/auth';
import { firebaseAuth } from './firebaseApp.web';
import { seniorSessionCall } from './auth.service';
import type { SeniorAuthResult } from './auth.service';

let _confirmation: ConfirmationResult | null = null;
let _recaptchaReady = false;

// Registers the reCAPTCHA Enterprise config from App Check so that
// signInWithPhoneNumber can use the App Check token instead of a v2 widget.
// Only needs to run once per session.
async function ensureRecaptchaReady(): Promise<void> {
  if (_recaptchaReady) return;
  await initializeRecaptchaConfig(firebaseAuth);
  _recaptchaReady = true;
}

export async function requestSeniorOtpWeb(phone: string): Promise<void> {
  await ensureRecaptchaReady();
  // App Check Enterprise token is attached automatically — no RecaptchaVerifier needed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _confirmation = await (signInWithPhoneNumber as any)(firebaseAuth, phone);
}

export async function verifySeniorOtpWeb(code: string): Promise<SeniorAuthResult> {
  if (!_confirmation) throw new Error('Request OTP before verifying.');
  const cred = await _confirmation.confirm(code);
  const idToken = await cred.user.getIdToken();
  return seniorSessionCall(idToken);
}
