import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import NeoCaresDashboardScreen from '../screens/neocare/DashboardScreen';
import NeoCareHealthScreen from '../screens/neocare/HealthScreen';
import NeoCareSummaryScreen from '../screens/neocare/SummaryScreen';
import NeoCareSettingsScreen from '../screens/neocare/SettingsScreen';
import { NeoCareTabParamList } from './types';
import { Colors, Brand } from '../theme';

const Tab = createBottomTabNavigator<NeoCareTabParamList>();

const INACTIVE = '#9FB0B2';

export default function NeoCareTabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Brand.primary,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 1,
          borderTopColor: '#FCDEA7',
          paddingTop: 6,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={NeoCaresDashboardScreen}
        options={{
          title: t('neoCare.dashboard'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size ?? 26} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Health"
        component={NeoCareHealthScreen}
        options={{
          title: t('neoCare.health'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse" size={size ?? 26} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Summary"
        component={NeoCareSummaryScreen}
        options={{
          title: t('neoCare.summary'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size ?? 26} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={NeoCareSettingsScreen}
        options={{
          title: t('neoCare.settings'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size ?? 26} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
