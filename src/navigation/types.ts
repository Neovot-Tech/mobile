import { NavigatorScreenParams } from '@react-navigation/native';
import { VitalType } from '../services/types';

export type Role = 'neo_care' | 'neo_senior';

// Auth stack
export type AuthStackParamList = {
  Splash: undefined;
  UserType: undefined;
  SignUp: { role: Role };
  SignIn: { role: Role };
  // OTP is the NeoSenior-only path. On native `sessionInfo` comes from request-otp;
  // on web it is omitted (Firebase phone auth manages the confirmation internally).
  Otp: { phone: string; sessionInfo?: string; mode: 'signup' | 'signin' };
};

// NeoCare onboarding stack
// Step1 = link-or-create choice; Step2 = new-senior profile form.
export type NeoCareOnboardingStackParamList = {
  NeoCareProfileStep1: undefined;
  NeoCareProfileStep2: undefined;
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
  CaregiverRequests: undefined;
};

export type NeoCareAppStackParamList = {
  Tabs: NavigatorScreenParams<NeoCareTabParamList>;
  HealthLogEntry: { logId: string };
  VitalTrend: { userId: string; vitalType: VitalType };
  EditProfile: { nsrId: string };
  AddSenior: undefined; // link-or-create choice
  CreateSenior: undefined; // new-senior profile form
};

// Root stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  NeoCareOnboarding: NavigatorScreenParams<NeoCareOnboardingStackParamList>;
  NeoSeniorOnboarding: NavigatorScreenParams<NeoSeniorOnboardingStackParamList>;
  NeoSeniorApp: NavigatorScreenParams<NeoSeniorAppStackParamList>;
  NeoCareApp: NavigatorScreenParams<NeoCareAppStackParamList>;
};
