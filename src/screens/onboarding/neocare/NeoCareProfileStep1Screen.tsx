import React from 'react';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenShell from '../../../components/ScreenShell';
import LinkOrCreateChoice from '../../../components/LinkOrCreateChoice';
import { NeoCareOnboardingStackParamList } from '../../../navigation/types';
import { useAuthStore } from '../../../store/auth.store';

type Props = NativeStackScreenProps<NeoCareOnboardingStackParamList, 'NeoCareProfileStep1'>;

/**
 * NeoCare onboarding entry: link an existing NeoSenior by ID, or create a new
 * profile. (Replaces the old redundant "your name / live-with / address" step —
 * none of which the backend stores.)
 */
export default function NeoCareProfileStep1Screen({ navigation }: Props) {
  const { t } = useTranslation();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  return (
    <ScreenShell
      showTopographic
      title={t('neoCareLink.title')}
      subtitle={t('neoCareLink.subtitle')}
    >
      <LinkOrCreateChoice
        onLinked={completeOnboarding}
        onCreateNew={() => navigation.navigate('NeoCareProfileStep2')}
      />
    </ScreenShell>
  );
}
