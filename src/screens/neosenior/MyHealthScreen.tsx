import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuthStore } from '../../store/auth.store';
import { getHealthLogs, HealthLogSummary, EscalationTier } from '../../services/healthLogs.service';
import { getVitals, VitalReading } from '../../services/vitals.service';
import { VitalType } from '../../services/types';
import { NeoSeniorAppStackParamList } from '../../navigation/types';
import { Brand, Fonts, FontSize } from '../../theme';
import Logo from '../../components/Logo';

// ─── Types ────────────────────────────────────────────────────────────────────

type SeverityStatus = 'Normal' | 'Watch' | 'Alert';
type FilterTimeframe = 'All' | 'This Week' | 'This Month';

interface DayRecord {
  id: string;
  dateString: string;
  severity: SeverityStatus;
  bloodPressure: string;
  sugarLevel: string;
  moodSummary: string;
  medsCompliance: 'Taken' | '–';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateLong(dateStr: string): string {
  // Append T00:00:00 so the date is parsed as local time, not UTC midnight.
  const d = new Date(`${dateStr}T00:00:00`);
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MON_SHORT[d.getMonth()]}`;
}

const SEVERITY_RANK: Record<SeverityStatus, number> = { Normal: 0, Watch: 1, Alert: 2 };

function tierToSeverity(tier: EscalationTier): SeverityStatus {
  if (tier === 'urgent') return 'Alert';
  if (tier === 'warning' || tier === 'info') return 'Watch';
  return 'Normal';
}

function latestVital(vitals: VitalReading[], type: VitalType): VitalReading | undefined {
  return vitals
    .filter((v) => v.vitalType === type)
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())[0];
}

function buildDayRecords(logs: HealthLogSummary[], vitals: VitalReading[]): DayRecord[] {
  const byDate = new Map<string, { logs: HealthLogSummary[]; vitals: VitalReading[] }>();

  for (const log of logs) {
    const key = new Date(log.loggedAt).toISOString().split('T')[0];
    if (!byDate.has(key)) byDate.set(key, { logs: [], vitals: [] });
    byDate.get(key)!.logs.push(log);
  }
  for (const v of vitals) {
    const key = new Date(v.loggedAt).toISOString().split('T')[0];
    if (!byDate.has(key)) byDate.set(key, { logs: [], vitals: [] });
    byDate.get(key)!.vitals.push(v);
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([dateKey, { logs: dl, vitals: dv }]) => {
      // Highest severity across all logs for this day
      let sev: SeverityStatus = 'Normal';
      for (const l of dl) {
        const s = tierToSeverity(l.escalationTier);
        if (SEVERITY_RANK[s] > SEVERITY_RANK[sev]) sev = s;
      }

      // Blood pressure
      const sys = latestVital(dv, 'bp_systolic');
      const dia = latestVital(dv, 'bp_diastolic');
      const bp = sys && dia ? `${Math.round(sys.value)}/${Math.round(dia.value)}` : '–/–';

      // Blood sugar
      const sugar = latestVital(dv, 'blood_sugar_mmol');
      const sugarStr = sugar ? `${sugar.value.toFixed(1)} mmol/L` : '–';

      // Mood: first symptom log aiSummary, truncated
      const symptom = dl.find((l) => l.logType === 'symptom');
      const mood = symptom
        ? symptom.aiSummary.length > 22
          ? `${symptom.aiSummary.slice(0, 21)}…`
          : symptom.aiSummary
        : '–';

      // Medication compliance
      const meds: DayRecord['medsCompliance'] = dl.some((l) => l.logType === 'medication')
        ? 'Taken'
        : '–';

      return {
        id: dateKey,
        dateString: formatDateLong(dateKey),
        severity: sev,
        bloodPressure: bp,
        sugarLevel: sugarStr,
        moodSummary: mood,
        medsCompliance: meds,
      };
    });
}

function isInTimeframe(dateStr: string, filter: FilterTimeframe): boolean {
  if (filter === 'All') return true;
  const date = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  if (filter === 'This Week') {
    return date >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (filter === 'This Month') {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
  return true;
}

// ─── Badge colors ─────────────────────────────────────────────────────────────

const BADGE_BG: Record<SeverityStatus, string> = {
  Normal: '#00BFA5',
  Watch: '#F9A825',
  Alert: '#EF5350',
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NeoSeniorMyHealthScreen() {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const displayName = useAuthStore((s) => s.user?.displayName ?? '');
  const navigation = useNavigation<NativeStackNavigationProp<NeoSeniorAppStackParamList>>();

  const [filter, setFilter] = useState<FilterTimeframe>('All');

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

  const isLoading = logsQ.isLoading && vitalsQ.isLoading;
  const isRefreshing = logsQ.isRefetching || vitalsQ.isRefetching;

  const allRecords = useMemo(
    () => buildDayRecords(logsQ.data?.logs ?? [], vitalsQ.data?.vitals ?? []),
    [logsQ.data, vitalsQ.data],
  );
  const records = useMemo(
    () => allRecords.filter((r) => isInTimeframe(r.id, filter)),
    [allRecords, filter],
  );

  // Avatar
  const initials = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  const shortName = displayName.trim();

  const ListHeader = (
    <>
      <View style={styles.headingBlock}>
        <Text style={styles.heading}>Monitoring Log</Text>
      </View>
      <View style={styles.filterRow}>
        {(['All', 'This Week', 'This Month'] as FilterTimeframe[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.chip, f === filter && styles.chipActive]}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityState={{ selected: f === filter }}
          >
            <Text style={[styles.chipText, f === filter && styles.chipTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* A. Global header */}
      <View style={styles.header}>
        <Logo />
        <View style={styles.userCluster}>
          {shortName ? (
            <Text style={styles.userName} numberOfLines={1}>{shortName}</Text>
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
        // D. FlatList — header contains B + C
        <FlatList<DayRecord>
          data={records}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              onPress={() => navigation.navigate('MonitoringLogDetail', { date: item.id })}
              accessibilityRole="button"
              accessibilityLabel={`View details for ${item.dateString}`}
            >
              {/* Card header row */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardDate}>{item.dateString}</Text>
                <View style={[styles.badge, { backgroundColor: BADGE_BG[item.severity] }]}>
                  <Text style={styles.badgeText}>{item.severity}</Text>
                </View>
              </View>

              {/* Metrics data grid */}
              <View style={styles.metricsGrid}>
                {/* Left column */}
                <View style={styles.metricCol}>
                  <View style={[styles.metricRow, styles.metricRowGap]}>
                    <Text style={styles.metricLabel}>BP: </Text>
                    <Text style={styles.metricValue}>{item.bloodPressure}</Text>
                  </View>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Sugar: </Text>
                    <Text style={styles.metricValue}>{item.sugarLevel}</Text>
                  </View>
                </View>
                {/* Right column */}
                <View style={styles.metricCol}>
                  <View style={[styles.metricRow, styles.metricRowGap]}>
                    <Text style={styles.metricLabel}>Mood: </Text>
                    <Text style={styles.metricValue} numberOfLines={1}>{item.moodSummary}</Text>
                  </View>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Meds: </Text>
                    <Text style={[
                      styles.metricValue,
                      item.medsCompliance === 'Taken' && styles.medsTaken,
                    ]}>
                      {item.medsCompliance}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No records for this period</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => { logsQ.refetch(); vitalsQ.refetch(); }}
              tintColor={Brand.primary}
            />
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBFBFA' },

  // A. Global header
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

  listContent: { paddingHorizontal: 20, paddingBottom: 100 },

  // B. Screen heading
  headingBlock: { paddingTop: 24, marginBottom: 20 },
  heading: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    fontWeight: '700',
    color: Brand.primary,
  },

  // C. Filter row
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE6D5',
  },
  chipActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  chipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Brand.primary,
  },
  chipTextActive: {
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // D. Log card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE6D5',
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardDate: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    fontWeight: '700',
    color: Brand.primary,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Metrics grid
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCol: { width: '48%' },
  metricRow: { flexDirection: 'row', alignItems: 'center' },
  metricRowGap: { marginBottom: 8 },
  metricLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.mutedTeal,
  },
  metricValue: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Brand.primary,
    flexShrink: 1,
  },
  medsTaken: { color: '#00BFA5' },

  emptyBox: { alignItems: 'center', marginTop: 40 },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.base,
    color: Brand.mutedTeal,
  },
});
