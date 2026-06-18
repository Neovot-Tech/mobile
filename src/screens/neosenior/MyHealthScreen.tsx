import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import Screen from '../../components/Screen';
import { NeoSeniorAppStackParamList } from '../../navigation/types';
import Sparkline from '../../components/Sparkline';
import { getVitalsSummary, getVitalsTrend, VitalSummaryRow } from '../../services/vitals.service';
import {
  getMedications,
  getMedicationDrafts,
  getAdherence,
  confirmDrafts,
  Medication,
  MedicationDraft,
} from '../../services/medications.service';
import { getHealthLogs, HealthLogSummary } from '../../services/healthLogs.service';
import { useAuthStore } from '../../store/auth.store';
import { VitalType } from '../../services/types';
import { Colors, Brand, Fonts, FontSize, Spacing, BorderRadius } from '../../theme';

const VITAL_UNIT: Record<VitalType, string> = {
  bp_systolic: 'mmHg',
  bp_diastolic: 'mmHg',
  pulse_rate: 'bpm',
  blood_sugar_mmol: 'mmol/L',
  spo2_pct: '%',
  heart_rate_bpm: 'bpm',
  weight_kg: 'kg',
};

function tierColor(tier: string) {
  if (tier === 'urgent') return Colors.error;
  if (tier === 'warning') return Colors.warning;
  return Colors.success;
}

export default function NeoSeniorMyHealthScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const navigation = useNavigation<NativeStackNavigationProp<NeoSeniorAppStackParamList>>();
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const enabled = !!userId;

  const summaryQ = useQuery({ queryKey: ['vitalsSummary', userId], queryFn: () => getVitalsSummary(userId), enabled });
  const trendQ = useQuery({ queryKey: ['vitalsTrend', userId], queryFn: () => getVitalsTrend(userId), enabled });
  const medsQ = useQuery({ queryKey: ['medications', userId], queryFn: () => getMedications(userId), enabled });
  const draftsQ = useQuery({ queryKey: ['medDrafts', userId], queryFn: () => getMedicationDrafts(userId), enabled });
  const adherenceQ = useQuery({ queryKey: ['adherence', userId], queryFn: () => getAdherence(userId), enabled });
  const logsQ = useQuery({ queryKey: ['healthLogs', userId], queryFn: () => getHealthLogs(userId, { limit: 6 }), enabled });

  const confirmMut = useMutation({
    mutationFn: (vars: { confirm: string[]; discard: string[] }) => confirmDrafts(userId, vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medDrafts', userId] });
      qc.invalidateQueries({ queryKey: ['medications', userId] });
    },
  });

  const summary = summaryQ.data?.summary ?? [];
  const trend = trendQ.data?.trend ?? {};
  const meds = medsQ.data ?? [];
  const drafts = draftsQ.data ?? [];
  const adherence = adherenceQ.data?.adherence ?? [];
  const logs = logsQ.data?.logs ?? [];

  const refreshing = summaryQ.isRefetching || medsQ.isRefetching || logsQ.isRefetching;
  const refetchAll = () => {
    summaryQ.refetch();
    trendQ.refetch();
    medsQ.refetch();
    draftsQ.refetch();
    adherenceQ.refetch();
    logsQ.refetch();
  };

  return (
    <Screen
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetchAll} tintColor={Brand.primary} />}
    >
      <Text style={styles.h1}>{t('myHealth.title')}</Text>
      <Text style={styles.subtitle}>{t('myHealth.subtitle')}</Text>

      {/* Recent activity */}
      <Text style={styles.sectionLabel}>{t('myHealth.activityTitle')}</Text>
      {logsQ.isLoading ? (
        <Loading />
      ) : logs.length === 0 ? (
        <Empty text={t('myHealth.noActivity')} />
      ) : (
        <View style={styles.activityCard}>
          {logs.map((log: HealthLogSummary, i) => (
            <Pressable
              key={log.id}
              onPress={() => navigation.navigate('HealthLogEntry', { logId: log.id })}
              accessibilityRole="button"
              style={({ pressed }) => [styles.logRow, i > 0 && styles.logDivider, pressed && styles.rowPressed]}
            >
              <View style={[styles.tierDot, { backgroundColor: tierColor(log.escalationTier) }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.logSummary}>{log.aiSummary}</Text>
                <Text style={styles.logTime}>{new Date(log.loggedAt).toLocaleString()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#c2ccce" />
            </Pressable>
          ))}
        </View>
      )}

      {/* Readings */}
      <Text style={styles.sectionLabel}>{t('myHealth.readingsTitle')}</Text>
      {summaryQ.isLoading ? (
        <Loading />
      ) : summary.length === 0 ? (
        <Empty text={t('myHealth.noReadings')} />
      ) : (
        summary.map((row: VitalSummaryRow) => {
          const series = (trend[row.vitalType] ?? []).map((p) => p.value);
          const outOfRange = row.outOfRange > 0;
          return (
            <View key={row.vitalType} style={styles.vitalCard}>
              <View style={styles.vitalCardInner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vitalName}>{t(`myHealth.vital_${row.vitalType}`)}</Text>
                  <View style={styles.vitalValueRow}>
                    <Text style={styles.vitalValue}>
                      {row.avg.toFixed(row.vitalType === 'blood_sugar_mmol' ? 1 : 0)}
                    </Text>
                    <Text style={styles.vitalUnit}>
                      {VITAL_UNIT[row.vitalType]} · {t('myHealth.avg')}
                    </Text>
                  </View>
                </View>
                <Sparkline data={series} color={outOfRange ? Colors.error : Brand.primary} />
              </View>
              {outOfRange && (
                <View style={styles.outOfRangeRow}>
                  <Ionicons name="warning" size={19} color={Colors.error} />
                  <Text style={styles.outOfRangeText}>
                    {t('myHealth.outOfRange', { count: row.outOfRange })}
                  </Text>
                </View>
              )}
            </View>
          );
        })
      )}

      {/* Medicines */}
      <Text style={styles.sectionLabel}>{t('myHealth.medsTitle')}</Text>

      {drafts.length > 0 && (
        <View style={styles.draftsBanner}>
          <Ionicons name="document-text-outline" size={22} color="#9a5b14" />
          <Text style={styles.draftsText}>{t('myHealth.draftsBanner', { count: drafts.length })}</Text>
        </View>
      )}

      {drafts.map((d: MedicationDraft) => (
        <View key={d.id} style={styles.draftCard}>
          <View style={styles.draftCardTop}>
            <View style={styles.pillIconTile}>
              <Ionicons name="medical" size={24} color={Brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.medName}>{d.name}</Text>
              {!!(d.dosage || d.frequency) && (
                <Text style={styles.medMeta}>
                  {[d.dosage, d.frequency].filter(Boolean).join(' · ')}
                </Text>
              )}
              <View style={styles.prescriptionBadge}>
                <Text style={styles.prescriptionBadgeText}>From prescription scan</Text>
              </View>
            </View>
          </View>
          <View style={styles.draftActions}>
            <Pressable
              style={styles.declineBtn}
              onPress={() => confirmMut.mutate({ confirm: [], discard: [d.id] })}
              disabled={confirmMut.isPending}
              accessibilityRole="button"
            >
              <Text style={styles.declineBtnText}>{t('neoSeniorOnboarding.reject')}</Text>
            </Pressable>
            <Pressable
              style={styles.addBtn}
              onPress={() => confirmMut.mutate({ confirm: [d.id], discard: [] })}
              disabled={confirmMut.isPending}
              accessibilityRole="button"
            >
              <Text style={styles.addBtnText}>{t('common.complete')}</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {medsQ.isLoading ? (
        <Loading />
      ) : meds.length === 0 && drafts.length === 0 ? (
        <Empty text={t('myHealth.noMeds')} />
      ) : (
        meds.map((m: Medication) => {
          const adh = adherence.find((a) => a.id === m.id);
          return (
            <View key={m.id} style={styles.medCard}>
              <View style={styles.medIconTile}>
                <Ionicons name="medical" size={24} color="#1f6b4f" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.medName}>{m.name}</Text>
                {!!(m.dosage || m.frequency) && (
                  <Text style={styles.medMeta}>
                    {[m.dosage, m.frequency, m.scheduledTimes?.join(', ')].filter(Boolean).join(' · ')}
                  </Text>
                )}
                {adh && (
                  <View style={styles.adherenceWrap}>
                    <View style={styles.adherenceHeader}>
                      <Text style={styles.adherenceLabel}>Last 30 days</Text>
                      <Text style={styles.adherenceLabel}>
                        {adh.taken} taken · {adh.missed} missed
                      </Text>
                    </View>
                    <View style={styles.adherenceBar}>
                      <View style={[styles.adherenceSegment, { flex: adh.taken, backgroundColor: Colors.success }]} />
                      <View style={[styles.adherenceSegment, { flex: adh.missed, backgroundColor: '#f0d6cf' }]} />
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })
      )}
    </Screen>
  );
}

function Loading() {
  return <ActivityIndicator color={Brand.primary} style={{ marginVertical: Spacing.lg }} />;
}
function Empty({ text }: { text: string }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },

  h1: {
    fontFamily: Fonts.heading,
    fontSize: FontSize['3xl'],
    color: Brand.primary,
    marginTop: 6,
    marginBottom: 0,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSize.lg,
    lineHeight: 27,
    color: Brand.mutedTeal,
    marginBottom: 24,
  },

  sectionLabel: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.lg,
    color: Brand.primaryForm,
    marginTop: 28,
    marginBottom: 12,
  },

  // Activity card
  activityCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    overflow: 'hidden',
    marginBottom: 0,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
  },
  logDivider: { borderTopWidth: 1, borderTopColor: '#f3ead6' },
  rowPressed: { opacity: 0.6 },
  tierDot: { width: 12, height: 12, borderRadius: 6, marginTop: 5 },
  logSummary: {
    fontFamily: Fonts.body,
    fontSize: FontSize.lg,
    lineHeight: 26,
    color: Brand.bodyText,
  },
  logTime: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.sm,
    color: Brand.mutedTeal,
    marginTop: 3,
  },

  // Vital cards
  vitalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    padding: 18,
    marginBottom: 14,
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  vitalCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  vitalName: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: Brand.mutedTeal,
  },
  vitalValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  vitalValue: {
    fontFamily: Fonts.heading,
    fontSize: 38,
    lineHeight: 40,
    color: Brand.primary,
  },
  vitalUnit: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.sm,
    color: Brand.mutedTeal,
  },
  outOfRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3ead6',
  },
  outOfRangeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.error,
  },

  // Drafts
  draftsBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f6e9c9',
    borderWidth: 1,
    borderColor: '#efd9a7',
    borderRadius: 16,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  draftsText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    lineHeight: 22,
    color: '#7a6230',
    flex: 1,
  },
  draftCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#efd9a7',
    padding: 18,
    marginBottom: 14,
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  draftCardTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  pillIconTile: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: Brand.accentPeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prescriptionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fdf0e1',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginTop: 8,
  },
  prescriptionBadgeText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#9a5b14',
  },
  draftActions: {
    flexDirection: 'row',
    gap: 10,
  },
  declineBtn: {
    flex: 1,
    height: 52,
    borderWidth: 2,
    borderColor: Brand.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: Brand.primary,
  },
  addBtn: {
    flex: 1,
    height: 52,
    backgroundColor: Brand.primaryForm,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: '#fff',
  },

  // Confirmed meds
  medCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    padding: 18,
    marginBottom: 14,
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  medIconTile: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#e6f0ec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: {
    fontFamily: Fonts.heading,
    fontSize: 19,
    color: Brand.primary,
  },
  medMeta: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Brand.bodyText,
    marginTop: 2,
  },
  adherenceWrap: { marginTop: 12 },
  adherenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  adherenceLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.sm,
    color: Brand.mutedTeal,
  },
  adherenceBar: {
    flexDirection: 'row',
    gap: 3,
    height: 10,
  },
  adherenceSegment: {
    borderRadius: 5,
  },

  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    padding: Spacing.lg,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.base,
    color: Colors.textMuted,
    lineHeight: 22,
  },
});
