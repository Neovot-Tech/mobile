import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '../../store/auth.store';
import { getHealthLogs } from '../../services/healthLogs.service';
import { getVitals, VitalReading } from '../../services/vitals.service';
import { VitalType } from '../../services/types';
import { NeoSeniorAppStackParamList, NeoSeniorTabParamList } from '../../navigation/types';
import { Brand, Fonts, FontSize } from '../../theme';
import Logo from '../../components/Logo';

// ─── Types ────────────────────────────────────────────────────────────────────

type RouteProps = RouteProp<NeoSeniorAppStackParamList, 'MonitoringLogDetail'>;
type NavProps = NativeStackNavigationProp<NeoSeniorAppStackParamList>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateHeading(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MON_SHORT[d.getMonth()]}`;
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m} ${ampm}`;
}

function latestVital(vitals: VitalReading[], type: VitalType): VitalReading | undefined {
  return vitals
    .filter((v) => v.vitalType === type)
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())[0];
}

type Severity = 'Normal' | 'Watch' | 'Alert';
const SEVERITY_RANK: Record<Severity, number> = { Normal: 0, Watch: 1, Alert: 2 };
const SEVERITY_BG: Record<Severity, string> = { Normal: '#00BFA5', Watch: '#F9A825', Alert: '#EF5350' };

function tierToSeverity(tier: string): Severity {
  if (tier === 'urgent') return 'Alert';
  if (tier === 'warning' || tier === 'info') return 'Watch';
  return 'Normal';
}

const LOG_LABEL: Record<string, string> = {
  symptom: 'Symptom Report',
  vitals: 'Vitals Reading',
  medication: 'Medication Log',
  prescription: 'Prescription Scan',
};

function getEncouragement(sev: Severity, escalationReason?: string): { title: string; body: string } {
  if (sev === 'Alert') {
    return {
      title: escalationReason ? 'Something needs attention' : 'We noticed some elevated readings',
      body: escalationReason
        ?? 'Some of your readings were flagged today. Keep monitoring and reach out to your caregiver if you feel unwell.',
    };
  }
  if (sev === 'Watch') {
    return {
      title: 'Keep an eye on things',
      body: "Your readings are slightly outside the usual range. Keep monitoring regularly and stay hydrated — you're doing great staying on top of it.",
    };
  }
  return {
    title: 'You are looking good today',
    body: 'Always keep in mind your health can be well managed. Keep taking your medications and checking your vitals so nothing is missed.',
  };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NeoSeniorMonitoringLogDetailScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProps>();
  const { date } = route.params;

  const userId = useAuthStore((s) => s.user?.id ?? '');
  const displayName = useAuthStore((s) => s.user?.displayName ?? '');

  // Re-use cached data from the history screen (same query keys)
  const logsQ = useQuery({
    queryKey: ['healthLogs', userId, 'history'],
    queryFn: () => getHealthLogs(userId, { limit: 100 }),
    enabled: !!userId,
  });
  const vitalsQ = useQuery({
    queryKey: ['vitals', userId, 'history'],
    queryFn: () => getVitals(userId, { limit: 200 }),
    enabled: !!userId,
  });

  // Filter to just this day
  const dayLogs = useMemo(
    () =>
      (logsQ.data?.logs ?? [])
        .filter((l) => new Date(l.loggedAt).toISOString().split('T')[0] === date)
        .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()),
    [logsQ.data, date],
  );
  const dayVitals = useMemo(
    () => (vitalsQ.data?.vitals ?? []).filter(
      (v) => new Date(v.loggedAt).toISOString().split('T')[0] === date,
    ),
    [vitalsQ.data, date],
  );

  // Overall severity for the day
  const severity: Severity = useMemo(() => {
    let sev: Severity = 'Normal';
    for (const l of dayLogs) {
      const s = tierToSeverity(l.escalationTier);
      if (SEVERITY_RANK[s] > SEVERITY_RANK[sev]) sev = s;
    }
    return sev;
  }, [dayLogs]);

  // Vitals grid
  const sys = latestVital(dayVitals, 'bp_systolic');
  const dia = latestVital(dayVitals, 'bp_diastolic');
  const bp = sys && dia ? `${Math.round(sys.value)}/${Math.round(dia.value)}` : '–';
  const sugar = latestVital(dayVitals, 'blood_sugar_mmol');
  const sugarStr = sugar ? `${sugar.value.toFixed(1)} mmol/L` : '–';
  const symptomLog = dayLogs.find((l) => l.logType === 'symptom');
  const mood = symptomLog
    ? symptomLog.aiSummary.length > 20
      ? `${symptomLog.aiSummary.slice(0, 18)}…`
      : symptomLog.aiSummary
    : '–';
  const hasMeds = dayLogs.some((l) => l.logType === 'medication');
  const meds = hasMeds ? 'Taken' : '–';

  // Encouragement
  const urgentLog = dayLogs.find((l) => l.escalationTier === 'urgent' || l.escalationTier === 'warning');
  const encouragement = getEncouragement(severity, urgentLog?.escalationReason);

  // Avatar
  const initials = displayName
    .trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

  const isLoading = logsQ.isLoading && vitalsQ.isLoading;

  // Tab bar navigation
  const goToTab = (screen: keyof NeoSeniorTabParamList) =>
    navigation.navigate('Tabs', { screen } as any);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* 1. Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={Brand.primary} />
          </Pressable>
          <Logo />
        </View>
        <View style={styles.userCluster}>
          {displayName ? (
            <Text style={styles.userName} numberOfLines={1}>{displayName.trim()}</Text>
          ) : null}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials || '?'}</Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Brand.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 96 }]}
        >
          {/* 2. Date + status badge */}
          <View style={styles.titleRow}>
            <Text style={styles.dateHeading}>{formatDateHeading(date)}</Text>
            <View style={[styles.badge, { backgroundColor: SEVERITY_BG[severity] }]}>
              <Text style={styles.badgeText}>{severity}</Text>
            </View>
          </View>

          {/* 3. Vitals summary card */}
          <View style={styles.vitalsCard}>
            <View style={[styles.vitalsRow, styles.vitalsRowGap]}>
              <View style={styles.vitalsCol}>
                <Text style={styles.vitalsLabel}>BP: </Text>
                <Text style={styles.vitalsValue}>{bp}</Text>
              </View>
              <View style={styles.vitalsCol}>
                <Text style={styles.vitalsLabel}>Mood: </Text>
                <Text style={styles.vitalsValue} numberOfLines={1}>{mood}</Text>
              </View>
            </View>
            <View style={styles.vitalsRow}>
              <View style={styles.vitalsCol}>
                <Text style={styles.vitalsLabel}>Sugar: </Text>
                <Text style={styles.vitalsValue}>{sugarStr}</Text>
              </View>
              <View style={styles.vitalsCol}>
                <Text style={styles.vitalsLabel}>Meds: </Text>
                <Text style={[styles.vitalsValue, hasMeds && styles.medsTaken]}>{meds}</Text>
              </View>
            </View>
          </View>

          {/* 4. Log entry cards — one per log, replacing the hardcoded time-blocks */}
          {dayLogs.length > 0 ? (
            dayLogs.map((log) => (
              <View key={log.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordHeaderText}>
                    {LOG_LABEL[log.logType] ?? 'Health Log'}
                    {' · '}
                    {formatTime(log.loggedAt)}
                  </Text>
                </View>
                <View style={styles.recordBody}>
                  <Text style={styles.recordBodyText}>{log.aiSummary}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordHeaderText}>No entries</Text>
              </View>
              <View style={styles.recordBody}>
                <Text style={styles.recordBodyText}>
                  No log entries were found for this day.
                </Text>
              </View>
            </View>
          )}

          {/* 5. Encouragement card */}
          <View style={styles.encouragementCard}>
            <Text style={styles.encouragementTitle}>{encouragement.title}</Text>
            <Text style={styles.encouragementBody}>{encouragement.body}</Text>
          </View>
        </ScrollView>
      )}

      {/* 6. Bottom tab bar — History tab active */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
        <View style={styles.tabAccent} />
        <View style={styles.tabRow}>
          {TAB_ITEMS.map((item) => {
            const active = item.tab === 'MyHealth';
            const color = active ? Brand.primary : '#9FB0B2';
            return (
              <Pressable
                key={item.tab}
                style={({ pressed }) => [styles.tabItem, pressed && { opacity: 0.7 }]}
                onPress={() => goToTab(item.tab)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: active }}
              >
                <Ionicons
                  name={active ? item.iconActive : item.icon}
                  size={24}
                  color={color}
                />
                <Text style={[styles.tabLabel, { color }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Tab bar config ───────────────────────────────────────────────────────────

const TAB_ITEMS: {
  tab: keyof NeoSeniorTabParamList;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconActive: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { tab: 'Home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { tab: 'MyHealth', label: 'History', icon: 'heart-circle-outline', iconActive: 'heart-circle' },
  { tab: 'Summary', label: 'Summary', icon: 'document-text-outline', iconActive: 'document-text' },
  { tab: 'Settings', label: 'Settings', icon: 'settings-outline', iconActive: 'settings' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBFBFA' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 64,
    backgroundColor: '#F5F1E5',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EFEBE4',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 10 },
  userCluster: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  userName: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    fontWeight: '600',
    color: Brand.primary,
    maxWidth: 120,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.accentPeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontFamily: Fonts.heading, fontSize: 13, color: Brand.primary },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20 },

  // 2. Title row
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  dateHeading: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    fontWeight: '700',
    color: '#0F2D37',
  },
  badge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  badgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 3. Vitals card
  vitalsCard: {
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#FFE6C2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  vitalsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  vitalsRowGap: { marginBottom: 12 },
  vitalsCol: { flexDirection: 'row', alignItems: 'center', width: '48%' },
  vitalsLabel: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: Brand.mutedTeal },
  vitalsValue: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Brand.primary,
    flexShrink: 1,
  },
  medsTaken: { color: '#00BFA5' },

  // 4. Record cards
  recordCard: {
    borderWidth: 1,
    borderColor: '#FFE6C2',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  recordHeader: {
    backgroundColor: '#FCE9B3',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  recordHeaderText: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Brand.primary,
  },
  recordBody: { backgroundColor: '#FFFFFF', padding: 16 },
  recordBodyText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: '#0F2D37',
    lineHeight: 20,
  },

  // 5. Encouragement card
  encouragementCard: {
    backgroundColor: '#F6F8F2',
    borderWidth: 1,
    borderColor: '#2C5E53',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    marginBottom: 30,
  },
  encouragementTitle: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    fontWeight: '700',
    color: Brand.primary,
    marginBottom: 6,
  },
  encouragementBody: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: '#333333',
    lineHeight: 20,
  },

  // 6. Tab bar
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  tabAccent: { height: 3, backgroundColor: '#EFA84E' },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontFamily: Fonts.bodyMedium, fontSize: 12, marginTop: 4 },
});
