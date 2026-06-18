import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { firebaseAuth } from './firebaseApp.web';
import { seniorSessionCall } from './auth.service';
import type { SeniorAuthResult } from './auth.service';

let _confirmation: ConfirmationResult | null = null;
let _verifier: RecaptchaVerifier | null = null;

// Appends a single persistent container to document.body (outside the React
// tree) so there is never more than one #recaptcha-container in the DOM,
// regardless of how React Navigation mounts/unmounts screens.
function ensureContainer(): void {
  if (document.getElementById('recaptcha-container')) return;
  const div = document.createElement('div');
  div.id = 'recaptcha-container';
  Object.assign(div.style, {
    position: 'fixed',
    bottom: '100px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '9999',
  });
  document.body.appendChild(div);
}

export async function requestSeniorOtpWeb(phone: string): Promise<void> {
  ensureContainer();
  // Always create a fresh verifier — reusing a solved one risks an expired token.
  if (_verifier) {
    try { _verifier.clear(); } catch { /* ignore */ }
    _verifier = null;
  }
  _verifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', { size: 'normal' });
  _confirmation = await signInWithPhoneNumber(firebaseAuth, phone, _verifier);
  _verifier = null;
}

export async function verifySeniorOtpWeb(code: string): Promise<SeniorAuthResult> {
  if (!_confirmation) throw new Error('Request OTP before verifying.');
  const cred = await _confirmation.confirm(code);
  const idToken = await cred.user.getIdToken();
  return seniorSessionCall(idToken);
}
