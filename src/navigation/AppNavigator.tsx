import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import NeoSeniorTabNavigator from './NeoSeniorTabNavigator';
import NeoCareTabNavigator from './NeoCareTabNavigator';
import HealthLogEntryScreen from '../screens/shared/HealthLogEntryScreen';
import EditProfileScreen from '../screens/shared/EditProfileScreen';
import AddSeniorScreen from '../screens/neocare/AddSeniorScreen';
import CreateSeniorScreen from '../screens/neocare/CreateSeniorScreen';
import { NeoSeniorAppStackParamList, NeoCareAppStackParamList } from './types';

const NeoSeniorStack = createNativeStackNavigator<NeoSeniorAppStackParamList>();
const NeoCareStack = createNativeStackNavigator<NeoCareAppStackParamList>();

// Each role's tabs live at the root of a native stack so shared detail screens
// (log entry, vital trend, medication edit) can be pushed over them. Headers are
// hidden — detail screens render their own brand BackHeader inside `Screen`.
export function NeoSeniorAppNavigator() {
  return (
    <NeoSeniorStack.Navigator screenOptions={{ headerShown: false }}>
      <NeoSeniorStack.Screen name="Tabs" component={NeoSeniorTabNavigator} />
      <NeoSeniorStack.Screen name="HealthLogEntry" component={HealthLogEntryScreen} />
      <NeoSeniorStack.Screen name="EditProfile" component={EditProfileScreen} />
    </NeoSeniorStack.Navigator>
  );
}

export function NeoCareAppNavigator() {
  return (
    <NeoCareStack.Navigator screenOptions={{ headerShown: false }}>
      <NeoCareStack.Screen name="Tabs" component={NeoCareTabNavigator} />
      <NeoCareStack.Screen name="HealthLogEntry" component={HealthLogEntryScreen} />
      <NeoCareStack.Screen name="EditProfile" component={EditProfileScreen} />
      <NeoCareStack.Screen name="AddSenior" component={AddSeniorScreen} />
      <NeoCareStack.Screen name="CreateSenior" component={CreateSeniorScreen} />
    </NeoCareStack.Navigator>
  );
}
