// STUB — replace with real API calls when backend is ready

export interface NeoCareProfilePayload {
  fullName: string;
  livesWithElderly: string;
  address: string;
}

export interface NeoSeniorProfilePayload {
  fullName: string;
  phone: string;
  residentialAddress: string;
  primaryCondition: string;
  otherComments: string;
}

export async function submitNeoCareProfile(
  data: NeoCareProfilePayload,
): Promise<void> {
  // POST /onboarding/neo-senior/profile
}

export async function submitNeoSeniorProfile(
  data: NeoSeniorProfilePayload,
): Promise<{ neoSeniorId: string }> {
  // POST /onboarding/neo-senior/profile
  return { neoSeniorId: 'NSR-227Q0' };
}

export async function activateWithId(
  neoSeniorId: string,
): Promise<{ caregiverName: string; seniorName: string }> {
  // POST /onboarding/activate
  return { caregiverName: 'Ama Ataah', seniorName: 'Jessica Adamah' };
}

export async function getConfirmLink(): Promise<{
  caregiverName: string;
  seniorName: string;
}> {
  // GET /onboarding/confirm-link
  return { caregiverName: 'Ama Ataah', seniorName: 'Jessica Adamah' };
}

export async function respondToLink(accept: boolean): Promise<void> {
  // POST /onboarding/confirm-link
}

export async function selfRegisterNeoSenior(
  data: NeoSeniorProfilePayload,
): Promise<{ neoSeniorId: string }> {
  // POST /onboarding/neo-senior/self-register
  return { neoSeniorId: 'NSR-9XK3P' };
}
