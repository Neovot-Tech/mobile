import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthNavigator from './AuthNavigator';
import {
  NeoCareOnboardingNavigator,
  NeoSeniorOnboardingNavigator,
} from './OnboardingNavigator';
import NeoCareTabNavigator from './NeoCareTabNavigator';
import NeoSeniorTabNavigator from './NeoSeniorTabNavigator';
import { RootStackParamList } from './types';
import { useAuthStore } from '../store/auth.store';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Auth" component={AuthNavigator} />
          <Stack.Screen name="NeoCareOnboarding" component={NeoCareOnboardingNavigator} />
          <Stack.Screen name="NeoSeniorOnboarding" component={NeoSeniorOnboardingNavigator} />
        </>
      ) : user?.role === 'neo_care' ? (
        <Stack.Screen name="NeoCareApp" component={NeoCareTabNavigator} />
      ) : (
        <Stack.Screen name="NeoSeniorApp" component={NeoSeniorTabNavigator} />
      )}
    </Stack.Navigator>
  );
}
