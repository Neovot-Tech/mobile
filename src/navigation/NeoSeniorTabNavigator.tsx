import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import NeoseniorDashboardScreen from '../screens/neosenior/NeoseniorDashboardScreen';
import NeoSeniorMyHealthScreen from '../screens/neosenior/MyHealthScreen';
import NeoSeniorSummaryScreen from '../screens/neosenior/SummaryScreen';
import NeoSeniorSettingsScreen from '../screens/neosenior/SettingsScreen';
import { NeoSeniorTabParamList } from './types';
import NeoSeniorTabBar from '../components/NeoSeniorTabBar';

const Tab = createBottomTabNavigator<NeoSeniorTabParamList>();

export default function NeoSeniorTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <NeoSeniorTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={NeoseniorDashboardScreen} />
      <Tab.Screen name="MyHealth" component={NeoSeniorMyHealthScreen} />
      <Tab.Screen name="Summary" component={NeoSeniorSummaryScreen} />
      <Tab.Screen name="Settings" component={NeoSeniorSettingsScreen} />
    </Tab.Navigator>
  );
}
