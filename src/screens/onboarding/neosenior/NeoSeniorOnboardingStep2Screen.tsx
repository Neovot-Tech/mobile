import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenShell from '../../../components/ScreenShell';
import FormCard from '../../../components/FormCard';
import StepDots from '../../../components/StepDots';
import PrimaryButton from '../../../components/PrimaryButton';
import { Colors, Fonts, FontSize, Spacing } from '../../../theme';
import { useOnboardingStore } from '../../../store/onboarding.store';
import { NeoSeniorOnboardingStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<NeoSeniorOnboardingStackParamList, 'NeoSeniorStep2'>;

interface Condition {
  id: string;
  label: string;
}

const CONDITIONS: Condition[] = [
  { id: 'Hypertension', label: 'Hypertension' },
  { id: 'Diabetes', label: 'Diabetes' },
  { id: 'Heart condition', label: 'Heart condition' },
  { id: 'COPD/Respiratory', label: 'COPD/Respiratory' },
  { id: 'Arthritis', label: 'Arthritis' },
  { id: 'Stroke', label: 'Stroke' },
  { id: 'Other', label: 'Other' },
];

export default function NeoSeniorOnboardingStep2Screen({ navigation }: Props) {
  const { t } = useTranslation();
  const { setNeoSeniorProfile } = useOnboardingStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleCondition = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const removeCondition = (id: string) =>
    setSelectedIds((prev) => prev.filter((c) => c !== id));

  const handleReview = () => {
    setNeoSeniorProfile({ conditions: selectedIds });
    navigation.navigate('NeoSeniorReview');
  };

  const selectedConditions = CONDITIONS.filter((c) => selectedIds.includes(c.id));

  return (
    <ScreenShell
        headerRight={<StepDots current={2} total={3} />}
        title={t('neoSeniorOnboarding.step2Title')}
        subtitle={t('neoSeniorOnboarding.step2Subtitle')}
        showTopographic
      >
        <FormCard>
          {/* ── Medical Conditions ─────────────────────────────────── */}
          <Text style={styles.sectionHeader}>
            {t('neoSeniorOnboarding.conditionsTitle')}
          </Text>
          <View style={styles.divider} />
          <View style={styles.chipsGrid}>
            {CONDITIONS.map((condition) => {
              const active = selectedIds.includes(condition.id);
              return (
                <Pressable
                  key={condition.id}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => toggleCondition(condition.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={condition.label}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {condition.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Selected Conditions ─────────────────────────────────── */}
          <View style={styles.selectedSection}>
            <Text style={styles.sectionHeader}>
              {t('neoSeniorOnboarding.selectedConditionsTitle')}
            </Text>
            <View style={styles.divider} />
            <View style={styles.tagsGrid}>
              {selectedConditions.length === 0 ? (
                <Text style={styles.emptyText}>
                  {t('neoSeniorOnboarding.noneSelected')}
                </Text>
              ) : (
                selectedConditions.map((c) => (
                  <View key={c.id} style={styles.activeTag}>
                    <Text style={styles.activeTagText}>{c.label}</Text>
                    <Pressable
                      style={styles.dismissBadge}
                      onPress={() => removeCondition(c.id)}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${c.label}`}
                    >
                      <Text style={styles.dismissIcon}>✕</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* ── Footer ─────────────────────────────────────────────── */}
          <View style={styles.footer}>
            <Pressable
              style={styles.prevButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel={t('common.previous')}
            >
              <Text style={styles.prevButtonText}>{t('common.previous')}</Text>
            </Pressable>
            <PrimaryButton
              label={t('common.review')}
              onPress={handleReview}
              style={styles.reviewButton}
            />
          </View>
        </FormCard>
      </ScreenShell>
  );
}

const PILL_BORDER = '#DCE4E6';

const styles = StyleSheet.create({
  sectionHeader: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F7EFE2',
    marginTop: Spacing.sm,
    marginBottom: Spacing.base,
  },

  // ── Available condition pills ──────────────────────────────────────────
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: PILL_BORDER,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  pillActive: {
    backgroundColor: '#EEF5F6',
    borderColor: Colors.primary,
  },
  pillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  pillTextActive: {
    fontFamily: Fonts.bodySemiBold,
  },

  // ── Selected tags ──────────────────────────────────────────────────────
  selectedSection: {
    marginTop: 32,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingLeft: 18,
    paddingRight: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  activeTagText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  dismissBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissIcon: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '700',
    lineHeight: 14,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },

  // ── Footer ────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    gap: 16,
  },
  prevButton: {
    flex: 1,
    height: 54,
    borderWidth: 1,
    borderColor: PILL_BORDER,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  prevButtonText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.primary,
  },
  reviewButton: {
    flex: 1,
    borderRadius: 12,
  },
});
