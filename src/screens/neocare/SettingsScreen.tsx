import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getLinkedProfiles } from '../../services/dashboard.service';
import { getMyProfile, getMyData, deleteMyAccount } from '../../services/users.service';
import { logout as logoutApi } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { useSelectedSenior } from '../../store/selectedSenior.store';
import { PreferredLang } from '../../services/types';
import { NeoCareAppStackParamList } from '../../navigation/types';
import Logo from '../../components/Logo';
import BrandAlert from '../../components/BrandAlert';
import { Colors, Brand, Fonts, FontSize, Spacing, BorderRadius, MinTapTarget } from '../../theme';

// ─── Screen-specific tokens ───────────────────────────────────────────────────
const SIGN_OUT_RED = '#FF2D2D';
const HERO_BG = Brand.primary;
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

// ─── Row sub-components ───────────────────────────────────────────────────────

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

function StatusRow({
  status,
  showDivider = true,
}: {
  status: string;
  showDivider?: boolean;
}) {
  const isActive = status === 'active';
  return (
    <View style={[row.base, showDivider && row.divider]}>
      <Text style={row.label}>Link Status</Text>
      <View style={row.statusGroup}>
        <Ionicons
          name={isActive ? 'checkmark-done' : 'time-outline'}
          size={15}
          color={Brand.mutedTeal}
        />
        <Text style={row.value}>{isActive ? 'Active' : 'Pending'}</Text>
      </View>
    </View>
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

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NeoCareSettingsScreen() {
  const { i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, setUser, logout } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<NeoCareAppStackParamList>>();

  const [langVisible, setLangVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const profileQ = useQuery({ queryKey: ['myProfile'], queryFn: getMyProfile });
  const profilesQ = useQuery({ queryKey: ['linkedProfiles'], queryFn: getLinkedProfiles });

  const displayName = profileQ.data?.fullName ?? user?.displayName ?? '';
  // Show email if present, fall back to phone (some NeoCare users sign in with OTP).
  const contact = user?.email ?? profileQ.data?.phone ?? user?.phone ?? '—';
  const address = profileQ.data?.address ?? '—';
  const profiles = profilesQ.data ?? [];
  // Show the first active senior, fall back to the first profile of any status.
  const primarySenior =
    profiles.find((p) => p.status === 'active') ?? profiles[0];

  const currentLang = (i18n.language ?? 'en').startsWith('en') ? 'English' : 'Twi';

  const setLanguage = (lang: PreferredLang) => {
    i18n.changeLanguage(lang);
    if (user) setUser({ ...user, language: lang });
  };

  const handleExport = async () => {
    setPrivacyVisible(false);
    try {
      const { Share } = await import('react-native');
      const data = await getMyData();
      await Share.share({ message: JSON.stringify(data, null, 2) });
    } catch {
      setExportError('Could not export data. Please try again.');
    }
  };

  const confirmDelete = async () => {
    setDeleteConfirm(false);
    try {
      await deleteMyAccount();
    } finally {
      logout();
    }
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
        {displayName ? (
          <Text style={styles.greeting}>Hello, {displayName.split(' ')[0]}</Text>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>
        {/* B. Profile hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroInitials}>
              {displayName ? getInitials(displayName) : '??'}
            </Text>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroName} numberOfLines={1}>
              {displayName || 'Your Name'}
            </Text>
            <Text style={styles.heroRole}>NeoCare</Text>
          </View>
        </View>

        {/* 1. Personal Identity */}
        <Text style={styles.sectionHeader}>Personal</Text>
        <View style={styles.card}>
          <InfoRow label="Full Name" value={displayName || '—'} />
          <InfoRow label="Contact" value={contact} />
          <InfoRow label="Address" value={address} showDivider={false} />
        </View>

        {/* 2. My Seniors */}
        <Text style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>My Seniors</Text>
        <View style={styles.card}>
          {profilesQ.isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={Brand.primary} size="small" />
            </View>
          ) : primarySenior ? (
            <>
              <ActionRow
                label="Active Senior"
                value={primarySenior.fullName}
                onPress={() =>
                  navigation.navigate('EditProfile', {
                    nsrId: primarySenior.neoSeniorId,
                  })
                }
              />
              <StatusRow status={primarySenior.status} />
              <ActionRow
                label="Add Senior"
                onPress={() => navigation.navigate('AddSenior')}
                showDivider={false}
              />
            </>
          ) : (
            <ActionRow
              label="Add Senior"
              onPress={() => navigation.navigate('AddSenior')}
              showDivider={false}
            />
          )}
        </View>

        {/* 3. Account */}
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

      {/* Privacy & Data options */}
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

      {/* Delete account confirmation */}
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
  greeting: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    color: Brand.primary,
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },

  // Hero card
  heroCard: {
    backgroundColor: HERO_BG,
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
    fontFamily: Fonts.headingBold,
    fontSize: 18,
    fontWeight: '700',
    color: Brand.primary,
  },
  heroText: { flex: 1 },
  heroName: {
    fontFamily: Fonts.headingBold,
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

  // Section headers
  sectionHeader: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Brand.primary,
    marginBottom: Spacing.md,
    paddingHorizontal: 4,
  },

  // Card wrapper
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: Spacing.base,
    overflow: 'hidden',
  },

  loadingRow: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
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
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  signOut: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: SIGN_OUT_RED,
  },
});
