import type { SeniorAuthResult } from './auth.service';
import type { UserRole } from '../store/auth.store';

export async function requestSeniorOtpWeb(_phone: string): Promise<void> {
  throw new Error('Web-only');
}

export async function verifySeniorOtpWeb(_code: string, _role: UserRole): Promise<SeniorAuthResult> {
  throw new Error('Web-only');
}
