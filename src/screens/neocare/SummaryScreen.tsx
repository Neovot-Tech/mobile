import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Share,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import Logo from '../../components/Logo';
import BrandAlert from '../../components/BrandAlert';
import SeniorSelector from '../../components/SeniorSelector';
import { useSelectedSenior } from '../../store/selectedSenior.store';
import { useAuthStore } from '../../store/auth.store';
import { getDoctorSummary, downloadSummaryPdf, SummaryWindow } from '../../services/summary.service';
import { getApiErrorMessage } from '../../services/http';
import { Colors, Brand, Fonts, FontSize, Spacing, BorderRadius } from '../../theme';

// ─── Screen-specific tokens ───────────────────────────────────────────────────
const GOLD = '#F4B459';
const CARD_BORDER = '#FFE6D5';
const CARD_HEADER_BG = Brand.primary;
const DASHED_BORDER = Brand.mutedTeal;
const DIVIDER = '#EFEBE4';

// ─── Filter chip config ───────────────────────────────────────────────────────
const CHIPS: { label: string; days: SummaryWindow }[] = [
  { label: 'This Week', days: 7 },
  { label: '2 Weeks', days: 14 },
  { label: 'This Month', days: 30 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcAge(dob?: string): string | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} yrs`;
}

function buildDateRange(days: number): string {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days + 1);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  title,
  trailing,
  children,
}: {
  title: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={card.wrapper}>
      <View style={card.header}>
        <Text style={card.title}>{title}</Text>
        {trailing}
      </View>
      <View style={card.body}>{children}</View>
    </View>
  );
}

function MedRow({
  name,
  dosage,
  frequency,
  showDivider,
}: {
  name: string;
  dosage?: string;
  frequency?: string;
  showDivider: boolean;
}) {
  const parts = [
    [name, dosage].filter(Boolean).join(' '),
    frequency || 'as directed',
    'ongoing',
  ];
  return (
    <>
      {showDivider && <View style={card.medDivider} />}
      <View style={card.medRow}>
        {parts.map((p, i) => (
          <Text key={i} style={[card.medCell, i === 0 && card.medName]} numberOfLines={2}>
            {p}
          </Text>
        ))}
      </View>
    </>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NeoCareSummaryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const senior = useSelectedSenior((s) => s.senior);
  const userId = senior?.userId ?? '';

  const [summaryDays, setSummaryDays] = useState<SummaryWindow>(7);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const firstName = user?.displayName?.split(' ')[0] ?? '';

  const summaryQ = useQuery({
    queryKey: ['doctorSummary', userId, summaryDays],
    queryFn: () => getDoctorSummary(userId, summaryDays),
    enabled: !!userId,
  });

  const medRows = summaryQ.data?.medicationAdherence ?? [];

  const adherencePct = useMemo(() => {
    const taken = medRows.reduce((s, r) => s + r.taken, 0);
    const total = medRows.reduce((s, r) => s + r.taken + r.missed, 0);
    return total > 0 ? Math.round((taken / total) * 100) : 0;
  }, [medRows]);

  const overview = summaryQ.data?.overview ?? null;
  const vitalsNarrative = summaryQ.data?.vitalsSummary?.narrative ?? null;
  const symptomsNarrative = summaryQ.data?.symptomLog?.narrative ?? null;

  const handleGenerateSummary = async () => {
    if (!userId) return;
    setExporting(true);
    try {
      const idToken = useAuthStore.getState().idToken ?? '';
      const uri = await downloadSummaryPdf(userId, summaryDays, idToken);
      // Web: browser download is already triggered inside downloadSummaryPdf.
      if (Platform.OS !== 'web') {
        await Share.share({ url: uri, message: `Health summary for ${senior?.fullName ?? 'patient'}` });
      }
    } catch (e) {
      setExportError(getApiErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const contentLoading = summaryQ.isLoading;

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Senior selector */}
        <View style={styles.selectorRow}>
          <SeniorSelector />
        </View>

        {/* Filter chips */}
        <View style={styles.chipRow}>
          {CHIPS.map((c) => {
            const active = c.days === summaryDays;
            return (
              <Pressable
                key={c.days}
                onPress={() => setSummaryDays(c.days)}
                accessibilityRole="button"
                style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
              >
                <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {!senior ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Select a senior to view their summary.</Text>
          </View>
        ) : (
          <>
            {/* Patient identity context block */}
            <View style={styles.patientBlock}>
              <View style={styles.seniorTag}>
                <Ionicons name="person-circle-outline" size={13} color={Brand.mutedTeal} />
                <Text style={styles.seniorTagText}>Linked NeoSenior</Text>
              </View>
              <Text style={styles.patientName}>{senior.fullName}</Text>

              {!!calcAge(senior.dateOfBirth) && (
                <View style={styles.patientRow}>
                  <Text style={styles.patientLabel}>Age</Text>
                  <Text style={styles.patientValue}>{calcAge(senior.dateOfBirth)}</Text>
                </View>
              )}
              {senior.conditions.length > 0 && (
                <View style={styles.patientRow}>
                  <Text style={styles.patientLabel}>Conditions</Text>
                  <Text style={[styles.patientValue, { flex: 1 }]} numberOfLines={3}>
                    {senior.conditions.join(', ')}
                  </Text>
                </View>
              )}
              <View style={styles.patientRow}>
                <Text style={styles.patientLabel}>NSR ID</Text>
                <Text style={styles.patientValue}>{senior.neoSeniorId}</Text>
              </View>
              <View style={styles.patientRow}>
                <Text style={styles.patientLabel}>Link Status</Text>
                <Text style={styles.patientValue}>
                  {senior.status.charAt(0).toUpperCase() + senior.status.slice(1)}
                </Text>
              </View>
              <View style={[styles.patientRow, { marginBottom: 0 }]}>
                <Text style={styles.patientLabel}>Reporting Period</Text>
                <Text style={styles.patientValue}>{buildDateRange(summaryDays)}</Text>
              </View>
            </View>

            {contentLoading ? (
              <ActivityIndicator color={Brand.primary} style={{ marginTop: Spacing['2xl'] }} />
            ) : (
              <>
                {/* Overview Card — shown only when the LLM produced one */}
                {!!overview && (
                  <SummaryCard title="Overview">
                    <Text style={card.narrativeText}>{overview}</Text>
                  </SummaryCard>
                )}

                {/* Medication Adherence Card */}
                <SummaryCard
                  title="Medication Adherence"
                  trailing={
                    <Text style={card.adherencePct}>{adherencePct}%</Text>
                  }
                >
                  {medRows.length > 0 ? (
                    medRows.map((m, idx) => (
                      <MedRow
                        key={idx}
                        name={m.name}
                        dosage={m.dosage}
                        frequency={m.frequency}
                        showDivider={idx > 0}
                      />
                    ))
                  ) : (
                    <Text style={card.noDataText}>No medication data for this period.</Text>
                  )}
                </SummaryCard>

                {/* Vitals Summary Card */}
                <SummaryCard title="Vitals Summary">
                  <Text style={card.narrativeText}>
                    {vitalsNarrative || 'No vitals summary available for this period.'}
                  </Text>
                </SummaryCard>

                {/* Symptoms Summary Card */}
                <SummaryCard title="Symptoms Summary">
                  <Text style={card.narrativeText}>
                    {symptomsNarrative || 'No symptom summary available for this period.'}
                  </Text>
                </SummaryCard>

                {/* Generate Summary button */}
                <Pressable
                  onPress={handleGenerateSummary}
                  disabled={exporting}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.generateBtn,
                    (pressed || exporting) && styles.generateBtnPressed,
                  ]}
                >
                  {exporting ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="document-text-outline" size={20} color={Colors.white} style={{ marginRight: 10 }} />
                      <Text style={styles.generateBtnText}>Generate Summary</Text>
                    </>
                  )}
                </Pressable>
              </>
            )}
          </>
        )}
      </ScrollView>

      <BrandAlert
        visible={!!exportError}
        title="Export Failed"
        message={exportError ?? ''}
        onDismiss={() => setExportError(null)}
      />
    </View>
  );
}

// ─── Card sub-styles ──────────────────────────────────────────────────────────

const card = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  header: {
    backgroundColor: CARD_HEADER_BG,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  adherencePct: {
    fontFamily: Fonts.headingBold,
    fontSize: 15,
    fontWeight: '700',
    color: GOLD,
  },
  body: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
  },
  narrativeText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.base,
    color: Brand.primary,
    lineHeight: 22,
    flexShrink: 1,
  },
  noDataText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.mutedTeal,
    lineHeight: 22,
  },
  medDivider: {
    height: 1,
    backgroundColor: DIVIDER,
    marginVertical: 0,
  },
  medRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  medCell: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.mutedTeal,
    flex: 1,
    textAlign: 'center',
  },
  medName: {
    flex: 2,
    textAlign: 'left',
    color: Brand.primary,
    fontFamily: Fonts.bodyMedium,
  },
});

// ─── Screen styles ────────────────────────────────────────────────────────────

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
    borderBottomColor: DIVIDER,
  },
  greeting: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    color: Brand.primary,
  },

  body: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },

  selectorRow: {
    marginBottom: Spacing.base,
  },

  // Filter chips
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: Brand.primary,
  },
  chipInactive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.sm,
  },
  chipTextActive: { color: Colors.white },
  chipTextInactive: { color: Brand.primary },

  // Patient context block
  patientBlock: {
    borderWidth: 1,
    borderColor: DASHED_BORDER,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    backgroundColor: '#FFF6E6',
  },
  seniorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: Spacing.sm,
  },
  seniorTagText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.xs,
    color: Brand.mutedTeal,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  patientName: {
    fontFamily: Fonts.headingBold,
    fontSize: 16,
    fontWeight: '700',
    color: Brand.primary,
    marginBottom: Spacing.base,
  },
  patientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  patientLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSize.base,
    color: Brand.mutedTeal,
    flexShrink: 0,
  },
  patientValue: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Brand.primary,
    flexShrink: 1,
    textAlign: 'right',
  },

  // Generate button
  generateBtn: {
    height: 54,
    backgroundColor: Brand.primary,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  generateBtnPressed: { opacity: 0.75 },
  generateBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },

  emptyBox: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.base,
    color: Brand.mutedTeal,
    textAlign: 'center',
  },
});
