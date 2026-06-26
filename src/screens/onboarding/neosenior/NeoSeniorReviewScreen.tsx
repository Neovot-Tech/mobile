import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenShell from '../../../components/ScreenShell';
import FormCard from '../../../components/FormCard';
import StepDots from '../../../components/StepDots';
import PrimaryButton from '../../../components/PrimaryButton';
import BrandAlert from '../../../components/BrandAlert';
import { Colors, Fonts, FontSize, Spacing } from '../../../theme';
import { useOnboardingStore } from '../../../store/onboarding.store';
import { NeoSeniorOnboardingStackParamList } from '../../../navigation/types';
import { selfRegisterNeoSenior } from '../../../services/onboarding.service';
import { getApiErrorMessage } from '../../../services/http';
import type { PreferredLang } from '../../../services/types';

type Props = NativeStackScreenProps<NeoSeniorOnboardingStackParamList, 'NeoSeniorReview'>;

function formatDob(iso?: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d} - ${m} - ${y}`;
}

export default function NeoSeniorReviewScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { neoSeniorProfile, setGeneratedNeoSeniorId } = useOnboardingStore();

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const conditions = neoSeniorProfile.conditions ?? [];

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const { neoSeniorId } = await selfRegisterNeoSenior({
        fullName: neoSeniorProfile.fullName ?? '',
        phone: neoSeniorProfile.phone ?? '',
        dateOfBirth: neoSeniorProfile.dateOfBirth,
        conditions,
        preferredLang: (neoSeniorProfile.preferredLang as PreferredLang) ?? 'en',
      });
      setGeneratedNeoSeniorId(neoSeniorId);
      navigation.navigate('NeoSeniorIdReveal', { neoSeniorId });
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <BrandAlert
        visible={!!errorMsg}
        title={t('common.error')}
        message={errorMsg ?? ''}
        onDismiss={() => setErrorMsg(null)}
      />
      <ScreenShell
        headerRight={<StepDots current={2} total={3} />}
        title={t('neoSeniorOnboarding.reviewTitle')}
        subtitle={t('neoSeniorOnboarding.reviewSubtitle')}
        showTopographic
      >
        <FormCard>
          {/* ── Card header ─────────────────────────────────────────── */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderText}>
              {t('neoSeniorOnboarding.profileSummary')}
            </Text>
            <Pressable
              style={styles.editRow}
              onPress={() => navigation.navigate('NeoSeniorStep1')}
              accessibilityRole="button"
              accessibilityLabel={t('neoSeniorOnboarding.editDetails')}
              hitSlop={8}
            >
              <Text style={styles.editText}>
                {t('neoSeniorOnboarding.editDetails')}
              </Text>
              <Ionicons name="pencil-outline" size={14} color={Colors.primary} />
            </Pressable>
          </View>

          {/* ── Info rows ────────────────────────────────────────────── */}
          <InfoRow
            label={t('onboarding.fullName')}
            value={neoSeniorProfile.fullName ?? '—'}
          />
          <InfoRow
            label={t('neoCareOnboarding.phoneNumber')}
            value={neoSeniorProfile.phone || '—'}
          />
          <InfoRow
            label={t('neoCareOnboarding.residentialAddress')}
            value={neoSeniorProfile.address || '—'}
          />
          <InfoRow
            label={t('onboarding.dateOfBirth')}
            value={formatDob(neoSeniorProfile.dateOfBirth)}
            last
          />

          {/* ── Confirmed conditions ─────────────────────────────────── */}
          <View style={styles.conditionsSection}>
            <Text style={styles.conditionsLabel}>
              {t('neoSeniorOnboarding.confirmedConditions')}
            </Text>
            <View style={styles.tagsGrid}>
              {conditions.length === 0 ? (
                <Text style={styles.emptyText}>
                  {t('neoSeniorOnboarding.noneSelected')}
                </Text>
              ) : (
                conditions.map((c) => (
                  <View key={c} style={styles.conditionTag}>
                    <Text style={styles.conditionTagText}>{c}</Text>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* ── Submit ───────────────────────────────────────────────── */}
          <PrimaryButton
            label={t('neoSeniorOnboarding.confirmAndSave')}
            loading={submitting}
            onPress={() => void handleConfirm()}
            style={styles.submitButton}
          />
        </FormCard>
      </ScreenShell>
    </>
  );
}

// ─── InfoRow ─────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Text style={styles.infoLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={styles.infoValue}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ROW_BORDER = '#EFEBE4';

const styles = StyleSheet.create({
  // Card header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  cardHeaderText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.primary,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: ROW_BORDER,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
    flex: 1,
  },
  infoValue: {
    fontFamily: Fonts.body,
    fontSize: FontSize.base - 1,
    color: Colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },

  // Conditions
  conditionsSection: {
    marginTop: 24,
  },
  conditionsLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.base - 1,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 12,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  conditionTag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  conditionTagText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },

  // Submit button
  submitButton: {
    marginTop: 36,
    borderRadius: 12,
  },
});
