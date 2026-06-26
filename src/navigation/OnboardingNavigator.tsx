import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import NeoCareProfileOnboardingScreen from '../screens/onboarding/neocare/NeoCareProfileOnboardingScreen';
import NeoSeniorOnboardingStep1Screen from '../screens/onboarding/neosenior/NeoSeniorOnboardingStep1Screen';
import NeoSeniorOnboardingStep2Screen from '../screens/onboarding/neosenior/NeoSeniorOnboardingStep2Screen';
import NeoSeniorReviewScreen from '../screens/onboarding/neosenior/NeoSeniorReviewScreen';
import NeoSeniorSelfRegScreen from '../screens/onboarding/neosenior/NeoSeniorSelfRegScreen';
import NeoSeniorIdRevealScreen from '../screens/onboarding/neosenior/NeoSeniorIdRevealScreen';
import NeoSeniorActivateScreen from '../screens/onboarding/neosenior/NeoSeniorActivateScreen';
import NeoSeniorConfirmLinkScreen from '../screens/onboarding/neosenior/NeoSeniorConfirmLinkScreen';
import BiometricSetupScreen from '../screens/onboarding/BiometricSetupScreen';
import {
  NeoCareOnboardingStackParamList,
  NeoSeniorOnboardingStackParamList,
} from './types';
import { useAuthStore } from '../store/auth.store';

const NeoCareStack = createNativeStackNavigator<NeoCareOnboardingStackParamList>();
const NeoSeniorStack = createNativeStackNavigator<NeoSeniorOnboardingStackParamList>();

export function NeoCareOnboardingNavigator() {
  return (
    <NeoCareStack.Navigator screenOptions={{ headerShown: false }}>
      <NeoCareStack.Screen name="NeoCareProfileOnboarding" component={NeoCareProfileOnboardingScreen} />
    </NeoCareStack.Navigator>
  );
}

export function NeoSeniorOnboardingNavigator() {
  // Start on ConfirmLink when the senior is activated but has a caregiver request
  // awaiting consent; otherwise start on Activate (enter NSR / self-register).
  const step = useAuthStore((s) => s.seniorOnboardingStep);
  const initialRouteName = step === 'pending_link' ? 'NeoSeniorConfirmLink' : 'NeoSeniorStep1';

  return (
    <NeoSeniorStack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
      <NeoSeniorStack.Screen name="NeoSeniorStep1" component={NeoSeniorOnboardingStep1Screen} />
      <NeoSeniorStack.Screen name="NeoSeniorStep2" component={NeoSeniorOnboardingStep2Screen} />
      <NeoSeniorStack.Screen name="NeoSeniorReview" component={NeoSeniorReviewScreen} />
      <NeoSeniorStack.Screen name="NeoSeniorActivate" component={NeoSeniorActivateScreen} />
      <NeoSeniorStack.Screen name="NeoSeniorConfirmLink" component={NeoSeniorConfirmLinkScreen} />
      <NeoSeniorStack.Screen name="NeoSeniorSelfReg" component={NeoSeniorSelfRegScreen} />
      <NeoSeniorStack.Screen name="NeoSeniorIdReveal" component={NeoSeniorIdRevealScreen} />
      <NeoSeniorStack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
    </NeoSeniorStack.Navigator>
  );
}
