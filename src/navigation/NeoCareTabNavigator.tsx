import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import NeoCaresDashboardScreen from '../screens/neocare/DashboardScreen';
import NeoCareHealthScreen from '../screens/neocare/HealthScreen';
import NeoCareSummaryScreen from '../screens/neocare/SummaryScreen';
import NeoCareSettingsScreen from '../screens/neocare/SettingsScreen';
import { NeoCareTabParamList } from './types';
import { Colors } from '../theme';

const Tab = createBottomTabNavigator<NeoCareTabParamList>();

export default function NeoCareTabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={NeoCaresDashboardScreen}
        options={{ title: t('neoCare.dashboard') }}
      />
      <Tab.Screen
        name="Health"
        component={NeoCareHealthScreen}
        options={{ title: t('neoCare.health') }}
      />
      <Tab.Screen
        name="Summary"
        component={NeoCareSummaryScreen}
        options={{ title: t('neoCare.summary') }}
      />
      <Tab.Screen
        name="Settings"
        component={NeoCareSettingsScreen}
        options={{ title: t('neoCare.settings') }}
      />
    </Tab.Navigator>
  );
}
