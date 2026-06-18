import { signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { firebaseAuth } from './firebaseApp.web';
import { seniorSessionCall } from './auth.service';
import type { SeniorAuthResult } from './auth.service';

let _confirmation: ConfirmationResult | null = null;

// App Check (reCAPTCHA Enterprise) is initialized in firebaseApp.web.ts — it
// authenticates the request silently, so no RecaptchaVerifier widget is needed here.
export async function requestSeniorOtpWeb(phone: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _confirmation = await (signInWithPhoneNumber as any)(firebaseAuth, phone);
}

export async function verifySeniorOtpWeb(code: string): Promise<SeniorAuthResult> {
  if (!_confirmation) throw new Error('Request OTP before verifying.');
  const cred = await _confirmation.confirm(code);
  const idToken = await cred.user.getIdToken();
  return seniorSessionCall(idToken);
}
