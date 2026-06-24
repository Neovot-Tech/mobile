import { NavigatorScreenParams } from '@react-navigation/native';
import { VitalType } from '../services/types';

export type Role = 'neo_care' | 'neo_senior';

// Auth stack
export type AuthStackParamList = {
  Splash: undefined;
  UserType: undefined;
  SignUp: { role: Role };
  SignIn: { role: Role };
  // OTP is used by both roles now. `sessionInfo` comes from request-otp on native;
  // omitted on web (Firebase JS SDK manages confirmation internally).
  Otp: { phone: string; sessionInfo?: string; role: Role };
};

// NeoCare onboarding stack — single profile-collection step after sign-up.
// Step1/Step2 retained in the type only to avoid errors in their legacy files.
export type NeoCareOnboardingStackParamList = {
  NeoCareProfileOnboarding: undefined;
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
