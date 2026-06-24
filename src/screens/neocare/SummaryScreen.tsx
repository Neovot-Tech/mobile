import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Share } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import Screen from '../../components/Screen';
import BrandAlert from '../../components/BrandAlert';
import SeniorSelector from '../../components/SeniorSelector';
import { useSelectedSenior } from '../../store/selectedSenior.store';
import { getDoctorSummary, downloadSummaryPdf, SummaryWindow } from '../../services/summary.service';
import { getApiErrorMessage } from '../../services/http';
import { useAuthStore } from '../../store/auth.store';
import { Colors, Brand, Fonts, FontSize, Spacing, BorderRadius, MinTapTarget } from '../../theme';

const WINDOWS: SummaryWindow[] = [7, 14, 30];

function humanize(key: string): string {
  return key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

/** Render an open-ended JSON value (the summary shapes aren't fixed). */
function renderValue(value: unknown, noneLabel: string): React.ReactNode {
  if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
    return <Text style={styles.muted}>{noneLabel}</Text>;
  }
  if (Array.isArray(value)) {
    return (
      <View style={{ gap: Spacing.xs }}>
        {value.map((item, i) => (
          <Text key={i} style={styles.value}>
            • {typeof item === 'object' ? Object.values(item as object).filter((v) => v != null).join(' · ') : String(item)}
          </Text>
        ))}
      </View>
    );
  }
  if (typeof value === 'object') {
    return (
      <View style={{ gap: Spacing.xs }}>
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <View key={k} style={styles.kvRow}>
            <Text style={styles.kvKey}>{humanize(k)}</Text>
            <Text style={styles.kvVal}>{v == null ? '—' : String(v)}</Text>
          </View>
        ))}
      </View>
    );
  }
  return <Text style={styles.value}>{String(value)}</Text>;
}

export default function NeoCareSummaryScreen() {
  const { t } = useTranslation();
  const senior = useSelectedSenior((s) => s.senior);
  const userId = senior?.userId ?? '';

  const [days, setDays] = useState<SummaryWindow>(7);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const summaryQ = useQuery({
    queryKey: ['summary', userId, days],
    queryFn: () => getDoctorSummary(userId, days),
    enabled: !!userId,
  });
  const data = summaryQ.data;

  const handleShare = async () => {
    setExporting(true);
    try {
      const idToken = useAuthStore.getState().idToken ?? '';
      const uri = await downloadSummaryPdf(userId, days, idToken);
      await Share.share({ url: uri, message: t('neoCareSummary.title') });
    } catch (e) {
      setErrorMsg(getApiErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <BrandAlert
        visible={!!errorMsg}
        title={t('neoCareSummary.exportFailed')}
        message={errorMsg ?? ''}
        onDismiss={() => setErrorMsg(null)}
      />
        <Text style={styles.h1}>{t('neoCareSummary.title')}</Text>
        <Text style={styles.subtitle}>{t('neoCareSummary.subtitle')}</Text>
        <SeniorSelector />

        {senior && (
          <>
            {/* Window selector */}
            <View style={styles.segment}>
              {WINDOWS.map((w) => {
                const active = w === days;
                return (
                  <Pressable
                    key={w}
                    onPress={() => setDays(w)}
                    style={[styles.segmentBtn, active && styles.segmentActive]}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                      {t('neoCareSummary.days', { count: w })}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {summaryQ.isLoading ? (
              <ActivityIndicator color={Brand.primary} style={{ marginTop: Spacing['2xl'] }} />
            ) : !data ? (
              <Text style={styles.muted}>{t('neoCareSummary.empty')}</Text>
            ) : (
              <>
                <Section title={t('neoCareSummary.sectionProfile')}>{renderValue(data.profile, t('neoCareSummary.none'))}</Section>
                <Section title={t('neoCareSummary.sectionVitals')}>{renderValue(data.vitalsSummary, t('neoCareSummary.none'))}</Section>
                <Section title={t('neoCareSummary.sectionAdherence')}>{renderValue(data.medicationAdherence, t('neoCareSummary.none'))}</Section>
                <Section title={t('neoCareSummary.sectionSymptoms')}>{renderValue(data.symptomLog, t('neoCareSummary.none'))}</Section>
                <AiFlagsSection title={t('neoCareSummary.sectionFlags')}>{renderValue(data.aiFlags, t('neoCareSummary.none'))}</AiFlagsSection>

                <Pressable
                  style={[styles.exportBtn, exporting && styles.exportDisabled]}
                  onPress={handleShare}
                  disabled={exporting}
                  accessibilityRole="button"
                >
                  {exporting ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="share-outline" size={20} color={Colors.white} />
                      <Text style={styles.exportText}>{t('neoCareSummary.exportPdf')}</Text>
                    </>
                  )}
                </Pressable>
              </>
            )}
          </>
        )}
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function AiFlagsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.aiSection}>
      <View style={styles.aiSectionHeader}>
        <Ionicons name="flash-outline" size={16} color="#9a5b14" />
        <Text style={styles.aiSectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.bgCream },
  content: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  h1: { fontFamily: Fonts.heading, fontSize: FontSize['2xl'], color: Brand.primary },
  subtitle: { fontFamily: Fonts.body, fontSize: FontSize.base, color: Brand.bodyText, marginTop: Spacing.xs, marginBottom: Spacing.base },

  segment: {
    flexDirection: 'row',
    backgroundColor: Brand.bgWarmCard,
    borderRadius: BorderRadius.full,
    padding: 3,
    marginBottom: Spacing.lg,
  },
  segmentBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, alignItems: 'center' },
  segmentActive: { backgroundColor: Brand.primary },
  segmentText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.sm, color: Brand.primaryText },
  segmentTextActive: { color: Colors.white },

  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.base, color: Brand.primary, marginBottom: Spacing.sm },
  value: { fontFamily: Fonts.body, fontSize: FontSize.base, color: Brand.primaryContent, lineHeight: 22 },
  muted: { fontFamily: Fonts.body, fontSize: FontSize.base, color: Colors.textMuted },
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.base },
  kvKey: { fontFamily: Fonts.body, fontSize: FontSize.base, color: Brand.mutedTeal, flexShrink: 1 },
  kvVal: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.base, color: Brand.primaryContent, textAlign: 'right', flexShrink: 1 },

  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: MinTapTarget.neoSenior,
    backgroundColor: Brand.primaryForm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.base,
  },
  exportDisabled: { opacity: 0.6 },
  exportText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.base, color: Colors.white },

  aiSection: {
    backgroundColor: '#FDF0E1',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#F5D9AC',
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  aiSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  aiSectionTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.base,
    color: '#9a5b14',
  },
});
