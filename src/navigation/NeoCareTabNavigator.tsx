import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ActiveDashboardScreen from '../screens/neocare/ActiveDashboardScreen';
import MonitoringLogScreen from '../screens/neocare/MonitoringLogScreen';
import NeoCareSummaryScreen from '../screens/neocare/SummaryScreen';
import NeoCareSettingsScreen from '../screens/neocare/SettingsScreen';
import { NeoCareTabParamList } from './types';
import NeoCareTabBar from '../components/NeoCareTabBar';

const Tab = createBottomTabNavigator<NeoCareTabParamList>();

export default function NeoCareTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <NeoCareTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={ActiveDashboardScreen} />
      <Tab.Screen name="Health" component={MonitoringLogScreen} />
      <Tab.Screen name="Summary" component={NeoCareSummaryScreen} />
      <Tab.Screen name="Settings" component={NeoCareSettingsScreen} />
    </Tab.Navigator>
  );
}
