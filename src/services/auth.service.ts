import { AuthUser } from '../store/auth.store';

// STUB — replace with real API call when backend is ready

export async function registerNeoCare(phone: string): Promise<{ userId: string }> {
  return { userId: 'mock-neocare-001' };
}

export async function loginNeoCare(phone: string): Promise<{ token: string; user: AuthUser }> {
  return {
    token: 'mock-token',
    user: {
      id: 'mock-neocare-001',
      role: 'neo_care',
      phone,
      displayName: 'Ama',
      language: 'en',
    },
  };
}

export async function requestOtp(phone: string): Promise<void> {
  // POST /auth/neo-care/request-otp or /auth/neo-senior/request-otp
}

export async function verifyOtp(
  phone: string,
  otp: string,
): Promise<{ token: string; user: AuthUser }> {
  return {
    token: 'mock-token',
    user: {
      id: 'mock-001',
      role: 'neo_care',
      phone,
      displayName: 'Ama',
      language: 'en',
    },
  };
}

export async function neoSeniorVerifyOtp(
  phone: string,
  otp: string,
): Promise<{ token: string; user: AuthUser }> {
  return {
    token: 'mock-senior-token',
    user: {
      id: 'mock-senior-001',
      role: 'neo_senior',
      phone,
      displayName: 'Ms. Quansah',
      neoSeniorId: 'NSR-48K2M',
      language: 'en',
    },
  };
}
