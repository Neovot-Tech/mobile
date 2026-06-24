import {
  signInWithPhoneNumber,
  initializeRecaptchaConfig,
  RecaptchaVerifier,
  ConfirmationResult,
} from 'firebase/auth';
import { firebaseAuth } from './firebaseApp.web';
import { signInWithGoogle } from './auth.service';
import type { SeniorAuthResult } from './auth.service';
import type { UserRole } from '../store/auth.store';

let _confirmation: ConfirmationResult | null = null;
let _recaptchaConfigured = false;

function ensureContainer(): void {
  if (document.getElementById('recaptcha-container')) return;
  const div = document.createElement('div');
  div.id = 'recaptcha-container';
  document.body.appendChild(div);
}

// Registers reCAPTCHA Enterprise from App Check onto the auth instance.
// After this, invisible RecaptchaVerifier uses Enterprise scoring (no user
// interaction) instead of standard v2 bot detection.
async function ensureEnterpriseConfig(): Promise<void> {
  if (_recaptchaConfigured) return;
  try {
    await initializeRecaptchaConfig(firebaseAuth);
  } catch {
    // Falls back to standard invisible reCAPTCHA if Enterprise isn't available.
  }
  _recaptchaConfigured = true;
}

export async function requestSeniorOtpWeb(phone: string): Promise<void> {
  ensureContainer();
  await ensureEnterpriseConfig();
  const verifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
    size: 'invisible',
  });
  _confirmation = await signInWithPhoneNumber(firebaseAuth, phone, verifier);
}

export async function verifySeniorOtpWeb(code: string, role: UserRole): Promise<SeniorAuthResult> {
  if (!_confirmation) throw new Error('Request OTP before verifying.');
  const cred = await _confirmation.confirm(code);
  const idToken = await cred.user.getIdToken();
  return signInWithGoogle({ idToken, role });
}
