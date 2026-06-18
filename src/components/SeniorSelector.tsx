import React, { useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { getLinkedProfiles } from '../services/dashboard.service';
import { useSelectedSenior } from '../store/selectedSenior.store';
import { Colors, Brand, Fonts, FontSize, Spacing, BorderRadius, MinTapTarget } from '../theme';

const AVATAR_COLORS = ['#FFD1BB', '#C7E4EC', '#D6E8D1', '#E8D6F0', '#F0E4C0'];

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

/**
 * Horizontal chips of the NeoCare's linked seniors. Writes the active one to the
 * shared selectedSenior store. Renders loading/empty states. Returns whether a
 * senior is available via the store (read by the parent screen).
 */
export default function SeniorSelector() {
  const { t } = useTranslation();
  const { senior, setSenior } = useSelectedSenior();

  const profilesQ = useQuery({ queryKey: ['linkedProfiles'], queryFn: getLinkedProfiles });
  const profiles = profilesQ.data ?? [];

  // Default to the first senior (or refresh the stored copy if it changed).
  useEffect(() => {
    if (!profiles.length) return;
    const current = profiles.find((p) => p.userId === senior?.userId);
    if (!current) setSenior(profiles[0]);
    else if (current !== senior) setSenior(current);
  }, [profiles, senior, setSenior]);

  if (profilesQ.isLoading) {
    return <ActivityIndicator color={Brand.primary} style={{ marginVertical: Spacing.lg }} />;
  }
  if (profiles.length === 0) {
    return <Text style={styles.empty}>{t('neoCare.dashboardEmpty')}</Text>;
  }
  if (profiles.length === 1) return null; // nothing to switch between

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
      {profiles.map((p, idx) => {
        const active = p.userId === senior?.userId;
        return (
          <Pressable
            key={p.userId}
            onPress={() => setSenior(p)}
            accessibilityRole="button"
            style={[styles.chip, active && styles.chipActive]}
          >
            {active && (
              <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }]}>
                <Text style={styles.avatarText}>{getInitials(p.fullName)}</Text>
              </View>
            )}
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{p.fullName}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexGrow: 0, marginBottom: Spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: MinTapTarget.neoCare,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Brand.borderForm,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
  },
  chipActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.heading,
    fontSize: 11,
    color: Brand.primary,
  },
  chipText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.sm, color: Brand.primaryText },
  chipTextActive: { color: Colors.white },
  empty: {
    fontFamily: Fonts.body,
    fontSize: FontSize.base,
    color: Brand.mutedTeal,
    lineHeight: 22,
    marginTop: Spacing.lg,
  },
});
