import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import Screen from '../../components/Screen';
import SeniorSelector from '../../components/SeniorSelector';
import { NeoCareAppStackParamList } from '../../navigation/types';
import Sparkline from '../../components/Sparkline';
import { useSelectedSenior } from '../../store/selectedSenior.store';
import { getVitalsSummary, getVitalsTrend } from '../../services/vitals.service';
import { getMedications, getAdherence } from '../../services/medications.service';
import { getHealthLogs } from '../../services/healthLogs.service';
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
  return Brand.mutedTeal;
}

export default function NeoCareHealthScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<NeoCareAppStackParamList>>();
  const senior = useSelectedSenior((s) => s.senior);
  const userId = senior?.userId ?? '';
  const perms = senior?.permissions;

  const canVitals = !!perms?.vitals;
  const canMeds = !!perms?.medications;
  const canSymptoms = !!perms?.symptoms;

  const summaryQ = useQuery({ queryKey: ['nc-vitalsSummary', userId], queryFn: () => getVitalsSummary(userId), enabled: !!userId && canVitals });
  const trendQ = useQuery({ queryKey: ['nc-vitalsTrend', userId], queryFn: () => getVitalsTrend(userId), enabled: !!userId && canVitals });
  const medsQ = useQuery({ queryKey: ['nc-meds', userId], queryFn: () => getMedications(userId), enabled: !!userId && canMeds });
  const adherenceQ = useQuery({ queryKey: ['nc-adherence', userId], queryFn: () => getAdherence(userId), enabled: !!userId && canMeds });
  const logsQ = useQuery({ queryKey: ['nc-logs', userId], queryFn: () => getHealthLogs(userId, { limit: 8 }), enabled: !!userId && canSymptoms });

  const summary = summaryQ.data?.summary ?? [];
  const trend = trendQ.data?.trend ?? {};
  const meds = medsQ.data ?? [];
  const adherence = adherenceQ.data?.adherence ?? [];
  const logs = logsQ.data?.logs ?? [];
  const name = senior?.fullName ?? '';

  return (
    <Screen contentContainerStyle={styles.content}>
        <Text style={styles.h1}>{t('neoCareHealth.title')}</Text>
        <SeniorSelector />

        {senior && (
          <>
            {/* Vitals */}
            <Text style={styles.sectionLabel}>{t('neoCareHealth.vitals')}</Text>
            {!canVitals ? (
              <Locked text={t('neoCareHealth.noAccess', { name })} />
            ) : summaryQ.isLoading ? (
              <Loading />
            ) : summary.length === 0 ? (
              <Empty text={t('neoCareHealth.noVitals')} />
            ) : (
              summary.map((row) => {
                const series = (trend[row.vitalType] ?? []).map((p) => p.value);
                return (
                  <View key={row.vitalType} style={styles.vitalCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vitalName}>{t(`myHealth.vital_${row.vitalType}`)}</Text>
                      <Text style={styles.vitalValue}>
                        {row.avg.toFixed(row.vitalType === 'blood_sugar_mmol' ? 1 : 0)}
                        <Text style={styles.vitalUnit}> {VITAL_UNIT[row.vitalType]}</Text>
                      </Text>
                      {row.outOfRange > 0 && (
                        <Text style={styles.outOfRange}>{t('myHealth.outOfRange', { count: row.outOfRange })}</Text>
                      )}
                    </View>
                    <Sparkline data={series} color={row.outOfRange > 0 ? Colors.error : Brand.primary} />
                  </View>
                );
              })
            )}

            {/* Medications */}
            <Text style={styles.sectionLabel}>{t('neoCareHealth.medications')}</Text>
            {!canMeds ? (
              <Locked text={t('neoCareHealth.noAccess', { name })} />
            ) : medsQ.isLoading ? (
              <Loading />
            ) : meds.length === 0 ? (
              <Empty text={t('neoCareHealth.noMeds')} />
            ) : (
              meds.map((m) => {
                const adh = adherence.find((a) => a.id === m.id);
                return (
                  <View key={m.id} style={styles.medCard}>
                    <View style={styles.medIcon}>
                      <Ionicons name="medical" size={20} color={Brand.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.medName}>{m.name}</Text>
                      {!!(m.dosage || m.frequency) && (
                        <Text style={styles.medMeta}>{[m.dosage, m.frequency].filter(Boolean).join(' · ')}</Text>
                      )}
                      {adh && (
                        <Text style={styles.medMeta}>{t('neoCareHealth.adherence', { taken: adh.taken, missed: adh.missed })}</Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}

            {/* Symptoms */}
            <Text style={styles.sectionLabel}>{t('neoCareHealth.symptoms')}</Text>
            {!canSymptoms ? (
              <Locked text={t('neoCareHealth.noAccess', { name })} />
            ) : logsQ.isLoading ? (
              <Loading />
            ) : logs.length === 0 ? (
              <Empty text={t('neoCareHealth.noSymptoms')} />
            ) : (
              <View style={styles.card}>
                {logs.map((log, i) => (
                  <Pressable
                    key={log.id}
                    onPress={() => navigation.navigate('HealthLogEntry', { logId: log.id })}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.logRow, i > 0 && styles.divider, pressed && styles.rowPressed]}
                  >
                    <View style={[styles.tierDot, { backgroundColor: tierColor(log.escalationTier) }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.logSummary}>{log.aiSummary}</Text>
                      <Text style={styles.logTime}>{new Date(log.loggedAt).toLocaleString()}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
    </Screen>
  );
}

function Loading() {
  return <ActivityIndicator color={Brand.primary} style={{ marginVertical: Spacing.lg }} />;
}
function Empty({ text }: { text: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.boxText}>{text}</Text>
    </View>
  );
}
function Locked({ text }: { text: string }) {
  return (
    <View style={styles.locked}>
      <View style={styles.lockedIconCircle}>
        <Ionicons name="lock-closed" size={22} color={Brand.mutedTeal} />
      </View>
      <Text style={styles.lockedText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.bgCream },
  content: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  h1: { fontFamily: Fonts.heading, fontSize: FontSize['2xl'], color: Brand.primary, marginBottom: Spacing.base },
  sectionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.base,
    color: Brand.primaryText,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },

  vitalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    gap: Spacing.base,
  },
  vitalName: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.base, color: Brand.primaryContent },
  vitalValue: { fontFamily: Fonts.heading, fontSize: FontSize.xl, color: Brand.primary, marginTop: 2 },
  vitalUnit: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: Brand.mutedTeal },
  outOfRange: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.sm, color: Colors.error, marginTop: 2 },

  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  medIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Brand.bgWarmCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.base, color: Brand.primaryContent },
  medMeta: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: Brand.bodyText, marginTop: 2 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    paddingHorizontal: Spacing.lg,
  },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.base },
  rowPressed: { opacity: 0.6 },
  divider: { borderTopWidth: 1, borderTopColor: Brand.borderCard },
  tierDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  logSummary: { fontFamily: Fonts.body, fontSize: FontSize.base, lineHeight: 22, color: Brand.primaryContent },
  logTime: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: Brand.mutedTeal, marginTop: 2 },

  box: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    padding: Spacing.lg,
  },
  locked: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Brand.borderForm,
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  lockedIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F2F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  lockedText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.base,
    color: Brand.mutedTeal,
    textAlign: 'center',
    lineHeight: 22,
  },
  boxText: { fontFamily: Fonts.body, fontSize: FontSize.base, color: Brand.mutedTeal, flexShrink: 1, lineHeight: 22 },
});
