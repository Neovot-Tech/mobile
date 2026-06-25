import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { getHealthLogEntry } from '../../services/healthLogs.service';
import { getAdherence, getMedications } from '../../services/medications.service';
import { getApiErrorMessage } from '../../services/http';
import { useSelectedSenior } from '../../store/selectedSenior.store';
import HistoryLogCard from '../../components/HistoryLogCard';
import NeoCareShell from '../../components/NeoCareShell';
import BackHeader from '../../components/BackHeader';
import { NeoCareAppStackParamList } from '../../navigation/types';
import { Colors, Brand, Fonts, FontSize, Spacing, BorderRadius } from '../../theme';

// ─── Screen-specific tokens ───────────────────────────────────────────────────

const INSIGHT_RED = '#FF2D2D';
const SYMPTOM_CHIP_BG = '#EBF0FF';
const DIVIDER_COLOR = '#EFEBE4';

type RouteProps = RouteProp<NeoCareAppStackParamList, 'MonitoringLogDetail'>;

// ─── Safe extractedEntities access ───────────────────────────────────────────

function extractString(ee: Record<string, unknown> | undefined, ...keys: string[]): string {
  if (!ee) return '—';
  for (const key of keys) {
    if (typeof ee[key] === 'string' && (ee[key] as string).trim()) {
      return ee[key] as string;
    }
  }
  return '—';
}

function extractSymptoms(ee: Record<string, unknown> | undefined): string[] {
  if (!ee) return [];
  const raw = ee.symptoms ?? ee.reported_symptoms;
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  return [];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Divider() {
  return <View style={detail.divider} />;
}

function SymptomTag({ label }: { label: string }) {
  return (
    <View style={detail.tag}>
      <Ionicons name="star-outline" size={13} color={Brand.primary} />
      <Text style={detail.tagText}>{label}</Text>
    </View>
  );
}

function MedRow({
  name,
  scheduled,
  taken,
  showDivider,
}: {
  name: string;
  scheduled: string;
  taken: string;
  showDivider: boolean;
}) {
  return (
    <>
      {showDivider && <Divider />}
      <View style={detail.medRow}>
        <Text style={[detail.medCell, { flex: 2 }]} numberOfLines={2}>
          {name}
        </Text>
        <Text style={[detail.medCell, { flex: 1, textAlign: 'center' }]}>{scheduled}</Text>
        <Text style={[detail.medCell, { flex: 1, textAlign: 'right' }]}>{taken}</Text>
      </View>
    </>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DetailedMonitoringLogScreen() {
  const { params } = useRoute<RouteProps>();
  const senior = useSelectedSenior((s) => s.senior);
  const userId = senior?.userId ?? '';

  const entryQ = useQuery({
    queryKey: ['healthLogEntry', params.logId],
    queryFn: () => getHealthLogEntry(params.logId),
  });

  const adherenceQ = useQuery({
    queryKey: ['nc-adherence', userId],
    queryFn: () => getAdherence(userId),
    enabled: !!userId,
  });

  const medsQ = useQuery({
    queryKey: ['nc-meds', userId],
    queryFn: () => getMedications(userId),
    enabled: !!userId,
  });

  const entry = entryQ.data;
  const adherenceRows = adherenceQ.data?.adherence ?? [];
  const meds = medsQ.data ?? [];

  const ee = entry?.extractedEntities ?? {};
  const bp = extractString(ee, 'blood_pressure', 'bp', 'systolic_diastolic');
  const sugar = extractString(ee, 'blood_sugar', 'sugar', 'blood_sugar_mmol');
  const symptoms = extractSymptoms(ee);

  const adherencePct = useMemo(() => {
    const totalTaken = adherenceRows.reduce((s, r) => s + r.taken, 0);
    const totalAll = adherenceRows.reduce((s, r) => s + r.taken + r.missed, 0);
    return totalAll > 0 ? Math.round((totalTaken / totalAll) * 100) : 0;
  }, [adherenceRows]);

  const medsWithAdherence = useMemo(
    () =>
      meds
        .filter((m) => m.active)
        .map((m) => {
          const adh = adherenceRows.find((a) => a.id === m.id);
          const taken = adh?.taken ?? 0;
          const missed = adh?.missed ?? 0;
          const scheduled = taken + missed;
          const label = [m.name, m.dosage].filter(Boolean).join(' ');
          return { id: m.id, label, scheduled, taken };
        }),
    [meds, adherenceRows],
  );

  const isLoading = entryQ.isLoading;
  const isError = entryQ.isError;

  return (
    <NeoCareShell activeTab="Health" scroll contentContainerStyle={shellContent}>
      <BackHeader />

      {isLoading ? (
        <ActivityIndicator color={Brand.primary} style={{ marginTop: Spacing['2xl'] }} />
      ) : isError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{getApiErrorMessage(entryQ.error)}</Text>
          <Pressable onPress={() => entryQ.refetch()} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : entry ? (
        <>
          {/* B. Snapshot card */}
          <HistoryLogCard item={entry} bp={bp} sugar={sugar} />

          {/* C. Master details card */}
          <View style={detail.card}>

            {/* 1. Symptoms */}
            <Text style={detail.sectionHeader}>Symptoms Recorded:</Text>
            <Divider />
            {symptoms.length > 0 ? (
              <View style={detail.tagRow}>
                {symptoms.map((s, i) => (
                  <SymptomTag key={i} label={s} />
                ))}
              </View>
            ) : (
              <Text style={detail.noDataText}>No symptoms extracted for this entry.</Text>
            )}
            <Divider />

            {/* 2. Clinical insights */}
            <View style={detail.insightsBlock}>
              <View style={detail.insightsHeader}>
                <Ionicons name="sparkles" size={18} color={INSIGHT_RED} />
                <Text style={detail.insightsTitle}>Clinical Insights</Text>
              </View>
              <View style={detail.insightsQuote}>
                <View style={detail.insightsAccentBar} />
                <Text style={detail.insightsText} numberOfLines={0}>
                  {entry.aiSummary || 'No clinical insights available for this entry.'}
                </Text>
              </View>
            </View>
            <Divider />

            {/* 3. Medication adherence */}
            <View style={detail.adherenceRow}>
              <Text style={detail.adherenceLabel}>Medication Adherence</Text>
              <Text style={detail.adherencePct}>{adherencePct}%</Text>
            </View>
            <Divider />

            {/* 4. Medication table */}
            <View style={detail.medTable}>
              {/* Header row */}
              <View style={detail.medRow}>
                <Text style={[detail.medHeaderCell, { flex: 2 }]}>Med</Text>
                <Text style={[detail.medHeaderCell, { flex: 1, textAlign: 'center' }]}>
                  Scheduled
                </Text>
                <Text style={[detail.medHeaderCell, { flex: 1, textAlign: 'right' }]}>
                  Taken
                </Text>
              </View>

              {medsWithAdherence.length > 0 ? (
                medsWithAdherence.map((m, idx) => (
                  <MedRow
                    key={m.id}
                    name={m.label}
                    scheduled={`${m.scheduled} doses`}
                    taken={`${m.taken} doses`}
                    showDivider={idx > 0}
                  />
                ))
              ) : (
                <>
                  <Divider />
                  <Text style={[detail.noDataText, { marginTop: Spacing.sm }]}>
                    No medication data available.
                  </Text>
                </>
              )}
            </View>
          </View>
        </>
      ) : null}
    </NeoCareShell>
  );
}

// ─── Content container override for the shell ─────────────────────────────────
// NeoCareShell merges this with its scrollContent style. We keep horizontal padding
// at Spacing.lg (20) to match the Monitoring Log list screen.
const shellContent = { paddingHorizontal: Spacing.lg };

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  errorBox: {
    paddingVertical: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.sm,
  },
  errorText: {
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

const detail = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#FFE6D5',
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  divider: {
    height: 1,
    backgroundColor: DIVIDER_COLOR,
    marginVertical: 0,
  },

  // Symptoms
  sectionHeader: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Brand.primary,
    marginBottom: Spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SYMPTOM_CHIP_BG,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  tagText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.sm,
    color: Brand.primary,
  },
  noDataText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.mutedTeal,
    lineHeight: 22,
    marginVertical: Spacing.md,
  },

  // Clinical insights
  insightsBlock: {
    marginVertical: Spacing.base,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  insightsTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Brand.primary,
  },
  insightsQuote: {
    flexDirection: 'row',
    paddingRight: Spacing.sm,
  },
  insightsAccentBar: {
    width: 4,
    backgroundColor: INSIGHT_RED,
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  insightsText: {
    flex: 1,
    flexShrink: 1,
    fontStyle: 'italic',
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.mutedTeal,
    lineHeight: 22,
  },

  // Adherence row
  adherenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
  },
  adherenceLabel: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Brand.mutedTeal,
  },
  adherencePct: {
    fontFamily: Fonts.headingBold,
    fontSize: 22,
    fontWeight: '700',
    color: Brand.primary,
  },

  // Medication table
  medTable: {
    marginTop: Spacing.base,
  },
  medRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  medHeaderCell: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: Brand.mutedTeal,
  },
  medCell: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.mutedTeal,
    lineHeight: 20,
  },
});
