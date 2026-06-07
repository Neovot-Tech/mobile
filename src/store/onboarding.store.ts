import { create } from 'zustand';

interface NeoCareProfile {
  fullName: string;
  livesWithElderly: string;
  address: string;
}

interface NeoSeniorProfile {
  fullName: string;
  phone: string;
  residentialAddress: string;
  primaryCondition: string;
  otherComments: string;
}

interface OnboardingState {
  role: 'neo_care' | 'neo_senior' | null;
  neoCareProfile: Partial<NeoCareProfile>;
  neoSeniorProfile: Partial<NeoSeniorProfile>;
  generatedNeoSeniorId: string | null;
  setRole: (role: 'neo_care' | 'neo_senior') => void;
  setNeoCareProfile: (data: Partial<NeoCareProfile>) => void;
  setNeoSeniorProfile: (data: Partial<NeoSeniorProfile>) => void;
  setGeneratedNeoSeniorId: (id: string) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  role: null,
  neoCareProfile: {},
  neoSeniorProfile: {},
  generatedNeoSeniorId: null,

  setRole: (role) => set({ role }),

  setNeoCareProfile: (data) =>
    set((s) => ({ neoCareProfile: { ...s.neoCareProfile, ...data } })),

  setNeoSeniorProfile: (data) =>
    set((s) => ({ neoSeniorProfile: { ...s.neoSeniorProfile, ...data } })),

  setGeneratedNeoSeniorId: (id) => set({ generatedNeoSeniorId: id }),

  reset: () =>
    set({
      role: null,
      neoCareProfile: {},
      neoSeniorProfile: {},
      generatedNeoSeniorId: null,
    }),
}));
