import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import NeoSeniorHomeScreen from '../screens/neosenior/HomeScreen';
import NeoSeniorMyHealthScreen from '../screens/neosenior/MyHealthScreen';
import NeoSeniorSummaryScreen from '../screens/neosenior/SummaryScreen';
import NeoSeniorSettingsScreen from '../screens/neosenior/SettingsScreen';
import { NeoSeniorTabParamList } from './types';
import { Colors, Brand } from '../theme';

const Tab = createBottomTabNavigator<NeoSeniorTabParamList>();

const INACTIVE = '#9FB0B2';

export default function NeoSeniorTabNavigator() {
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
        name="Home"
        component={NeoSeniorHomeScreen}
        options={{
          title: t('neoSenior.home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size ?? 26} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyHealth"
        component={NeoSeniorMyHealthScreen}
        options={{
          title: t('neoSenior.myHealth'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse" size={size ?? 26} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Summary"
        component={NeoSeniorSummaryScreen}
        options={{
          title: t('neoSenior.summary'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size ?? 26} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={NeoSeniorSettingsScreen}
        options={{
          title: t('neoSenior.settings'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size ?? 26} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
