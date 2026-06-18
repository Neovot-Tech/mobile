import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import ScreenShell from './ScreenShell';
import FormCard from './FormCard';
import LabeledInput from './LabeledInput';
import PhoneInput from './PhoneInput';
import PrimaryButton from './PrimaryButton';
import DateInput from './DateInput';
import ConditionMultiSelect from './ConditionMultiSelect';
import { Brand, Colors, Fonts, FontSize, Spacing, BorderRadius, MinTapTarget } from '../theme';
import { NeoSeniorProfilePayload } from '../services/onboarding.service';
import type { PreferredLang } from '../services/types';

// ─── Threshold config ─────────────────────────────────────────────────────────

type ThresholdField =
  | 'bpHighThreshold'
  | 'sugarHighMmol'
  | 'heartRateHigh'
  | 'heartRateLow'
  | 'spo2LowThreshold';

interface ThresholdConfig {
  field: ThresholdField;
  label: string;
  unit: string;
  defaultVal: number;
  hint: string;
}

// Only bp + sugar can be set at profile creation; heart rate + SpO₂ are
// update-only in the contract and are sent via a follow-up PUT in the service.
// We collect all of them here and let the service handle the two-step write.
const THRESHOLD_MAP: Record<string, ThresholdConfig[]> = {
  Hypertension: [
    {
      field: 'bpHighThreshold',
      label: 'Blood pressure target (systolic)',
      unit: 'mmHg',
      defaultVal: 140,
      hint: 'Alert fires when readings exceed this. Default: 140 mmHg.',
    },
  ],
  Diabetes: [
    {
      field: 'sugarHighMmol',
      label: 'Blood sugar target',
      unit: 'mmol/L',
      defaultVal: 10.0,
      hint: 'Alert fires when readings exceed this. Default: 10.0 mmol/L.',
    },
  ],
  'Heart condition': [
    {
      field: 'heartRateHigh',
      label: 'Heart rate — upper limit',
      unit: 'bpm',
      defaultVal: 100,
      hint: 'Alert fires above this. Default: 100 bpm.',
    },
    {
      field: 'heartRateLow',
      label: 'Heart rate — lower limit',
      unit: 'bpm',
      defaultVal: 50,
      hint: 'Alert fires below this. Default: 50 bpm.',
    },
  ],
  'COPD/Respiratory': [
    {
      field: 'spo2LowThreshold',
      label: 'Oxygen saturation (SpO₂) limit',
      unit: '%',
      defaultVal: 94,
      hint: 'Alert fires below this. Default: 94%.',
    },
  ],
};

// ─── Language options ─────────────────────────────────────────────────────────

const LANG_OPTIONS: { key: PreferredLang; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'tw', label: 'Twi' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

type Phase = 'form' | 'review';

interface ElderlyProfileFlowProps {
  title: string;
  greeting?: React.ReactNode;
  subtitle: string;
  onSubmit: (data: NeoSeniorProfilePayload) => Promise<void>;
  submitting: boolean;
  /** Rendered in ScreenShell.headerRight, e.g. <StepDots current={2} total={3} /> */
  headerRight?: React.ReactNode;
}

export default function ElderlyProfileFlow({
  title,
  greeting,
  subtitle,
  onSubmit,
  submitting,
  headerRight,
}: ElderlyProfileFlowProps) {
  const { t } = useTranslation();

  const [phase, setPhase] = useState<Phase>('form');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [preferredLang, setPreferredLang] = useState<PreferredLang>('en');
  const [conditions, setConditions] = useState<string[]>([]);
  const [thresholds, setThresholds] = useState<Partial<Record<ThresholdField, string>>>({});

  const formValid = !!fullName.trim();
  const activeThresholds = conditions.flatMap((c) => THRESHOLD_MAP[c] ?? []);

  const setThresholdValue = (field: ThresholdField, val: string) =>
    setThresholds((prev) => ({ ...prev, [field]: val }));

  const getThresholdDisplay = (item: ThresholdConfig): string =>
    thresholds[item.field] ?? `${item.defaultVal}`;

  const handleSubmit = () => {
    const selectedSet = new Set(conditions);

    const payload: NeoSeniorProfilePayload = {
      fullName: fullName.trim(),
      phone,
      dateOfBirth: dateOfBirth || undefined,
      preferredLang,
      conditions,
      bpHighThreshold:
        selectedSet.has('Hypertension') && thresholds.bpHighThreshold
          ? parseFloat(thresholds.bpHighThreshold)
          : undefined,
      sugarHighMmol:
        selectedSet.has('Diabetes') && thresholds.sugarHighMmol
          ? parseFloat(thresholds.sugarHighMmol)
          : undefined,
      heartRateHigh:
        selectedSet.has('Heart condition') && thresholds.heartRateHigh
          ? parseFloat(thresholds.heartRateHigh)
          : undefined,
      heartRateLow:
        selectedSet.has('Heart condition') && thresholds.heartRateLow
          ? parseFloat(thresholds.heartRateLow)
          : undefined,
      spo2LowThreshold:
        selectedSet.has('COPD/Respiratory') && thresholds.spo2LowThreshold
          ? parseFloat(thresholds.spo2LowThreshold)
          : undefined,
    };
    void onSubmit(payload);
  };

  // ─── Review phase ───────────────────────────────────────────────────────────

  if (phase === 'review') {
    return (
      <ScreenShell headerRight={headerRight}>
        <Pressable
          style={styles.editRow}
          onPress={() => setPhase('form')}
          accessibilityRole="button"
          accessibilityLabel={t('common.edit')}
          hitSlop={8}
        >
          <Text style={styles.editLabel}>{t('common.edit')}</Text>
          <Ionicons name="pencil-outline" size={14} color={Colors.textPrimary} />
        </Pressable>

        <FormCard>
          <ReviewRow label={t('onboarding.fullName')} value={fullName} />
          <ReviewRow
            label={t('onboarding.phone')}
            value={phone || t('onboarding.notProvided')}
          />
          <ReviewRow
            label={t('onboarding.dateOfBirth')}
            value={dateOfBirth ? formatDate(dateOfBirth) : t('onboarding.notProvided')}
          />
          <ReviewRow
            label={t('onboarding.language')}
            value={preferredLang === 'en' ? 'English' : 'Twi'}
          />

          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>{t('onboarding.conditions')}</Text>
            {conditions.length === 0 ? (
              <Text style={styles.reviewValue}>{t('onboarding.notProvided')}</Text>
            ) : (
              <View style={styles.chipRow}>
                {conditions.map((c) => (
                  <View key={c} style={styles.reviewChip}>
                    <Text style={styles.reviewChipText}>{c}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {activeThresholds.length > 0 && (
            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>{t('onboarding.thresholds')}</Text>
              {activeThresholds.map((item) => (
                <View key={item.field} style={styles.thresholdReviewRow}>
                  <Text style={styles.thresholdReviewLabel}>{item.label}</Text>
                  <Text style={styles.thresholdReviewValue}>
                    {getThresholdDisplay(item)} {item.unit}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <PrimaryButton
            label={t('common.submit')}
            loading={submitting}
            onPress={handleSubmit}
          />
        </FormCard>
      </ScreenShell>
    );
  }

  // ─── Form phase ─────────────────────────────────────────────────────────────

  return (
    <ScreenShell
      headerRight={headerRight}
      title={title}
      greeting={greeting}
      subtitle={subtitle}
    >
      <FormCard>
        <LabeledInput
          label={t('onboarding.fullName')}
          placeholder={t('onboarding.fullNamePlaceholder')}
          value={fullName}
          onChangeText={setFullName}
        />
        <PhoneInput
          label={t('onboarding.phone')}
          value={phone}
          onChangeText={setPhone}
        />
        <DateInput
          label={t('onboarding.dateOfBirth')}
          value={dateOfBirth}
          onChange={setDateOfBirth}
        />

        {/* Language preference */}
        <View style={styles.langWrap}>
          <Text style={styles.fieldLabel}>{t('onboarding.language')}</Text>
          <View style={styles.langRow}>
            {LANG_OPTIONS.map(({ key, label }) => (
              <Pressable
                key={key}
                style={[styles.langBtn, preferredLang === key && styles.langBtnActive]}
                onPress={() => setPreferredLang(key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: preferredLang === key }}
                accessibilityLabel={label}
              >
                <Text style={[styles.langText, preferredLang === key && styles.langTextActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <ConditionMultiSelect
          label={t('onboarding.conditions')}
          hint={t('onboarding.conditionsHint')}
          selected={conditions}
          onChange={setConditions}
        />

        {/* Inline threshold section — appears when relevant conditions are selected */}
        {activeThresholds.length > 0 && (
          <View style={styles.thresholdSection}>
            <Text style={styles.thresholdTitle}>{t('onboarding.thresholds')}</Text>
            <Text style={styles.thresholdHint}>{t('onboarding.thresholdsHint')}</Text>
            {activeThresholds.map((item) => (
              <View key={item.field} style={styles.thresholdField}>
                <Text style={styles.thresholdFieldLabel}>{item.label}</Text>
                <Text style={styles.thresholdFieldHint}>{item.hint}</Text>
                <View style={styles.thresholdInputRow}>
                  <TextInput
                    style={styles.thresholdInput}
                    value={thresholds[item.field] ?? `${item.defaultVal}`}
                    onChangeText={(v) => setThresholdValue(item.field, v)}
                    keyboardType="numeric"
                    placeholder={`${item.defaultVal}`}
                    placeholderTextColor={Colors.textMuted}
                    accessibilityLabel={item.label}
                    selectTextOnFocus
                  />
                  <View style={styles.unitBadge}>
                    <Text style={styles.unitText}>{item.unit}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <PrimaryButton
          label={t('common.review')}
          disabled={!formValid}
          onPress={() => setPhase('review')}
        />
      </FormCard>
    </ScreenShell>
  );
}

// ─── ReviewRow ────────────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    marginBottom: Spacing.md,
  },
  editLabel: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600' },

  // Language
  langWrap: { marginBottom: Spacing.lg },
  fieldLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  langRow: { flexDirection: 'row', gap: Spacing.sm },
  langBtn: {
    flex: 1,
    minHeight: MinTapTarget.neoSenior,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
  },
  langBtnActive: { borderColor: Brand.primary, backgroundColor: '#EEF5F6' },
  langText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.base, color: Colors.textMuted },
  langTextActive: { color: Brand.primary, fontFamily: Fonts.bodySemiBold },

  // Threshold section
  thresholdSection: {
    backgroundColor: Colors.goldLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  thresholdTitle: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  thresholdHint: {
    fontFamily: Fonts.body,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  thresholdField: { gap: Spacing.xs },
  thresholdFieldLabel: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  thresholdFieldHint: { fontFamily: Fonts.body, fontSize: FontSize.xs, color: Colors.textMuted },
  thresholdInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  thresholdInput: {
    flex: 1,
    minHeight: MinTapTarget.neoCare,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  unitBadge: {
    paddingHorizontal: Spacing.md,
    minHeight: MinTapTarget.neoCare,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
  },
  unitText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.sm, color: Colors.textMuted },

  // Review
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  reviewSection: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  reviewLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    flex: 1,
  },
  reviewValue: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  reviewChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: '#EEF5F6',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Brand.primary,
  },
  reviewChipText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.xs, color: Brand.primary },
  thresholdReviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  thresholdReviewLabel: { fontFamily: Fonts.body, fontSize: FontSize.xs, color: Colors.textMuted, flex: 1 },
  thresholdReviewValue: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.xs, color: Colors.textPrimary },
});
