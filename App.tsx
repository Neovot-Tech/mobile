import './src/i18n';

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';

import RootNavigator from './src/navigation/RootNavigator';
import BootSplashScreen from './src/screens/BootSplashScreen';
import { useAuthStore } from './src/store/auth.store';

// Hold the native splash until fonts are ready AND the animated splash has mounted,
// so the launch sequence plays without a white flash. BootSplashScreen hides it.
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    // Brand heading font (Circular Std). Only the Medium 500 weight is licensed
    // in the repo so far; bold/book headings still fall back to DM Sans.
    'CircularStd-Medium': require('./assets/Circular-Std-Font/circular-std-medium-500.ttf'),
  });
  const [splashDone, setSplashDone] = useState(false);

  // Restore any persisted session while the branded splash plays (~5s window),
  // so RootNavigator already reflects the logged-in role by the time it mounts.
  useEffect(() => {
    void useAuthStore.getState().hydrate();
  }, []);

  // Keep the native splash up until fonts are ready (return null = native splash visible).
  if (!fontsLoaded) {
    return null;
  }

  // Play the branded launch animation once, before any auth/role navigation.
  if (!splashDone) {
    return <BootSplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
