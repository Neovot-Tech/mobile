// Native stub — phone auth on native goes through the backend OTP endpoints.
// This file exists only so TypeScript resolves the import on all platforms.
import type { SeniorAuthResult } from './auth.service';

export async function requestSeniorOtpWeb(_phone: string): Promise<void> {
  throw new Error('Web-only');
}

export async function verifySeniorOtpWeb(_code: string): Promise<SeniorAuthResult> {
  throw new Error('Web-only');
}
