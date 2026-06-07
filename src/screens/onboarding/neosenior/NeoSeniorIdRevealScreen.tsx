import React from 'react';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenShell from '../../../components/ScreenShell';
import StepDots from '../../../components/StepDots';
import FormCard from '../../../components/FormCard';
import PairingCodeCard from '../../../components/PairingCodeCard';
import PrimaryButton from '../../../components/PrimaryButton';
import { NeoSeniorOnboardingStackParamList } from '../../../navigation/types';
import { useOnboardingStore } from '../../../store/onboarding.store';
import { useAuthStore } from '../../../store/auth.store';

type Props = NativeStackScreenProps<NeoSeniorOnboardingStackParamList, 'NeoSeniorIdReveal'>;

export default function NeoSeniorIdRevealScreen({ route }: Props) {
  const { neoSeniorId } = route.params;
  const { t } = useTranslation();
  const { neoSeniorProfile, reset } = useOnboardingStore();
  const { setUser, setToken } = useAuthStore();

  const seniorName = neoSeniorProfile.fullName ?? '';

  const handleComplete = () => {
    // STUB auth — replace with real registration result when backend is ready
    // TODO Phase 2: route through BiometricSetup before landing home (design missing)
    setToken('mock-senior-token');
    setUser({
      id: 'mock-senior-001',
      role: 'neo_senior',
      phone: neoSeniorProfile.phone ?? '',
      displayName: seniorName,
      neoSeniorId,
      language: 'en',
    });
    reset(); // RootNavigator flips to the NeoSenior tabs
  };

  return (
    <ScreenShell
      headerRight={<StepDots current={3} total={3} />}
      title={t('neoCareOnboarding.step3Title')}
      subtitle={t('neoCareOnboarding.step3SubtitleAlt')}
    >
      <FormCard>
        <PairingCodeCard name={seniorName} neoSeniorId={neoSeniorId} />
        <PrimaryButton label={t('common.complete')} onPress={handleComplete} />
      </FormCard>
    </ScreenShell>
  );
}
