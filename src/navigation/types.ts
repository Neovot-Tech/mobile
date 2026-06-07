import { NavigatorScreenParams } from '@react-navigation/native';

export type Role = 'neo_care' | 'neo_senior';

// Auth stack
export type AuthStackParamList = {
  Splash: undefined;
  UserType: undefined;
  SignUp: { role: Role };
  SignIn: { role: Role };
  Otp: { phone: string; role: Role; mode: 'signup' | 'signin' };
};

// NeoCare onboarding stack
export type NeoCareOnboardingStackParamList = {
  NeoCareProfileStep1: undefined;
  NeoCareProfileStep2: undefined;
  NeoCareProfileStep3: { neoSeniorId: string };
};

// NeoSenior onboarding stack
export type NeoSeniorOnboardingStackParamList = {
  NeoSeniorActivate: undefined;
  NeoSeniorConfirmLink: undefined;
  NeoSeniorSelfReg: undefined;
  NeoSeniorIdReveal: { neoSeniorId: string };
  BiometricSetup: undefined;
};

// NeoSenior tab navigator
export type NeoSeniorTabParamList = {
  Home: undefined;
  MyHealth: undefined;
  Settings: undefined;
};

// NeoCare tab navigator
export type NeoCareTabParamList = {
  Dashboard: undefined;
  Health: undefined;
  Summary: undefined;
  Settings: undefined;
};

// Root stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  NeoCareOnboarding: NavigatorScreenParams<NeoCareOnboardingStackParamList>;
  NeoSeniorOnboarding: NavigatorScreenParams<NeoSeniorOnboardingStackParamList>;
  NeoSeniorApp: NavigatorScreenParams<NeoSeniorTabParamList>;
  NeoCareApp: NavigatorScreenParams<NeoCareTabParamList>;
};
