import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  StatusBar,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';

import { inviteNeoCare } from '../../services/onboarding.service';
import { getMyProfile, getMyData, deleteMyAccount } from '../../services/users.service';
import { logout as logoutApi } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { PreferredLang } from '../../services/types';
import { NeoSeniorAppStackParamList } from '../../navigation/types';
import Logo from '../../components/Logo';
import BrandAlert from '../../components/BrandAlert';
import { Colors, Brand, Fonts, FontSize, Spacing, BorderRadius } from '../../theme';

// ─── Screen-specific tokens ───────────────────────────────────────────────────

const SIGN_OUT_RED = '#FF2D2D';
const AVATAR_HALO = '#C2EAF2';
const ROW_DIVIDER = '#EFEBE4';
const CARD_BORDER = '#FFE6D5';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

// ─── Row sub-components (mirrors NeoCare settings pattern) ────────────────────

function InfoRow({
  label,
  value,
  showDivider = true,
}: {
  label: string;
  value: string;
  showDivider?: boolean;
}) {
  return (
    <View style={[row.base, showDivider && row.divider]}>
      <Text style={row.label}>{label}</Text>
      <Text style={row.value} numberOfLines={1} ellipsizeMode="tail">
        {value}
      </Text>
    </View>
  );
}

function ActionRow({
  label,
  value,
  onPress,
  showDivider = true,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  showDivider?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [row.base, showDivider && row.divider, pressed && row.pressed]}
    >
      <Text style={row.label}>{label}</Text>
      <View style={row.trailingGroup}>
        {!!value && (
          <Text style={row.value} numberOfLines={1} ellipsizeMode="tail">
            {value}
          </Text>
        )}
        <Ionicons name="chevron-forward" size={16} color={Brand.mutedTeal} />
      </View>
    </Pressable>
  );
}

function SignOutRow({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [row.base, pressed && row.pressed]}
    >
      <Text style={row.signOut}>Sign Out</Text>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NeoSeniorSettingsScreen() {
  const { i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, setUser, logout } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<NeoSeniorAppStackParamList>>();

  const [langVisible, setLangVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // ── Data ───────────────────────────────────────────────────────────────────
  const profileQ = useQuery({ queryKey: ['myProfile'], queryFn: getMyProfile });
  const inviteQ = useQuery({
    queryKey: ['inviteNeoCare'],
    queryFn: inviteNeoCare,
    enabled: !user?.neoSeniorId,
  });

  const displayName = profileQ.data?.fullName ?? user?.displayName ?? '';
  const contact = user?.email ?? profileQ.data?.phone ?? user?.phone ?? '—';
  const address = profileQ.data?.address ?? '—';
  const nsr = user?.neoSeniorId ?? inviteQ.data?.neoSeniorId;
  const currentLang = (i18n.language ?? 'en').startsWith('en') ? 'English' : 'Twi';

  // ── Handlers ───────────────────────────────────────────────────────────────
  const setLanguage = (lang: PreferredLang) => {
    i18n.changeLanguage(lang);
    if (user) setUser({ ...user, language: lang });
  };

  const handleExport = async () => {
    setPrivacyVisible(false);
    try {
      const data = await getMyData();
      await Share.share({ message: JSON.stringify(data, null, 2) });
    } catch {
      setExportError('Could not export data. Please try again.');
    }
  };

  const confirmDelete = async () => {
    setDeleteConfirm(false);
    try { await deleteMyAccount(); } finally { logout(); }
  };

  const handleSignOut = async () => {
    await logoutApi();
    logout();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Logo />
        <View style={styles.userCluster}>
          {displayName ? (
            <Text style={styles.headerName} numberOfLines={1}>
              {displayName.trim()}
            </Text>
          ) : null}
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallInitials}>
              {displayName ? getInitials(displayName) : '?'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroInitials}>
              {displayName ? getInitials(displayName) : '?'}
            </Text>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroName} numberOfLines={1}>
              {displayName || 'Your Name'}
            </Text>
            <Text style={styles.heroRole}>NeoSenior</Text>
          </View>
        </View>

        {/* 1. Personal */}
        <Text style={styles.sectionHeader}>Personal</Text>
        <View style={styles.card}>
          <InfoRow label="Full Name" value={displayName || '—'} />
          <InfoRow label="Contact" value={contact} />
          <InfoRow label="Address" value={address} showDivider={false} />
        </View>

        {/* 2. My Profile */}
        <Text style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>My Profile</Text>
        <View style={styles.card}>
          <ActionRow
            label="Edit my profile"
            onPress={() => nsr && navigation.navigate('EditProfile', { nsrId: nsr })}
            showDivider={false}
          />
        </View>

        {/* 3. Sharing & Caregivers */}
        <Text style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          Sharing & Caregivers
        </Text>

        {/* NSR ID card */}
        {nsr ? (
          <View style={styles.nsrCard}>
            <Text style={styles.nsrLabel}>YOUR NEOSENIOR ID</Text>
            <Text style={styles.nsrCode}>{nsr}</Text>
            <View style={styles.nsrActions}>
              <Pressable
                style={styles.nsrCopyBtn}
                onPress={() => Clipboard.setStringAsync(nsr)}
                accessibilityRole="button"
                accessibilityLabel="Copy NeoSenior ID"
              >
                <Ionicons name="copy-outline" size={18} color="#fff" />
                <Text style={styles.nsrCopyText}>Copy</Text>
              </Pressable>
              <Pressable
                style={styles.nsrShareBtn}
                onPress={() => Share.share({ message: nsr })}
                accessibilityRole="button"
                accessibilityLabel="Share NeoSenior ID"
              >
                <Ionicons name="share-social-outline" size={18} color={Brand.primary} />
                <Text style={styles.nsrShareText}>Share</Text>
              </Pressable>
            </View>
          </View>
        ) : inviteQ.isLoading ? (
          <ActivityIndicator
            color={Brand.primary}
            style={{ marginVertical: Spacing.lg }}
          />
        ) : null}

        <View style={styles.card}>
          <ActionRow
            label="Caregiver Requests"
            onPress={() => navigation.navigate('CaregiverRequests')}
            showDivider={false}
          />
        </View>

        {/* 4. Account */}
        <Text style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>Account</Text>
        <View style={styles.card}>
          <ActionRow
            label="Language"
            value={currentLang}
            onPress={() => setLangVisible(true)}
          />
          <ActionRow
            label="Privacy & Data"
            onPress={() => setPrivacyVisible(true)}
          />
          <SignOutRow onPress={handleSignOut} />
        </View>
      </ScrollView>

      {/* Language picker */}
      <BrandAlert
        visible={langVisible}
        title="Select Language"
        message="Choose your preferred display language."
        buttons={[
          {
            label: 'Twi',
            variant: currentLang === 'Twi' ? 'filled' : 'ghost',
            onPress: () => { setLanguage('tw'); setLangVisible(false); },
          },
          {
            label: 'English',
            variant: currentLang === 'English' ? 'filled' : 'ghost',
            onPress: () => { setLanguage('en'); setLangVisible(false); },
          },
        ]}
        onDismiss={() => setLangVisible(false)}
      />

      {/* Privacy & Data */}
      <BrandAlert
        visible={privacyVisible}
        title="Privacy & Data"
        message="Manage your personal data stored in Neovot."
        buttons={[
          {
            label: 'Delete account',
            variant: 'ghost',
            destructive: true,
            onPress: () => { setPrivacyVisible(false); setDeleteConfirm(true); },
          },
          {
            label: 'Export my data',
            variant: 'filled',
            onPress: handleExport,
          },
        ]}
        onDismiss={() => setPrivacyVisible(false)}
      />

      {/* Delete confirmation */}
      <BrandAlert
        visible={deleteConfirm}
        title="Delete Account"
        message="Your account will be soft-deleted immediately and permanently removed after 30 days. This cannot be undone."
        buttons={[
          { label: 'Cancel', variant: 'ghost', onPress: () => setDeleteConfirm(false) },
          { label: 'Delete', variant: 'filled', destructive: true, onPress: confirmDelete },
        ]}
        onDismiss={() => setDeleteConfirm(false)}
      />

      {/* Export error */}
      <BrandAlert
        visible={!!exportError}
        title="Export Failed"
        message={exportError ?? ''}
        onDismiss={() => setExportError(null)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.bgCream },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    height: 64,
    backgroundColor: '#F5F1E5',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ROW_DIVIDER,
  },
  userCluster: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    color: Brand.primary,
    maxWidth: 120,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.accentPeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallInitials: { fontFamily: Fonts.heading, fontSize: 13, color: Brand.primary },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },

  // Hero card
  heroCard: {
    backgroundColor: Brand.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AVATAR_HALO,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
    flexShrink: 0,
  },
  heroInitials: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    fontWeight: '700',
    color: Brand.primary,
  },
  heroText: { flex: 1 },
  heroName: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  heroRole: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: AVATAR_HALO,
  },

  sectionHeader: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Brand.primary,
    marginBottom: Spacing.md,
    paddingHorizontal: 4,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: Spacing.base,
    overflow: 'hidden',
  },

  // NSR ID card
  nsrCard: {
    backgroundColor: Brand.primary,
    borderRadius: 20,
    padding: 22,
    marginBottom: Spacing.base,
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  nsrLabel: {
    fontFamily: Fonts.heading,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 10,
  },
  nsrCode: {
    fontFamily: 'monospace',
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: 3,
    color: '#FFFFFF',
    marginBottom: 18,
  },
  nsrActions: {
    flexDirection: 'row',
    gap: 10,
  },
  nsrCopyBtn: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nsrCopyText: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    color: '#FFFFFF',
  },
  nsrShareBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nsrShareText: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    color: Brand.primary,
  },
});

const row = StyleSheet.create({
  base: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 54,
    paddingVertical: Spacing.sm,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: ROW_DIVIDER,
  },
  pressed: { opacity: 0.65 },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    fontWeight: '500',
    color: Brand.primary,
    flexShrink: 0,
    marginRight: Spacing.sm,
  },
  value: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.mutedTeal,
    flexShrink: 1,
    textAlign: 'right',
  },
  trailingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  signOut: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: SIGN_OUT_RED,
  },
});
