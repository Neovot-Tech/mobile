import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthNavigator from './AuthNavigator';
import {
  NeoCareOnboardingNavigator,
  NeoSeniorOnboardingNavigator,
} from './OnboardingNavigator';
import { NeoCareAppNavigator, NeoSeniorAppNavigator } from './AppNavigator';
import { RootStackParamList } from './types';
import { useAuthStore } from '../store/auth.store';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, pendingOnboarding } = useAuthStore();

  // Declarative role/onboarding routing — entering/leaving each phase is driven
  // by the auth store (signIn / beginOnboarding / completeOnboarding), not by
  // imperative navigation, so there is no stale screen left mounted.
  let content: React.ReactNode;
  if (!user) {
    content = <Stack.Screen name="Auth" component={AuthNavigator} />;
  } else if (pendingOnboarding === 'neo_care') {
    content = (
      <Stack.Screen name="NeoCareOnboarding" component={NeoCareOnboardingNavigator} />
    );
  } else if (pendingOnboarding === 'neo_senior') {
    content = (
      <Stack.Screen name="NeoSeniorOnboarding" component={NeoSeniorOnboardingNavigator} />
    );
  } else if (user.role === 'neo_care') {
    content = <Stack.Screen name="NeoCareApp" component={NeoCareAppNavigator} />;
  } else {
    content = <Stack.Screen name="NeoSeniorApp" component={NeoSeniorAppNavigator} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>{content}</Stack.Navigator>
  );
}
