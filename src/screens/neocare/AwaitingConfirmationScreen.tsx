import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import NeoCareShell from '../../components/NeoCareShell';
import BrandAlert from '../../components/BrandAlert';
import { NeoCareAppStackParamList } from '../../navigation/types';
import { getLinkedProfiles } from '../../services/dashboard.service';
import { Brand, Fonts, FontSize } from '../../theme';

type RouteProps = RouteProp<NeoCareAppStackParamList, 'AwaitingConfirmation'>;

export default function AwaitingConfirmationScreen() {
  const { params } = useRoute<RouteProps>();
  const { pendingUserName } = params;
  const navigation = useNavigation<NativeStackNavigationProp<NeoCareAppStackParamList>>();
  const [reminderVisible, setReminderVisible] = useState(false);

  // Poll every 10 s — navigate as soon as the NeoSenior approves.
  const nsr = `NSR-${pendingUserName}`;
  const { data: profiles } = useQuery({
    queryKey: ['linkedProfiles'],
    queryFn: getLinkedProfiles,
    refetchInterval: 10_000,
  });

  useEffect(() => {
    if (!profiles) return;
    const confirmed = profiles.find((p) => p.neoSeniorId === nsr);
    if (confirmed) {
      navigation.replace('AccountConfirmed', { confirmedUserName: confirmed.fullName });
    }
  }, [profiles, nsr, navigation]);

  return (
    <NeoCareShell activeTab="Dashboard">
      <View style={styles.body}>
        {/* ── Status icon badge ── */}
        <View style={styles.outerCircle}>
          <View style={styles.innerCircle}>
            <View style={styles.glyphCircle}>
              <Text style={styles.glyphText}>?</Text>
            </View>
          </View>
        </View>

        {/* ── Status header ── */}
        <Text style={styles.title}>Awaiting Confirmation</Text>

        {/* ── Dotted divider ── */}
        <View style={styles.divider} />

        {/* ── Description ── */}
        <Text style={styles.description}>
          <Text style={styles.nameHighlight}>{pendingUserName}</Text>
          {' '}has to approve your request
        </Text>

        {/* ── Reminder button ── */}
        <Pressable
          onPress={() => setReminderVisible(true)}
          style={({ pressed }) => [styles.reminderButton, pressed && { opacity: 0.75 }]}
          accessibilityRole="button"
          accessibilityLabel="Send a Reminder"
        >
          <Text style={styles.reminderButtonText}>Send a Reminder</Text>
        </Pressable>
      </View>

      <BrandAlert
        visible={reminderVisible}
        title="Send a Reminder"
        message="Nudge the NeoSenior and tell them to accept your request on their dashboard."
        onDismiss={() => setReminderVisible(false)}
      />
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

  // Icon badge
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
  glyphCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F7EFE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glyphText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: '#00333A',
    lineHeight: 16,
    textAlign: 'center',
  },

  // Text
  title: {
    fontFamily: Fonts.bodyBold,
    fontSize: 22,
    color: '#00333A',
    textAlign: 'center',
    marginTop: 24,
  },

  // Divider
  divider: {
    width: 140,
    height: 0,
    borderWidth: 1,
    borderColor: '#3A5E65',
    borderStyle: 'dashed',
    marginVertical: 14,
  },

  // Description
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

  // Reminder button
  reminderButton: {
    backgroundColor: '#00333A',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  reminderButtonText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
