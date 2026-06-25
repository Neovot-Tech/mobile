import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  StatusBar,
  ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getHealthLogs, HealthLogSummary } from '../../services/healthLogs.service';
import { getApiErrorMessage } from '../../services/http';
import { useAuthStore } from '../../store/auth.store';
import { useSelectedSenior } from '../../store/selectedSenior.store';
import HistoryLogCard from '../../components/HistoryLogCard';
import SeniorSelector from '../../components/SeniorSelector';
import Logo from '../../components/Logo';
import { NeoCareAppStackParamList } from '../../navigation/types';
import { Colors, Brand, Fonts, FontSize, Spacing, BorderRadius, MinTapTarget } from '../../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTimeframe = 'All' | 'This Week' | 'This Month';

const FILTERS: FilterTimeframe[] = ['All', 'This Week', 'This Month'];

// ─── Filter helpers ───────────────────────────────────────────────────────────

function startOfWeek(): Date {
  const now = new Date();
  const diff = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const d = new Date(now);
  d.setDate(now.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function filterByTimeframe(
  logs: HealthLogSummary[],
  tf: FilterTimeframe,
): HealthLogSummary[] {
  if (tf === 'All') return logs;
  const now = new Date();
  if (tf === 'This Week') {
    const start = startOfWeek();
    return logs.filter((l) => new Date(l.loggedAt) >= start);
  }
  return logs.filter((l) => {
    const d = new Date(l.loggedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MonitoringLogScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const firstName = (user?.displayName ?? '').split(' ')[0];

  const navigation = useNavigation<NativeStackNavigationProp<NeoCareAppStackParamList>>();
  const senior = useSelectedSenior((s) => s.senior);
  const userId = senior?.userId ?? '';

  const [timeframe, setTimeframe] = useState<FilterTimeframe>('All');

  const logsQ = useQuery({
    queryKey: ['nc-monitoringLogs', userId],
    queryFn: () => getHealthLogs(userId, { limit: 50 }),
    enabled: !!userId,
  });

  const allLogs = logsQ.data?.logs ?? [];
  const filtered = useMemo(
    () => filterByTimeframe(allLogs, timeframe),
    [allLogs, timeframe],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<HealthLogSummary>) => (
      <HistoryLogCard
        item={item}
        onPress={() => navigation.navigate('MonitoringLogDetail', { logId: item.id })}
      />
    ),
    [navigation],
  );

  const keyExtractor = useCallback((item: HealthLogSummary) => item.id, []);

  const listHeader = (
    <>
      <SeniorSelector />

      <Text style={styles.screenTitle}>Monitoring Log</Text>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = f === timeframe;
          return (
            <Pressable
              key={f}
              onPress={() => setTimeframe(f)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.chip,
                active ? styles.chipActive : styles.chipInactive,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  active ? styles.chipTextActive : styles.chipTextInactive,
                ]}
              >
                {f}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );

  const listEmpty = logsQ.isLoading ? (
    <ActivityIndicator color={Brand.primary} style={{ marginTop: Spacing['2xl'] }} />
  ) : logsQ.isError ? (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyText}>{getApiErrorMessage(logsQ.error)}</Text>
      <Pressable onPress={() => logsQ.refetch()} accessibilityRole="button" hitSlop={8}>
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  ) : !userId ? (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyText}>Select a senior to view their monitoring log.</Text>
    </View>
  ) : (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyText}>No log entries for this period.</Text>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={styles.header}>
        <Logo />
        {firstName ? <Text style={styles.greeting}>Hello, {firstName}</Text> : null}
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing['3xl'] },
        ]}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews
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
    borderBottomColor: '#EFEBE4',
  },
  greeting: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    color: Brand.primary,
  },

  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  screenTitle: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSize['2xl'],
    fontWeight: '700',
    color: Brand.primary,
    marginBottom: Spacing.lg,
  },

  filterRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: 20,
    minHeight: MinTapTarget.neoCare,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: { backgroundColor: Brand.primary },
  chipInactive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#FFE6D5',
  },
  chipText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.sm },
  chipTextActive: { color: Colors.white, fontFamily: Fonts.bodySemiBold },
  chipTextInactive: { color: Brand.primary },

  emptyBox: {
    paddingVertical: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.base,
    color: Brand.mutedTeal,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.base,
    color: Brand.primary,
  },
});
