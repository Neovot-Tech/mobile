import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Share, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const AVATAR_COLORS = ['#FFD1BB', '#C7E4EC', '#D6E8D1', '#E8D6F0', '#F0E4C0'];
const AVATAR_TEXT_COLORS = ['#7A3B1E', '#1A4A57', '#2A5A30', '#5A2A70', '#6B5A20'];

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

import Screen from '../../components/Screen';
import { getLinkedProfiles } from '../../services/dashboard.service';
import { getMyData, deleteMyAccount } from '../../services/users.service';
import { logout as logoutApi } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { PreferredLang } from '../../services/types';
import { NeoCareAppStackParamList } from '../../navigation/types';
import { Colors, Brand, Fonts, FontSize, Spacing, BorderRadius, MinTapTarget } from '../../theme';

export default function NeoCareSettingsScreen() {
  const { t, i18n } = useTranslation();
  const { user, setUser, logout } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<NeoCareAppStackParamList>>();

  const profilesQ = useQuery({ queryKey: ['linkedProfiles'], queryFn: getLinkedProfiles });
  const profiles = profilesQ.data ?? [];

  const setLanguage = (lang: PreferredLang) => {
    i18n.changeLanguage(lang);
    if (user) setUser({ ...user, language: lang });
  };

  const handleExport = async () => {
    try {
      const data = await getMyData();
      await Share.share({ message: JSON.stringify(data, null, 2) });
    } catch {
      Alert.alert(t('common.error'));
    }
  };

  const handleDelete = () => {
    Alert.alert(t('neoCareSettings.deleteConfirmTitle'), t('neoCareSettings.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('neoCareSettings.deleteConfirmCta'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMyAccount();
          } finally {
            logout();
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    await logoutApi();
    logout();
  };

  return (
    <Screen contentContainerStyle={styles.content}>
        <Text style={styles.h1}>{t('neoCareSettings.title')}</Text>

        {/* Linked seniors */}
        <Text style={styles.sectionLabel}>{t('neoCareSettings.linkedTitle')}</Text>
        {profilesQ.isLoading ? (
          <ActivityIndicator color={Brand.primary} style={{ marginVertical: Spacing.lg }} />
        ) : profiles.length === 0 ? (
          <View style={styles.box}>
            <Text style={styles.boxText}>{t('neoCareSettings.noLinked')}</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {profiles.map((p, i) => (
              <View key={p.userId} style={[styles.linkedRow, i > 0 && styles.divider]}>
                <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
                  <Text style={[styles.avatarText, { color: AVATAR_TEXT_COLORS[i % AVATAR_TEXT_COLORS.length] }]}>
                    {getInitials(p.fullName)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkedName}>{p.fullName}</Text>
                  <Text style={[styles.linkedMeta, p.status === 'pending' && styles.linkedMetaPending]}>
                    {p.neoSeniorId} · {p.status}
                  </Text>
                </View>
                <Pressable
                  onPress={() => navigation.navigate('EditProfile', { nsrId: p.neoSeniorId })}
                  accessibilityRole="button"
                  accessibilityLabel={t('neoCareSettings.editProfile')}
                  style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.6 }]}
                >
                  <Ionicons name="create-outline" size={20} color={Brand.primary} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Preferences */}
        <Text style={styles.sectionLabel}>{t('neoCareSettings.preferences')}</Text>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>{t('neoCareSettings.language')}</Text>
            <View style={styles.segment}>
              {(['en', 'tw'] as PreferredLang[]).map((lang) => {
                const active = (i18n.language ?? 'en').startsWith(lang);
                return (
                  <Pressable
                    key={lang}
                    onPress={() => setLanguage(lang)}
                    style={[styles.segmentBtn, active && styles.segmentActive]}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                      {lang === 'en' ? 'English' : 'Twi'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Account */}
        <Text style={styles.sectionLabel}>{t('neoCareSettings.account')}</Text>
        <View style={styles.card}>
          <SettingsRow icon="download-outline" label={t('neoCareSettings.exportData')} onPress={handleExport} />
          <SettingsRow icon="log-out-outline" label={t('neoCareSettings.logout')} onPress={handleLogout} divider />
          <SettingsRow icon="trash-outline" label={t('neoCareSettings.deleteAccount')} onPress={handleDelete} destructive divider />
        </View>
    </Screen>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  destructive,
  divider,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  divider?: boolean;
}) {
  const color = destructive ? Colors.error : Brand.primaryContent;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, divider && styles.rowDivider, pressed && styles.rowPressed]}
    >
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.rowText, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.bgCream },
  content: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  h1: { fontFamily: Fonts.heading, fontSize: FontSize['2xl'], color: Brand.primary, marginBottom: Spacing.sm },
  sectionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.base,
    color: Brand.primaryText,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    paddingHorizontal: Spacing.lg,
  },
  box: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    padding: Spacing.lg,
  },
  boxText: { fontFamily: Fonts.body, fontSize: FontSize.base, color: Brand.mutedTeal },

  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    paddingVertical: Spacing.base,
    minHeight: MinTapTarget.neoCare,
  },
  divider: { borderTopWidth: 1, borderTopColor: Brand.borderCard },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: Fonts.heading,
    fontSize: 15,
  },
  linkedName: { fontFamily: Fonts.heading, fontSize: FontSize.base, color: Brand.primaryContent },
  linkedMeta: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: Brand.mutedTeal, marginTop: 2 },
  linkedMetaPending: { color: '#9a5b14' },
  editBtn: {
    width: MinTapTarget.neoCare,
    height: MinTapTarget.neoCare,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.base },
  rowLabel: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.lg, color: Brand.primaryContent },
  segment: { flexDirection: 'row', backgroundColor: Brand.bgWarmCard, borderRadius: BorderRadius.full, padding: 3 },
  segmentBtn: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  segmentActive: { backgroundColor: Brand.primary },
  segmentText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.sm, color: Brand.primaryText },
  segmentTextActive: { color: Colors.white },

  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base, minHeight: MinTapTarget.neoSenior, paddingVertical: Spacing.base },
  rowDivider: { borderTopWidth: 1, borderTopColor: Brand.borderCard },
  rowPressed: { opacity: 0.6 },
  rowText: { flex: 1, fontFamily: Fonts.bodyMedium, fontSize: FontSize.lg },
});
