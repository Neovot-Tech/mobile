import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import NeoSeniorHomeScreen from '../screens/neosenior/HomeScreen';
import NeoSeniorMyHealthScreen from '../screens/neosenior/MyHealthScreen';
import NeoSeniorSettingsScreen from '../screens/neosenior/SettingsScreen';
import { NeoSeniorTabParamList } from './types';
import { Colors } from '../theme';

const Tab = createBottomTabNavigator<NeoSeniorTabParamList>();

export default function NeoSeniorTabNavigator() {
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
        name="Home"
        component={NeoSeniorHomeScreen}
        options={{ title: t('neoSenior.home') }}
      />
      <Tab.Screen
        name="MyHealth"
        component={NeoSeniorMyHealthScreen}
        options={{ title: t('neoSenior.myHealth') }}
      />
      <Tab.Screen
        name="Settings"
        component={NeoSeniorSettingsScreen}
        options={{ title: t('neoSenior.settings') }}
      />
    </Tab.Navigator>
  );
}
