import React, { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenShell from '../../../components/ScreenShell';
import FormCard from '../../../components/FormCard';
import StepDots from '../../../components/StepDots';
import PrimaryButton from '../../../components/PrimaryButton';
import { Colors, Fonts, FontSize, Spacing } from '../../../theme';
import { useOnboardingStore } from '../../../store/onboarding.store';
import { useAuthStore } from '../../../store/auth.store';
import { NeoSeniorOnboardingStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<NeoSeniorOnboardingStackParamList, 'NeoSeniorIdReveal'>;

export default function NeoSeniorIdRevealScreen({ route }: Props) {
  const { neoSeniorId } = route.params;
  const { t } = useTranslation();
  const { neoSeniorProfile, reset } = useOnboardingStore();
  const { user, setUser, completeOnboarding } = useAuthStore();

  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Strip the "NSR-" prefix — users see and share only the suffix
  const displayCode = neoSeniorId.replace(/^NSR-/, '');
  const seniorName = neoSeniorProfile.fullName ?? '';

  const handleCopy = async () => {
    await Clipboard.setStringAsync(neoSeniorId);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    setCopied(true);
    copyTimer.current = setTimeout(() => setCopied(false), 1500);
  };

  const handleComplete = () => {
    if (user) {
      setUser({
        ...user,
        neoSeniorId,
        displayName: seniorName || user.displayName,
        phone: neoSeniorProfile.phone ?? user.phone,
      });
    }
    completeOnboarding();
    reset();
  };

  return (
    <ScreenShell
      headerRight={<StepDots current={3} total={3} />}
      title={t('neoSeniorOnboarding.step3Title')}
      subtitle={t('neoSeniorOnboarding.step3Subtitle')}
      showTopographic
    >
      <FormCard>
        {/* ── Dashed security token box ────────────────────────────── */}
        <View style={styles.dashedBox}>
          <View style={styles.codeHeader}>
            <Text style={styles.ownerName} numberOfLines={1} ellipsizeMode="tail">
              {seniorName}
            </Text>
            <Pressable
              style={styles.copyRow}
              onPress={() => void handleCopy()}
              accessibilityRole="button"
              accessibilityLabel={t('common.copy')}
              hitSlop={8}
            >
              <Text style={styles.copyLabel}>
                {copied ? t('neoSeniorOnboarding.copied') : t('common.copy')}
              </Text>
              <Ionicons name="copy-outline" size={14} color={Colors.primary} />
            </Pressable>
          </View>

          <View style={styles.charRow}>
            {displayCode.split('').map((char, i) => (
              <View key={i} style={styles.charBox}>
                <Text style={styles.charText}>{char}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Complete ─────────────────────────────────────────────── */}
        <PrimaryButton
          label={t('common.complete')}
          onPress={handleComplete}
          style={styles.completeButton}
        />
      </FormCard>
    </ScreenShell>
  );
}

const CHAR_BORDER = '#DCE4E6';
const DASHED_BORDER = '#FFE6D5';

const styles = StyleSheet.create({
  dashedBox: {
    borderWidth: 1,
    borderColor: DASHED_BORDER,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: Spacing.base,
    marginBottom: 24,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  ownerName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.base - 1,
    fontWeight: '600',
    color: Colors.primary,
    flex: 1,
    marginRight: Spacing.md,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.primary,
  },
  charRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  charBox: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: CHAR_BORDER,
    borderRadius: 10,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  completeButton: {
    borderRadius: 12,
  },
});
