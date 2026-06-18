import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import {
  getLinkedProfiles,
  getDashboardSummary,
  getAlerts,
  acknowledgeAlert,
  LinkedProfile,
} from '../../services/dashboard.service';
import { getApiErrorMessage } from '../../services/http';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '../../store/auth.store';
import { useSelectedSenior } from '../../store/selectedSenior.store';
import { useCreatedSeniors, CreatedSenior } from '../../store/createdSeniors.store';
import Screen from '../../components/Screen';
import ProfileNudgeBanner from '../../components/ProfileNudgeBanner';
import { useProfileNudge } from '../../hooks/useProfileNudge';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NeoCareAppStackParamList } from '../../navigation/types';
import { Colors, Brand, Spacing, FontSize, Fonts, BorderRadius, MinTapTarget } from '../../theme';

const AVATAR_COLORS = ['#FFD1BB', '#C7E4EC', '#D6E8D1', '#E8D6F0', '#F0E4C0'];

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export default function NeoCaresDashboardScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const firstName = useAuthStore((s) => (s.user?.displayName ?? '').split(' ')[0]);

  const nudge = useProfileNudge();
  const navigation = useNavigation<NativeStackNavigationProp<NeoCareAppStackParamList>>();

  const profilesQ = useQuery({ queryKey: ['linkedProfiles'], queryFn: getLinkedProfiles });
  const profiles = profilesQ.data ?? [];

  const { senior, setSenior } = useSelectedSenior();
  const selected: LinkedProfile | undefined = useMemo(() => {
    if (!profiles.length) return undefined;
    return profiles.find((p) => p.userId === senior?.userId) ?? profiles[0];
  }, [profiles, senior]);

  // Keep the shared selection valid as profiles load/change.
  useEffect(() => {
    if (profiles.length && !profiles.find((p) => p.userId === senior?.userId)) {
      setSenior(profiles[0]);
    }
  }, [profiles, senior, setSenior]);

  // Seniors this NeoCare created who haven't activated yet (show "share code").
  const created = useCreatedSeniors((s) => s.created);
  const reconcile = useCreatedSeniors((s) => s.reconcile);
  useEffect(() => {
    if (profiles.length) reconcile(profiles.map((p) => p.neoSeniorId));
  }, [profiles, reconcile]);

  const goAdd = () => navigation.navigate('AddSenior');

  return (
    <Screen
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={profilesQ.isRefetching}
          onRefresh={() => profilesQ.refetch()}
          tintColor={Brand.primary}
        />
      }
    >
        <Text style={styles.greeting}>
          {firstName ? t('neoCare.greeting', { name: firstName }) : t('neoCare.dashboard')}
        </Text>
        <Text style={styles.h1}>{t('neoCare.dashboard')}</Text>


        <ProfileNudgeBanner
          visible={nudge.visible}
          onDismiss={nudge.dismiss}
          onComplete={() => selected?.neoSeniorId && navigation.navigate('EditProfile', { nsrId: selected.neoSeniorId })}
          seniorName={selected?.fullName}
        />

        {profilesQ.isLoading ? (
          <ActivityIndicator color={Brand.primary} style={{ marginTop: Spacing['3xl'] }} />
        ) : profilesQ.isError ? (
          <ErrorRow message={getApiErrorMessage(profilesQ.error)} onRetry={() => profilesQ.refetch()} />
        ) : (
          <>
            {/* Created-but-not-yet-activated seniors — share the code with them */}
            {created.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>{t('neoCare.pendingTitle')}</Text>
                {created.map((c) => (
                  <PendingCreatedCard key={c.nsr} item={c} />
                ))}
              </>
            )}

            {profiles.length > 0 ? (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
                  {profiles.map((p, idx) => {
                    const active = p.userId === selected?.userId;
                    return (
                      <Pressable
                        key={p.userId}
                        onPress={() => setSenior(p)}
                        accessibilityRole="button"
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        {active && (
                          <View style={[styles.chipAvatar, { backgroundColor: getAvatarColor(idx) }]}>
                            <Text style={styles.chipAvatarText}>{getInitials(p.fullName)}</Text>
                          </View>
                        )}
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {p.fullName}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {selected && <SeniorPanel key={selected.userId} profile={selected} />}
              </>
            ) : created.length === 0 ? (
              <EmptyState onAdd={goAdd} />
            ) : null}

            <Pressable style={styles.addBtn} onPress={goAdd} accessibilityRole="button">
              <Ionicons name="add-circle-outline" size={20} color={Brand.primary} />
              <Text style={styles.addBtnText}>{t('neoCare.addSenior')}</Text>
            </Pressable>
          </>
        )}
    </Screen>
  );
}

function SeniorPanel({ profile }: { profile: LinkedProfile }) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const summaryQ = useQuery({
    queryKey: ['dashboardSummary', profile.userId],
    queryFn: () => getDashboardSummary(profile.userId),
  });
  const alertsQ = useQuery({
    queryKey: ['alerts', profile.userId],
    queryFn: () => getAlerts(profile.userId),
  });

  const ackMut = useMutation({
    mutationFn: (alertId: string) => acknowledgeAlert(alertId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts', profile.userId] }),
  });

  const s = summaryQ.data;
  const lastLog = s?.lastLogAt ? new Date(s.lastLogAt).toLocaleDateString() : t('neoCare.never');

  return (
    <>
      <Text style={styles.sectionLabel}>{t('neoCare.summaryTitle')}</Text>
      {summaryQ.isLoading ? (
        <ActivityIndicator color={Brand.primary} style={{ marginVertical: Spacing.lg }} />
      ) : summaryQ.isError ? (
        <ErrorRow message={getApiErrorMessage(summaryQ.error)} onRetry={() => summaryQ.refetch()} />
      ) : s ? (
        <View style={styles.statGrid}>
          <Stat label={t('neoCare.statDaysLogged')} value={s.daysLogged} />
          <Stat label={t('neoCare.statLastLog')} value={lastLog} />
          <Stat label={t('neoCare.statHighBp')} value={s.highBpDays} warn={s.highBpDays > 0} />
          <Stat label={t('neoCare.statHighSugar')} value={s.highSugarDays} warn={s.highSugarDays > 0} />
          <Stat label={t('neoCare.statSpo2Low')} value={s.spo2LowDays} warn={s.spo2LowDays > 0} />
          <Stat label={t('neoCare.statMedsMissed')} value={s.medsMissed} warn={s.medsMissed > 0} />
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>{t('neoCare.alertsTitle')}</Text>
      {alertsQ.isLoading ? (
        <ActivityIndicator color={Brand.primary} style={{ marginVertical: Spacing.lg }} />
      ) : (alertsQ.data ?? []).length === 0 ? (
        <View style={styles.noAlertsBox}>
          <Text style={styles.muted}>{t('neoCare.noAlerts')}</Text>
        </View>
      ) : (
        (alertsQ.data ?? []).map((a) => (
          <View key={a.id} style={styles.alertCard}>
            <View style={[styles.alertStripe, alertStripeStyle(a.tier)]} />
            <View style={styles.alertBody}>
              <Text style={styles.alertMeta}>
                {a.tier.toUpperCase()} · {new Date(a.createdAt ?? '').toLocaleDateString()}
              </Text>
              <Text style={styles.alertReason}>{a.reason}</Text>
            </View>
            {!a.acknowledgedAt && (
              <Pressable
                style={styles.ackBtn}
                onPress={() => ackMut.mutate(a.id)}
                disabled={ackMut.isPending}
                accessibilityRole="button"
              >
                <Text style={styles.ackText}>{t('neoCare.acknowledge')}</Text>
              </Pressable>
            )}
          </View>
        ))
      )}
    </>
  );
}

function PendingCreatedCard({ item }: { item: CreatedSenior }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await Clipboard.setStringAsync(item.nsr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <View style={styles.pendingCard}>
      <View style={styles.pendingHeader}>
        <Ionicons name="hourglass-outline" size={18} color={Brand.mutedTeal} />
        <Text style={styles.pendingName}>{item.name}</Text>
      </View>
      <Text style={styles.pendingInstruction}>
        {t('neoCare.pendingInstruction', { name: item.name })}
      </Text>
      <Pressable style={styles.codeBox} onPress={copy} accessibilityRole="button">
        <Text style={styles.codeText}>{item.nsr}</Text>
        <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={Brand.primary} />
      </Pressable>
      <Text style={styles.pendingHint}>{t('neoCare.pendingHint')}</Text>
    </View>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="people-outline" size={34} color={Brand.primary} />
      </View>
      <Text style={styles.emptyTitle}>{t('neoCare.noLinkedTitle')}</Text>
      <Text style={styles.emptyBody}>{t('neoCare.noLinkedBody')}</Text>
      <Pressable style={styles.emptyAddBtn} onPress={onAdd} accessibilityRole="button">
        <Ionicons name="add" size={20} color={Colors.white} />
        <Text style={styles.emptyAddText}>{t('neoCare.addSenior')}</Text>
      </Pressable>
    </View>
  );
}

function Stat({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <View style={[styles.stat, warn && styles.statWarn]}>
      <View style={styles.statTop}>
        <Text style={[styles.statValue, warn && styles.statValueWarn]}>{value}</Text>
        {warn && <Ionicons name="warning" size={16} color={Colors.error} />}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ErrorRow({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.errorRow}>
      <Text style={styles.error}>{message}</Text>
      <Pressable onPress={onRetry} accessibilityRole="button" hitSlop={8}>
        <Text style={styles.retry}>{t('common.retry')}</Text>
      </Pressable>
    </View>
  );
}

function tierStyle(tier: string) {
  const t = tier.toLowerCase();
  if (t === 'urgent') return { backgroundColor: Colors.error };
  if (t === 'warning') return { backgroundColor: Colors.warning };
  return { backgroundColor: Colors.textMuted };
}

function alertStripeStyle(tier: string) {
  const t = tier.toLowerCase();
  if (t === 'urgent') return { backgroundColor: Colors.error };
  if (t === 'warning') return { backgroundColor: Colors.warning };
  return { backgroundColor: Colors.textMuted };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.bgCream },
  content: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },

  greeting: { fontFamily: Fonts.body, fontSize: FontSize.base, color: Brand.mutedTeal },
  h1: {
    fontFamily: Fonts.heading,
    fontSize: FontSize['3xl'],
    color: Brand.primary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },

  sectionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.base,
    color: Brand.primaryText,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },

  chips: { flexGrow: 0, marginBottom: Spacing.base },
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
  chipAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipAvatarText: {
    fontFamily: Fonts.heading,
    fontSize: 11,
    color: Brand.primary,
  },
  chipText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.sm, color: Brand.primaryText },
  chipTextActive: { color: Colors.white },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  stat: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    padding: Spacing.base,
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  statWarn: {
    borderColor: 'rgba(232,68,46,0.25)',
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statValue: {
    fontFamily: Fonts.heading,
    fontSize: 32,
    color: Brand.primary,
    lineHeight: 36,
  },
  statValueWarn: { color: Colors.error },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.bodyText,
    marginTop: Spacing.xs,
  },

  alertCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  alertStripe: {
    width: 4,
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
  },
  alertBody: {
    flex: 1,
    padding: Spacing.base,
    gap: 4,
  },
  alertMeta: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 0.5,
    color: Brand.mutedTeal,
  },
  alertReason: { fontFamily: Fonts.body, fontSize: FontSize.base, color: Brand.primaryContent, lineHeight: 22 },
  ackBtn: {
    minHeight: MinTapTarget.neoCare,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    margin: Spacing.sm,
    borderWidth: 1,
    borderColor: Brand.borderForm,
    borderRadius: BorderRadius.sm,
  },
  ackText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.sm, color: Brand.primary },

  noAlertsBox: {
    paddingVertical: Spacing.base,
  },

  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    padding: Spacing.xl,
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Brand.accentPeach,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.lg,
    color: Brand.primary,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: Fonts.body,
    fontSize: FontSize.base,
    lineHeight: 22,
    color: Brand.bodyText,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  inputLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.sm,
    color: Brand.primaryText,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
    width: '100%',
  },
  input: {
    minHeight: MinTapTarget.neoCare,
    borderWidth: 1,
    borderColor: Brand.borderForm,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.base,
    fontSize: FontSize.base,
    fontFamily: 'monospace',
    color: Brand.inputText,
    backgroundColor: Colors.surface,
    width: '100%',
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef5f6',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    width: '100%',
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: MinTapTarget.neoSenior,
    backgroundColor: Brand.primaryForm,
    borderRadius: BorderRadius.sm,
    alignSelf: 'stretch',
    marginTop: Spacing.lg,
  },
  linkBtnDisabled: { opacity: 0.5 },
  linkBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.base, color: Colors.white },

  muted: { fontFamily: Fonts.body, fontSize: FontSize.base, color: Colors.textMuted },
  errorRow: { marginTop: Spacing.lg, gap: Spacing.sm },
  error: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: Colors.error, marginTop: Spacing.sm },
  success: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: Colors.success },
  retry: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.base, color: Brand.primary },

  pendingCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  pendingHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  pendingName: { fontFamily: Fonts.heading, fontSize: FontSize.lg, color: Brand.primary },
  pendingInstruction: { fontFamily: Fonts.body, fontSize: FontSize.base, lineHeight: 22, color: Brand.bodyText },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.bgWarmCard,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Brand.borderForm,
    borderStyle: 'dashed',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  codeText: { fontFamily: Fonts.heading, fontSize: FontSize.xl, letterSpacing: 2, color: Brand.primary },
  pendingHint: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: Brand.mutedTeal, marginTop: Spacing.sm },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: MinTapTarget.neoCare,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Brand.borderForm,
    borderStyle: 'dashed',
    marginTop: Spacing.lg,
  },
  addBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.base, color: Brand.primary },

  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: MinTapTarget.neoSenior,
    alignSelf: 'stretch',
    backgroundColor: Brand.primary,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  emptyAddText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.base, color: Colors.white },
});
