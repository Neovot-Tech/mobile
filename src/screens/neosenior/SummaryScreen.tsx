import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '../../store/auth.store';
import { getDoctorSummary, downloadSummaryPdf, SummaryWindow } from '../../services/summary.service';
import { getMedications, Medication } from '../../services/medications.service';
import { getApiErrorMessage } from '../../services/http';
import { Brand, Fonts, FontSize } from '../../theme';
import Logo from '../../components/Logo';
import BrandAlert from '../../components/BrandAlert';

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterChip = 'All' | 'This Week' | 'This Month';

function filterToDays(f: FilterChip): SummaryWindow {
  if (f === 'This Week') return 7;
  return 30;
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getReportingPeriod(windowDays: number): string {
  const now = new Date();
  const start = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  return `${start.getDate()} ${MON_SHORT[start.getMonth()]} – ${now.getDate()} ${MON_SHORT[now.getMonth()]}, ${now.getFullYear()}`;
}

function getField(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    if (obj[k] != null && obj[k] !== '') return String(obj[k]);
  }
  return '–';
}

function sumAdherenceRows(rows: unknown[]): string {
  let taken = 0, total = 0;
  for (const r of rows) {
    if (r && typeof r === 'object') {
      const row = r as Record<string, unknown>;
      const t = Number(row.taken ?? 0);
      const m = Number(row.missed ?? 0);
      taken += t;
      total += t + m;
    }
  }
  return total > 0 ? `${Math.round((taken / total) * 100)}%` : '–';
}

function extractAdherencePct(data: unknown): string {
  if (!data) return '–';
  if (Array.isArray(data)) return sumAdherenceRows(data);
  if (typeof data !== 'object') return '–';
  const obj = data as Record<string, unknown>;
  const pct = obj.overall_pct ?? obj.overall_adherence_pct ?? obj.pct;
  if (pct != null) return `${Math.round(Number(pct))}%`;
  const rows = (obj.adherence ?? obj.medications) as unknown[] | undefined;
  if (Array.isArray(rows) && rows.length > 0) return sumAdherenceRows(rows);
  return '–';
}

function medRowsToLines(rows: unknown[]): string[] {
  return rows.flatMap((r) => {
    if (typeof r === 'string') return [r];
    if (r && typeof r === 'object') {
      const row = r as Record<string, unknown>;
      const parts = [row.name, row.dosage, row.frequency].filter(Boolean);
      return parts.length ? [parts.join('   –   ')] : [];
    }
    return [];
  });
}

function extractMedLines(adherenceData: unknown, activeMeds: Medication[]): string[] {
  // flat array (new backend shape)
  if (Array.isArray(adherenceData) && adherenceData.length > 0) {
    const lines = medRowsToLines(adherenceData);
    if (lines.length > 0) return lines;
  }
  // wrapped object (old shape)
  if (adherenceData && typeof adherenceData === 'object' && !Array.isArray(adherenceData)) {
    const obj = adherenceData as Record<string, unknown>;
    const rows = obj.adherence ?? obj.medications;
    if (Array.isArray(rows) && rows.length > 0) {
      const lines = medRowsToLines(rows);
      if (lines.length > 0) return lines;
    }
  }
  return activeMeds
    .filter((m) => m.active)
    .map((m) => [m.name, m.dosage, m.frequency].filter(Boolean).join('   –   '));
}

const VITAL_LABEL: Record<string, string> = {
  bp_systolic: 'Systolic BP', bp_diastolic: 'Diastolic BP',
  pulse_rate: 'Pulse', blood_sugar_mmol: 'Blood Sugar',
  spo2_pct: 'SpO₂', heart_rate_bpm: 'Heart Rate', weight_kg: 'Weight',
};

const LOG_LABEL_S: Record<string, string> = {
  symptom: 'Symptom', vitals: 'Vitals', medication: 'Medication', prescription: 'Prescription',
};

function formatItemTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
}

function VitalAggRow({ item }: { item: unknown }) {
  if (!item || typeof item !== 'object') return null;
  const r = item as Record<string, unknown>;
  const label = VITAL_LABEL[String(r.vital_type)] ?? String(r.vital_type ?? '').replace(/_/g, ' ');
  const avg = r.avg != null ? Number(r.avg).toFixed(1) : '–';
  const min = r.min != null ? Number(r.min).toFixed(1) : null;
  const max = r.max != null ? Number(r.max).toFixed(1) : null;
  const count = r.count != null ? `${r.count} reading${Number(r.count) !== 1 ? 's' : ''}` : '';
  const range = min && max ? ` (${min}–${max})` : '';
  return (
    <View style={itemRow.vitalsRow}>
      <Text style={itemRow.vitalsLabel}>{label}</Text>
      <Text style={itemRow.vitalsValue}>avg {avg}{range}{count ? `  ·  ${count}` : ''}</Text>
    </View>
  );
}

function SymptomLogRow({ item }: { item: unknown }) {
  if (!item || typeof item !== 'object') return null;
  const r = item as Record<string, unknown>;
  const time = r.logged_at ? formatItemTime(String(r.logged_at)) : '–';
  const type = LOG_LABEL_S[String(r.log_type ?? '')] ?? 'Log';
  const summary = r.ai_summary ? String(r.ai_summary) : '';
  const tier = String(r.escalation_tier ?? 'none');
  const tierLabel = tier === 'urgent' ? ' · Alert' : (tier === 'warning' || tier === 'info') ? ' · Watch' : '';
  return (
    <View style={itemRow.symptomRow}>
      <Text style={itemRow.symptomMeta}>{time}  ·  {type}{tierLabel}</Text>
      {!!summary && <Text style={itemRow.symptomSummary} numberOfLines={2}>{summary}</Text>}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NeoSeniorSummaryScreen() {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const displayName = useAuthStore((s) => s.user?.displayName ?? '');

  const [filter, setFilter] = useState<FilterChip>('All');
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const days = filterToDays(filter);

  const summaryQ = useQuery({
    queryKey: ['doctorSummary', userId, days],
    queryFn: () => getDoctorSummary(userId, days),
    enabled: !!userId,
  });
  const medsQ = useQuery({
    queryKey: ['medications', userId],
    queryFn: () => getMedications(userId),
    enabled: !!userId,
  });

  const data = summaryQ.data;
  const meds = medsQ.data ?? [];
  const profile = data?.profile ?? {};
  const isLoading = summaryQ.isLoading;

  // ── Patient metadata rows ─────────────────────────────────────────────────
  const profileRows = useMemo<Array<{ label: string; value: string }>>(() => {
    const rows: Array<{ label: string; value: string }> = [];
    rows.push({
      label: 'Condition',
      value: getField(profile, 'conditions', 'medical_conditions', 'diagnosis', 'diagnoses'),
    });
    const dob = getField(profile, 'date_of_birth', 'dob', 'birth_date');
    if (dob !== '–') rows.push({ label: 'Date of Birth', value: dob });
    const age = getField(profile, 'age');
    if (age !== '–') rows.push({ label: 'Age', value: `${age} yrs` });
    const blood = getField(profile, 'blood_group', 'blood_type');
    if (blood !== '–') rows.push({ label: 'Blood Group', value: blood });
    const activeMedCount = meds.filter((m) => m.active).length;
    if (activeMedCount > 0) {
      rows.push({ label: 'Active Medications', value: String(activeMedCount) });
    }
    const ec = profile.emergency_contact;
    if (ec && typeof ec === 'object') {
      const ecObj = ec as Record<string, unknown>;
      const ecStr = [ecObj.name, ecObj.phone].filter(Boolean).join(' · ');
      if (ecStr) rows.push({ label: 'Emergency Contact', value: ecStr });
    } else {
      const emergency = getField(profile, 'next_of_kin');
      if (emergency !== '–') rows.push({ label: 'Emergency Contact', value: emergency });
    }
    const phone = getField(profile, 'phone', 'phone_number', 'contact_phone');
    if (phone !== '–') rows.push({ label: 'Phone', value: phone });
    rows.push({
      label: 'Reporting Period',
      value: data ? getReportingPeriod(data.windowDays) : '–',
    });
    return rows;
  }, [profile, meds, data]);

  // ── Derived card content ──────────────────────────────────────────────────
  const adherencePct = useMemo(() => extractAdherencePct(data?.medicationAdherence), [data]);
  const medLines = useMemo(
    () => extractMedLines(data?.medicationAdherence, meds),
    [data, meds],
  );
  const vitalsNarrative = data?.vitalsSummary?.narrative;
  const vitalsItems = data?.vitalsSummary?.items ?? [];
  const symptomsNarrative = data?.symptomLog?.narrative;
  const symptomsItems = data?.symptomLog?.items ?? [];

  // ── Avatar & display ──────────────────────────────────────────────────────
  const initials = displayName
    .trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  const lastName = displayName.trim().split(/\s+/).pop() ?? displayName;
  const formalName = lastName ? `Ms. ${lastName}` : displayName.trim() || '–';

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setExporting(true);
    try {
      const idToken = useAuthStore.getState().idToken ?? '';
      const uri = await downloadSummaryPdf(userId, days, idToken);
      if (Platform.OS !== 'web') {
        await Share.share({ url: uri, message: 'Neovot Health Summary' });
      }
    } catch (e) {
      setErrorMsg(getApiErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Logo />
        <View style={styles.userCluster}>
          {displayName ? (
            <Text style={styles.userName} numberOfLines={1}>{displayName.trim()}</Text>
          ) : null}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials || '?'}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
      >
        {/* Filter chips */}
        <View style={styles.filterRow}>
          {(['All', 'This Week', 'This Month'] as FilterChip[]).map((f) => (
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

        {isLoading ? (
          <ActivityIndicator size="large" color={Brand.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* 2. Overview — top-level AI narrative for the period */}
            {data?.overview ? (
              <View style={styles.overviewCard}>
                <Ionicons name="sparkles-outline" size={15} color={Brand.primary} style={{ marginTop: 1 }} />
                <Text style={styles.overviewText}>{data.overview}</Text>
              </View>
            ) : null}

            {/* 3. Patient metadata card */}
            <View style={styles.metaCard}>
              <Text style={styles.metaName}>{formalName}</Text>
              {profileRows.map((row, i) => (
                <View key={row.label} style={[styles.metaRow, i > 0 && styles.metaRowTop]}>
                  <Text style={styles.metaLabel}>{row.label}</Text>
                  <Text style={styles.metaValue} numberOfLines={2}>{row.value}</Text>
                </View>
              ))}
            </View>

            {/* 4. Medication adherence card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderTitle}>Medication Adherence</Text>
                <Text style={styles.sectionHeaderRight}>{adherencePct}</Text>
              </View>
              <View style={styles.sectionBody}>
                {medLines.length > 0 ? (
                  medLines.map((line, i) => (
                    <Text
                      key={i}
                      style={[styles.medLine, i > 0 && { marginTop: 16 }]}
                    >
                      {line}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.medLine}>No active medications on record</Text>
                )}
              </View>
            </View>

            {/* 5a. Vitals summary card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderTitle}>Vitals Summary</Text>
              </View>
              <View style={styles.sectionBody}>
                <Text style={styles.bodyText}>
                  {vitalsNarrative ?? 'No vitals narrative available for this period.'}
                </Text>
                {vitalsItems.length > 0 && (
                  <View style={styles.itemsList}>
                    {vitalsItems.map((item, i) => (
                      <VitalAggRow key={i} item={item} />
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* 5b. Symptoms summary card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderTitle}>Symptoms Summary</Text>
              </View>
              <View style={styles.sectionBody}>
                <Text style={styles.bodyText}>
                  {symptomsNarrative ?? 'No symptoms narrative available for this period.'}
                </Text>
                {symptomsItems.length > 0 && (
                  <View style={styles.itemsList}>
                    {symptomsItems.map((item, i) => (
                      <SymptomLogRow key={i} item={item} />
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* 6. Generate Summary button */}
            <Pressable
              style={({ pressed }) => [
                styles.generateBtn,
                (exporting || pressed) && { opacity: 0.8 },
              ]}
              onPress={handleGenerate}
              disabled={exporting}
              accessibilityRole="button"
              accessibilityLabel="Generate and share health summary"
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color="#FFFFFF"
                    style={styles.btnIcon}
                  />
                  <Text style={styles.generateBtnText}>Generate Summary</Text>
                </>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>

      <BrandAlert
        visible={!!errorMsg}
        title="Export failed"
        message={errorMsg ?? ''}
        onDismiss={() => setErrorMsg(null)}
      />
    </View>
  );
}

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

  scrollContent: { paddingHorizontal: 20 },

  // Filter chips
  filterRow: { flexDirection: 'row', marginVertical: 16, gap: 10 },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE6C2',
  },
  chipActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  chipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Brand.primary,
  },
  chipTextActive: { color: '#FFFFFF' },

  // 3. Patient metadata card
  metaCard: {
    borderWidth: 1,
    borderColor: Brand.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    backgroundColor: '#FFF6E6',
  },
  metaName: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    fontWeight: '700',
    color: Brand.primary,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metaRowTop: { marginTop: 12 },
  metaLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.mutedTeal,
    flex: 1,
  },
  metaValue: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Brand.primary,
    textAlign: 'right',
    flex: 1,
    flexShrink: 1,
  },

  // 4–5. Section cards (dark teal header + white body)
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE6C2',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Brand.primary,
    padding: 14,
  },
  sectionHeaderTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeaderRight: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.base,
    fontWeight: '700',
    color: '#FFE6C2',
  },
  sectionBody: { padding: 16 },
  medLine: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Brand.primary,
    lineHeight: 20,
  },
  bodyText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Brand.primary,
    lineHeight: 20,
  },

  // 2. Overview card
  overviewCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0F8F6',
    borderWidth: 1,
    borderColor: '#C2EAF2',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  overviewText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Brand.primary,
    flex: 1,
  },

  // Items list inside section cards
  itemsList: {
    marginTop: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#FFE6C2',
    paddingTop: 12,
  },

  // 6. Generate button
  generateBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Brand.primary,
    borderRadius: 8,
    paddingVertical: 14,
    marginVertical: 16,
  },
  btnIcon: { marginRight: 8 },
  generateBtnText: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

const itemRow = StyleSheet.create({
  vitalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  vitalsLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Brand.primary,
    flex: 1,
  },
  vitalsValue: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Brand.mutedTeal,
    textAlign: 'right',
    flexShrink: 1,
  },
  symptomRow: {
    paddingVertical: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#FFE6C2',
    paddingLeft: 10,
  },
  symptomMeta: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Brand.mutedTeal,
    marginBottom: 2,
  },
  symptomSummary: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Brand.primary,
    lineHeight: 18,
  },
});
