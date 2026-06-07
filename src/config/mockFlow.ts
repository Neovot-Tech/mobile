// DEV-ONLY mock flow — lets testers click through auth + onboarding without
// filling any forms. Empty fields fall back to the MockValues below so every
// downstream screen (greetings, review, pairing card) still renders real copy.
//
// `__DEV__` is false in production builds, so required-field gating is
// automatically restored there. Set to `false` to test gating in dev.
export const MOCK_FLOW = __DEV__;

export const MockValues = {
  phone: '(020) 865 2278', // matches the Figma OTP design
  otp: '2700',
  neoCareName: 'Ama Mensah',
  seniorName: 'Ms. Quansah',
  address: '12 Osu Crescent, Accra',
} as const;
