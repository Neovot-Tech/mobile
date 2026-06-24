import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import NeoCareShell from '../../components/NeoCareShell';
import { NeoCareAppStackParamList } from '../../navigation/types';
import { Brand, Fonts, FontSize } from '../../theme';

type RouteProps = RouteProp<NeoCareAppStackParamList, 'AccountConfirmed'>;

export default function AccountConfirmedScreen() {
  const { params } = useRoute<RouteProps>();
  const { confirmedUserName } = params;
  const navigation = useNavigation<NativeStackNavigationProp<NeoCareAppStackParamList>>();

  return (
    <NeoCareShell activeTab="Dashboard">
      <View style={styles.body}>
        {/* ── Status icon badge ── */}
        <View style={styles.outerCircle}>
          <View style={styles.innerCircle}>
            <Ionicons name="checkmark" size={32} color="#F7EFE2" />
          </View>
        </View>

        {/* ── Status header ── */}
        <Text style={styles.title}>Account Confirmed</Text>

        {/* ── Dotted divider ── */}
        <View style={styles.divider} />

        {/* ── Description ── */}
        <Text style={styles.description}>
          <Text style={styles.nameHighlight}>{confirmedUserName}</Text>
          {' '}has approved your request
        </Text>

        {/* ── Start Monitoring button ── */}
        <Pressable
          onPress={() => navigation.popToTop()}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.75 }]}
          accessibilityRole="button"
          accessibilityLabel="Start Monitoring"
        >
          <Text style={styles.buttonText}>Start Monitoring</Text>
        </Pressable>
      </View>
    </NeoCareShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  outerCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F7EFE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00333A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.bodyBold,
    fontSize: 22,
    color: '#00333A',
    textAlign: 'center',
    marginTop: 24,
  },
  divider: {
    width: 140,
    height: 0,
    borderWidth: 1,
    borderColor: '#3A5E65',
    borderStyle: 'dashed',
    marginVertical: 14,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: FontSize.base,
    color: '#3A5E65',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  nameHighlight: {
    fontFamily: Fonts.bodySemiBold,
    color: Brand.primary,
  },
  button: {
    backgroundColor: '#00333A',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
