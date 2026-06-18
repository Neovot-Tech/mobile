import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Share, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';

import Screen from '../../components/Screen';
import { inviteNeoCare } from '../../services/onboarding.service';
import { getMyData, deleteMyAccount } from '../../services/users.service';
import { logout as logoutApi } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { PreferredLang } from '../../services/types';
import { NeoSeniorAppStackParamList } from '../../navigation/types';
import { Colors, Brand, Fonts, FontSize, Spacing, BorderRadius } from '../../theme';

export default function NeoSeniorSettingsScreen() {
  const { t, i18n } = useTranslation();
  const { user, setUser, logout } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<NeoSeniorAppStackParamList>>();

  const inviteQ = useQuery({
    queryKey: ['inviteNeoCare'],
    queryFn: inviteNeoCare,
    enabled: !user?.neoSeniorId,
  });
  const nsr = user?.neoSeniorId ?? inviteQ.data?.neoSeniorId;

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
    Alert.alert(
      t('neoSeniorSettings.deleteConfirmTitle'),
      t('neoSeniorSettings.deleteConfirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('neoSeniorSettings.deleteConfirmCta'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMyAccount();
            } finally {
              logout();
            }
          },
        },
      ],
    );
  };

  const handleLogout = async () => {
    await logoutApi();
    logout();
  };

  const currentLang = (i18n.language ?? 'en').startsWith('tw') ? 'tw' : 'en';

  return (
    <Screen contentContainerStyle={styles.content}>
      <Text style={styles.h1}>{t('neoSeniorSettings.title')}</Text>

      {/* Profile */}
      <Text style={styles.sectionLabel}>{t('neoSeniorSettings.profile')}</Text>
      <Pressable
        style={({ pressed }) => [styles.rowCard, !nsr && styles.rowCardDisabled, pressed && styles.rowCardPressed]}
        onPress={() => nsr && navigation.navigate('EditProfile', { nsrId: nsr })}
        disabled={!nsr}
        accessibilityRole="button"
      >
        <View style={styles.iconCirclePeach}>
          <Ionicons name="person-outline" size={24} color={Brand.primary} />
        </View>
        <Text style={styles.rowCardLabel}>{t('neoSeniorSettings.editProfile')}</Text>
        <Ionicons name="chevron-forward" size={20} color="#c2ccce" />
      </Pressable>

      {/* Sharing & caregivers */}
      <Text style={styles.sectionLabel}>{t('neoSeniorSettings.sharing')}</Text>
      <Text style={styles.hint}>{t('neoSeniorSettings.yourIdHint')}</Text>

      {nsr ? (
        <View style={styles.nsrCard}>
          <Text style={styles.nsrCardLabel}>YOUR NEOSENIOR ID</Text>
          <Text style={styles.nsrCode}>{nsr}</Text>
          <View style={styles.nsrActions}>
            <Pressable
              style={styles.nsrCopyBtn}
              onPress={() => Clipboard.setStringAsync(nsr)}
              accessibilityRole="button"
              accessibilityLabel={t('common.copy')}
            >
              <Ionicons name="copy-outline" size={20} color="#fff" />
              <Text style={styles.nsrCopyText}>{t('common.copy')}</Text>
            </Pressable>
            <Pressable
              style={styles.nsrShareBtn}
              onPress={() => Share.share({ message: nsr })}
              accessibilityRole="button"
            >
              <Ionicons name="share-social-outline" size={20} color={Brand.primary} />
              <Text style={styles.nsrShareText}>Share</Text>
            </Pressable>
          </View>
        </View>
      ) : inviteQ.isLoading ? (
        <ActivityIndicator color={Brand.primary} style={{ marginVertical: Spacing.lg }} />
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.rowCard, styles.rowCardMarginBottom, pressed && styles.rowCardPressed]}
        onPress={() => Alert.alert(t('neoSeniorSettings.caregiverRequests'))}
        accessibilityRole="button"
      >
        <View style={styles.iconCirclePeach}>
          <Ionicons name="people-outline" size={24} color={Brand.primary} />
        </View>
        <Text style={styles.rowCardLabel}>{t('neoSeniorSettings.caregiverRequests')}</Text>
        <Ionicons name="chevron-forward" size={20} color="#c2ccce" />
      </Pressable>

      {/* Preferences */}
      <Text style={styles.sectionLabel}>{t('neoSeniorSettings.preferences')}</Text>
      <View style={[styles.card, styles.cardMarginBottom]}>
        <View style={styles.langRow}>
          <Text style={styles.rowCardLabel}>{t('neoSeniorSettings.language')}</Text>
          <View style={styles.segment}>
            {(['en', 'tw'] as PreferredLang[]).map((lang) => {
              const active = currentLang === lang;
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
      <Text style={styles.sectionLabel}>{t('neoSeniorSettings.account')}</Text>
      <View style={styles.card}>
        <Pressable
          style={({ pressed }) => [styles.accountRow, pressed && styles.rowCardPressed]}
          onPress={handleExport}
          accessibilityRole="button"
        >
          <Ionicons name="download-outline" size={22} color={Brand.primaryForm} />
          <Text style={styles.accountRowLabel}>{t('neoSeniorSettings.exportData')}</Text>
          <Ionicons name="chevron-forward" size={20} color="#c2ccce" />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.accountRow, styles.accountRowDivider, pressed && styles.rowCardPressed]}
          onPress={handleLogout}
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={22} color={Brand.primaryForm} />
          <Text style={styles.accountRowLabel}>{t('neoSeniorSettings.logout')}</Text>
          <Ionicons name="chevron-forward" size={20} color="#c2ccce" />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.accountRow, styles.accountRowDivider, pressed && styles.rowCardPressed]}
          onPress={handleDelete}
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={22} color={Colors.error} />
          <Text style={[styles.accountRowLabel, { color: Colors.error }]}>{t('neoSeniorSettings.deleteAccount')}</Text>
          <Ionicons name="chevron-forward" size={20} color="#f0b8b0" />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },

  h1: {
    fontFamily: Fonts.heading,
    fontSize: FontSize['3xl'],
    color: Brand.primary,
    marginTop: 6,
    marginBottom: 22,
  },

  sectionLabel: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Brand.mutedTeal,
    marginBottom: 10,
  },

  hint: {
    fontFamily: Fonts.body,
    fontSize: FontSize.lg,
    lineHeight: 27,
    color: Brand.bodyText,
    marginBottom: 14,
  },

  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    padding: 18,
    marginBottom: 26,
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  rowCardMarginBottom: { marginBottom: 26 },
  rowCardDisabled: { opacity: 0.4 },
  rowCardPressed: { opacity: 0.7 },
  rowCardLabel: {
    flex: 1,
    fontFamily: Fonts.heading,
    fontSize: 19,
    color: Brand.primary,
  },
  iconCirclePeach: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Brand.accentPeach,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // NSR card
  nsrCard: {
    backgroundColor: Brand.primary,
    borderRadius: 20,
    padding: 22,
    marginBottom: 14,
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  nsrCardLabel: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
  },
  nsrCode: {
    fontFamily: 'monospace',
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: 3,
    color: '#fff',
    marginBottom: 18,
  },
  nsrActions: {
    flexDirection: 'row',
    gap: 10,
  },
  nsrCopyBtn: {
    flex: 1,
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nsrCopyText: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: '#fff',
  },
  nsrShareBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nsrShareText: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: Brand.primary,
  },

  // Preferences card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    paddingHorizontal: 18,
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardMarginBottom: { marginBottom: 26 },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#f1f0ea',
    borderRadius: 12,
    padding: 4,
  },
  segmentBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 9,
  },
  segmentActive: { backgroundColor: Brand.primaryForm },
  segmentText: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: Brand.mutedTeal,
  },
  segmentTextActive: { color: '#fff' },

  // Account rows
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    minHeight: 56,
  },
  accountRowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#f3ead6',
  },
  accountRowLabel: {
    flex: 1,
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Brand.primary,
  },
});
