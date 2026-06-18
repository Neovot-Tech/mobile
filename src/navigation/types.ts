import { NavigatorScreenParams } from '@react-navigation/native';
import { VitalType } from '../services/types';

export type Role = 'neo_care' | 'neo_senior';

// Auth stack
export type AuthStackParamList = {
  Splash: undefined;
  UserType: undefined;
  SignUp: { role: Role };
  SignIn: { role: Role };
  // OTP is the NeoSenior-only path. `sessionInfo` comes from request-otp.
  Otp: { phone: string; sessionInfo: string; mode: 'signup' | 'signin' };
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
  Summary: undefined;
  Settings: undefined;
};

// NeoCare tab navigator
export type NeoCareTabParamList = {
  Dashboard: undefined;
  Health: undefined;
  Summary: undefined;
  Settings: undefined;
};

// Shared detail screens pushed on top of the tabs.
export type NeoSeniorAppStackParamList = {
  Tabs: NavigatorScreenParams<NeoSeniorTabParamList>;
  HealthLogEntry: { logId: string };
  VitalTrend: { userId: string; vitalType: VitalType };
  MedicationEdit: { userId: string; medId?: string };
  EditProfile: { nsrId: string };
};

export type NeoCareAppStackParamList = {
  Tabs: NavigatorScreenParams<NeoCareTabParamList>;
  HealthLogEntry: { logId: string };
  VitalTrend: { userId: string; vitalType: VitalType };
  EditProfile: { nsrId: string };
};

// Root stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  NeoCareOnboarding: NavigatorScreenParams<NeoCareOnboardingStackParamList>;
  NeoSeniorOnboarding: NavigatorScreenParams<NeoSeniorOnboardingStackParamList>;
  NeoSeniorApp: NavigatorScreenParams<NeoSeniorAppStackParamList>;
  NeoCareApp: NavigatorScreenParams<NeoCareAppStackParamList>;
};
