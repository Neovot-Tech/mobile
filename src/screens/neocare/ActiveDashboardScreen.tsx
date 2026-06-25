import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Path, Line } from 'react-native-svg';

import {
  getLinkedProfiles,
  getDashboardSummary,
  LinkedProfile,
  DashboardSummary,
} from '../../services/dashboard.service';
import { getApiErrorMessage } from '../../services/http';
import { getMyProfile } from '../../services/users.service';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '../../store/auth.store';
import { useSelectedSenior } from '../../store/selectedSenior.store';
import { useCreatedSeniors, CreatedSenior } from '../../store/createdSeniors.store';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NeoCareAppStackParamList, NeoCareTabParamList } from '../../navigation/types';
import { Colors, Brand, Spacing, FontSize, Fonts, BorderRadius, MinTapTarget } from '../../theme';
import Logo from '../../components/Logo';
import BrandAlert from '../../components/BrandAlert';

// ─── Screen-specific design tokens ────────────────────────────────────────────
const C = {
  halo: '#C2EAF2',
  heroYellow: '#FCE3B4',
  dayFilled: '#FDF1D6',
  gridBeige: '#EFEBE4',
  cardBorder: '#FFE6D5',
  tableHeader: Brand.primary,
  tableBorder: '#EFEBE4',
} as const;

const AVATAR_COLORS = ['#FFD1BB', '#C7E4EC', '#D6E8D1', '#E8D6F0', '#F0E4C0'];
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

interface WeekDay {
  dayLabel: string;
  isCurrentDay: boolean;
  isMonitored: boolean;
}

function getWeeklyTracker(daysLogged: number): WeekDay[] {
  const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const todayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0 … Sun=6
  return DAY_LABELS.map((dayLabel, idx) => ({
    dayLabel,
    isCurrentDay: idx === todayIdx,
    isMonitored: idx < todayIdx && idx < daysLogged,
  }));
}

function getHealthStatusText(s: DashboardSummary): string {
  const hasWarning = s.medsMissed > 0 || s.highBpDays > 0 || s.highSugarDays > 0 || s.spo2LowDays > 0;
  return hasWarning ? 'Needs Attention' : 'In Good Health';
}

type StatusType = 'checked' | 'alert' | 'empty';

interface CategoryRow {
  label: string;
  status: StatusType;
}

function getCategories(s: DashboardSummary): CategoryRow[] {
  return [
    { label: 'Medication', status: s.medsMissed > 0 ? 'alert' : 'checked' },
    { label: 'Blood Pressure', status: s.highBpDays > 0 ? 'alert' : 'checked' },
    { label: 'Sugar Levels', status: s.highSugarDays > 0 ? 'alert' : 'checked' },
  ];
}

// ─── Small components ─────────────────────────────────────────────────────────

function CalendarIcon({ size = 20 }: { size?: number }) {
  const color = Brand.primary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={18} rx={2} stroke={color} strokeWidth={1.8} />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function StatusIcon({ type }: { type: StatusType }) {
  if (type === 'checked') {
    return <Ionicons name="checkmark-circle" size={20} color={Colors.success} />;
  }
  if (type === 'alert') {
    return <Ionicons name="warning" size={20} color={Colors.warning} />;
  }
  return <Ionicons name="ellipse-outline" size={20} color={C.gridBeige} />;
}

function ErrorRow({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={misc.errorRow}>
      <Text style={misc.error}>{message}</Text>
      <Pressable onPress={onRetry} accessibilityRole="button" hitSlop={8}>
        <Text style={misc.retry}>{t('common.retry')}</Text>
      </Pressable>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyStateCentered({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={misc.emptyInner}>
      <View style={misc.emptyOuterCircle}>
        <View style={misc.emptyInnerCircle}>
          <Ionicons name="document-text-outline" size={32} color={Colors.white} />
        </View>
      </View>
      <Text style={misc.emptyTitle}>no records found</Text>
      <View style={misc.dashedDivider} />
      <Text style={misc.emptyBody}>
        Add your elderly loved one's account to start monitoring
      </Text>
      <Pressable
        style={({ pressed }) => [misc.emptyAddBtn, pressed && { opacity: 0.8 }]}
        onPress={onAdd}
        accessibilityRole="button"
      >
        <Text style={misc.emptyAddText}>Add account</Text>
      </Pressable>
    </View>
  );
}

// ─── Awaiting state ───────────────────────────────────────────────────────────

function AwaitingState({ nsr }: { nsr: string }) {
  const suffix = nsr.startsWith('NSR-') ? nsr.slice(4) : nsr;
  const [reminderVisible, setReminderVisible] = useState(false);

  return (
    <View style={misc.emptyInner}>
      <View style={misc.emptyOuterCircle}>
        <View style={misc.emptyInnerCircle}>
          <View style={misc.awaitingGlyph}>
            <Text style={misc.awaitingGlyphText}>?</Text>
          </View>
        </View>
      </View>
      <Text style={misc.emptyTitle}>Awaiting Confirmation</Text>
      <View style={misc.dashedDivider} />
      <Text style={misc.emptyBody}>
        The NeoSenior with code{' '}
        <Text style={{ fontFamily: Fonts.bodySemiBold, color: Brand.primary }}>{suffix}</Text>
        {' '}has to approve your request
      </Text>
      <Pressable
        style={({ pressed }) => [misc.emptyAddBtn, pressed && { opacity: 0.8 }]}
        onPress={() => setReminderVisible(true)}
        accessibilityRole="button"
      >
        <Text style={misc.emptyAddText}>Send a Reminder</Text>
      </Pressable>
      <BrandAlert
        visible={reminderVisible}
        title="Send a Reminder"
        message="Nudge the NeoSenior and tell them to accept your request on their dashboard."
        onDismiss={() => setReminderVisible(false)}
      />
    </View>
  );
}

// ─── Pending created card ─────────────────────────────────────────────────────

function PendingCreatedCard({ item }: { item: CreatedSenior }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await Clipboard.setStringAsync(item.nsr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <View style={misc.pendingCard}>
      <View style={misc.pendingHeader}>
        <Ionicons name="hourglass-outline" size={18} color={Brand.mutedTeal} />
        <Text style={misc.pendingName}>{item.name}</Text>
      </View>
      <Text style={misc.pendingInstruction}>
        {t('neoCare.pendingInstruction', { name: item.name })}
      </Text>
      <Pressable style={misc.codeBox} onPress={copy} accessibilityRole="button">
        <Text style={misc.codeText}>{item.nsr}</Text>
        <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={Brand.primary} />
      </Pressable>
      <Text style={misc.pendingHint}>{t('neoCare.pendingHint')}</Text>
    </View>
  );
}

// ─── Active cockpit panel ─────────────────────────────────────────────────────

function CockpitPanel({ profile }: { profile: LinkedProfile }) {
  const navigation = useNavigation<NativeStackNavigationProp<NeoCareAppStackParamList>>();

  const summaryQ = useQuery({
    queryKey: ['dashboardSummary', profile.userId],
    queryFn: () => getDashboardSummary(profile.userId),
  });

  if (summaryQ.isLoading) {
    return (
      <ActivityIndicator
        color={Brand.primary}
        style={{ marginTop: Spacing['2xl'] }}
      />
    );
  }

  if (summaryQ.isError) {
    return (
      <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.lg }}>
        <ErrorRow
          message={getApiErrorMessage(summaryQ.error)}
          onRetry={() => summaryQ.refetch()}
        />
      </View>
    );
  }

  const s = summaryQ.data;
  if (!s) return null;

  const healthStatus = getHealthStatusText(s);
  const categories = getCategories(s);
  const weekDays = getWeeklyTracker(s.daysLogged);
  const monitoredCount = Math.min(s.daysLogged, 7);

  return (
    <>
      {/* B. Quick Metrics Grid */}
      <View style={cockpit.metricsRow}>
        {/* Left: Health status avatar */}
        <View style={cockpit.statusCol}>
          <View style={cockpit.haloCircle} />
          <Text style={cockpit.healthLabel}>Health Status</Text>
          <Text style={cockpit.healthValue}>{healthStatus}</Text>
        </View>

        {/* Right: Category table */}
        <View style={cockpit.tableCol}>
          {/* Table header */}
          <View style={cockpit.tableHeader}>
            <Text style={cockpit.tableHeaderText}>Category</Text>
            <Text style={cockpit.tableHeaderText}>Status</Text>
          </View>
          {/* Data rows */}
          {categories.map((row, idx) => (
            <View
              key={row.label}
              style={[
                cockpit.tableRow,
                idx < categories.length - 1 && cockpit.tableRowBorder,
              ]}
            >
              <Text style={cockpit.tableRowLabel} numberOfLines={1}>
                {row.label}
              </Text>
              <View style={cockpit.statusCell}>
                <StatusIcon type={row.status} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* C. Context Action Bar */}
      <Pressable
        style={({ pressed }) => [cockpit.actionBar, pressed && { opacity: 0.75 }]}
        onPress={() => navigation.navigate('Tabs', { screen: 'Health' } as any)}
        accessibilityRole="button"
        accessibilityLabel="See today's details"
      >
        <View style={cockpit.actionBarLeft}>
          <CalendarIcon size={20} />
          <Text style={cockpit.actionBarText}>See today's details</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Brand.primary} />
      </Pressable>

      {/* D. This Week So Far */}
      <View style={cockpit.weekSection}>
        <Text style={cockpit.weekTitle}>This Week So Far</Text>

        {/* Main card */}
        <View style={cockpit.weekCard}>
          {/* Yellow hero block */}
          <View style={cockpit.heroBlock}>
            <Text style={cockpit.heroNumber}>{monitoredCount}</Text>
            <View style={{ flex: 1 }}>
              <Text style={cockpit.heroHeading}>Days Monitored !!</Text>
              <View style={cockpit.heroDivider} />
              <Text style={cockpit.heroBody}>
                Vitals & Symptoms recorded successfully with{' '}
                <Text style={cockpit.heroBodyBold}>no emergency cases recorded</Text>
              </Text>
            </View>
          </View>

          {/* Weekly day strip */}
          <View style={cockpit.dayStrip}>
            {weekDays.map((day, idx) => (
              <DayBubble key={idx} day={day} />
            ))}
          </View>
        </View>
      </View>
    </>
  );
}

// ─── Day bubble ───────────────────────────────────────────────────────────────

function DayBubble({ day }: { day: WeekDay }) {
  const { dayLabel, isCurrentDay, isMonitored } = day;

  const labelContainer = isCurrentDay
    ? [cockpit.dayLabelBox, cockpit.dayLabelBoxActive]
    : cockpit.dayLabelBox;

  const bubbleStyle = isMonitored
    ? [cockpit.dayBubble, cockpit.dayBubbleFilled]
    : isCurrentDay
    ? [cockpit.dayBubble, cockpit.dayBubbleCurrent]
    : cockpit.dayBubble;

  return (
    <View style={cockpit.dayItem}>
      <View style={labelContainer}>
        <Text
          style={[
            cockpit.dayLabel,
            isCurrentDay && cockpit.dayLabelActive,
          ]}
        >
          {dayLabel}
        </Text>
      </View>
      <View style={bubbleStyle} />
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ActiveDashboardScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const patchDisplayName = useAuthStore((s) => s.patchDisplayName);
  const firstName = (user?.displayName ?? '').split(' ')[0];

  useEffect(() => {
    getMyProfile()
      .then(({ fullName }) => { if (fullName) patchDisplayName(fullName); })
      .catch(() => {});
  }, []);

  const navigation = useNavigation<NativeStackNavigationProp<NeoCareAppStackParamList>>();

  const profilesQ = useQuery({ queryKey: ['linkedProfiles'], queryFn: getLinkedProfiles });
  const profiles = profilesQ.data ?? [];

  const { senior, setSenior } = useSelectedSenior();
  const selected: LinkedProfile | undefined = useMemo(() => {
    if (!profiles.length) return undefined;
    return profiles.find((p) => p.userId === senior?.userId) ?? profiles[0];
  }, [profiles, senior]);

  useEffect(() => {
    if (profiles.length && !profiles.find((p) => p.userId === senior?.userId)) {
      setSenior(profiles[0]);
    }
  }, [profiles, senior, setSenior]);

  const created = useCreatedSeniors((s) => s.created);
  const linkRequests = useCreatedSeniors((s) => s.linkRequests);
  const reconcile = useCreatedSeniors((s) => s.reconcile);
  useEffect(() => {
    if (profiles.length) reconcile(profiles.map((p) => p.neoSeniorId));
  }, [profiles, reconcile]);

  const goAdd = () => navigation.navigate('AddSenior');
  const isEmptyState =
    !profilesQ.isLoading &&
    !profilesQ.isError &&
    profiles.length === 0 &&
    created.length === 0 &&
    linkRequests.length === 0;

  const isPendingOnly =
    !profilesQ.isLoading &&
    !profilesQ.isError &&
    profiles.length === 0 &&
    created.length === 0 &&
    linkRequests.length > 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Logo />
        {firstName ? (
          <Text style={styles.greeting}>Hello, {firstName}</Text>
        ) : null}
      </View>

      {/* Body */}
      {profilesQ.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Brand.primary} />
        </View>
      ) : profilesQ.isError ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ErrorRow
            message={getApiErrorMessage(profilesQ.error)}
            onRetry={() => profilesQ.refetch()}
          />
        </ScrollView>
      ) : isEmptyState ? (
        <View style={styles.emptyContainer}>
          <EmptyStateCentered onAdd={goAdd} />
        </View>
      ) : isPendingOnly ? (
        <View style={styles.emptyContainer}>
          <AwaitingState nsr={linkRequests[0].nsr} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing['3xl'] },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={profilesQ.isRefetching}
              onRefresh={() => profilesQ.refetch()}
              tintColor={Brand.primary}
            />
          }
        >
          {/* Pending created seniors */}
          {created.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>{t('neoCare.pendingTitle')}</Text>
              {created.map((c) => (
                <PendingCreatedCard key={c.nsr} item={c} />
              ))}
            </>
          )}

          {/* Senior selector chips */}
          {profiles.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chips}
            >
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
          )}

          {/* Active cockpit */}
          {selected && <CockpitPanel key={selected.userId} profile={selected} />}
        </ScrollView>
      )}
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
    borderBottomColor: '#EFEBE4',
  },
  greeting: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    color: Brand.primary,
  },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },

  scrollContent: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
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
  chipAvatarText: { fontFamily: Fonts.heading, fontSize: 11, color: Brand.primary },
  chipText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.sm, color: Brand.primaryText },
  chipTextActive: { color: Colors.white },
});

const cockpit = StyleSheet.create({
  // B. Quick Metrics Grid
  metricsRow: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },

  // Left column
  statusCol: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: C.halo,
  },
  healthLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.base,
    color: Brand.primary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  healthValue: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.mutedTeal,
    textAlign: 'center',
    marginTop: 2,
  },

  // Right column – table
  tableCol: {
    flex: 3,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.tableBorder,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.tableHeader,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  tableHeaderText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.tableBorder,
  },
  tableRowLabel: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Brand.primaryContent,
    paddingRight: 4,
  },
  statusCell: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: C.gridBeige,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // C. Context Action Bar
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Brand.mutedTeal,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    marginTop: Spacing.xl,
  },
  actionBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionBarText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Brand.primary,
  },

  // D. This Week So Far
  weekSection: {
    marginTop: Spacing.xl,
  },
  weekTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.lg,
    color: Brand.primary,
    marginBottom: Spacing.base,
  },
  weekCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: Spacing.base,
  },

  // Hero block inside card
  heroBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.heroYellow,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
  },
  heroNumber: {
    fontSize: 72,
    fontFamily: Fonts.headingBold,
    color: Brand.primary,
    marginRight: Spacing.base,
    lineHeight: 76,
  },
  heroHeading: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.lg,
    color: Brand.primary,
  },
  heroDivider: {
    height: 2,
    backgroundColor: Brand.primary,
    marginVertical: Spacing.xs,
    borderRadius: 1,
  },
  heroBody: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.primaryContent,
    lineHeight: 20,
  },
  heroBodyBold: {
    fontFamily: Fonts.bodyBold,
    fontWeight: '700',
  },

  // Weekly day strip
  dayStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    gap: 6,
  },
  dayLabelBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabelBoxActive: {
    backgroundColor: C.heroYellow,
  },
  dayLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Brand.primaryContent,
  },
  dayLabelActive: {
    fontFamily: Fonts.bodySemiBold,
    color: Brand.primary,
  },
  dayBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.gridBeige,
    backgroundColor: Colors.surface,
  },
  dayBubbleFilled: {
    backgroundColor: C.dayFilled,
    borderWidth: 2,
    borderColor: Brand.primary,
  },
  dayBubbleCurrent: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: C.gridBeige,
  },
});

// ─── Misc / shared sub-component styles ───────────────────────────────────────

const misc = StyleSheet.create({
  emptyInner: { alignItems: 'center' },
  emptyOuterCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F7EFE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyInnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: Spacing['2xl'],
    fontFamily: Fonts.heading,
    fontSize: FontSize.xl,
    color: Brand.primary,
    textAlign: 'center',
  },
  dashedDivider: {
    marginVertical: Spacing.base,
    width: 140,
    height: 0,
    borderTopWidth: 1,
    borderTopColor: Brand.mutedTeal,
    borderStyle: 'dashed',
  },
  emptyBody: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Brand.mutedTeal,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  emptyAddBtn: {
    backgroundColor: Brand.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: BorderRadius.sm,
  },
  emptyAddText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  awaitingGlyph: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F7EFE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  awaitingGlyphText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Brand.primary,
    lineHeight: 16,
    textAlign: 'center',
  },
  pendingCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  pendingName: { fontFamily: Fonts.heading, fontSize: FontSize.lg, color: Brand.primary },
  pendingInstruction: {
    fontFamily: Fonts.body,
    fontSize: FontSize.base,
    lineHeight: 22,
    color: Brand.bodyText,
  },
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
  codeText: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.xl,
    letterSpacing: 2,
    color: Brand.primary,
  },
  pendingHint: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.mutedTeal,
    marginTop: Spacing.sm,
  },
  errorRow: { marginTop: Spacing.lg, gap: Spacing.sm },
  error: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: Colors.error, marginTop: Spacing.sm },
  retry: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.base, color: Brand.primary },
});
