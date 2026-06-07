import React from 'react';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenShell from '../../../components/ScreenShell';
import StepDots from '../../../components/StepDots';
import FormCard from '../../../components/FormCard';
import Greeting from '../../../components/Greeting';
import PairingCodeCard from '../../../components/PairingCodeCard';
import PrimaryButton from '../../../components/PrimaryButton';
import { NeoCareOnboardingStackParamList } from '../../../navigation/types';
import { useOnboardingStore } from '../../../store/onboarding.store';
import { useAuthStore } from '../../../store/auth.store';

type Props = NativeStackScreenProps<NeoCareOnboardingStackParamList, 'NeoCareProfileStep3'>;

export default function NeoCareProfileStep3Screen({ route }: Props) {
  const { neoSeniorId } = route.params;
  const { t } = useTranslation();
  const { neoCareProfile, neoSeniorProfile, reset } = useOnboardingStore();
  const { setUser, setToken } = useAuthStore();

  const careFirstName = (neoCareProfile.fullName ?? '').split(' ')[0] || '';
  const seniorName = neoSeniorProfile.fullName ?? '';

  const handleComplete = () => {
    // STUB auth — replace with real registration result when backend is ready
    setToken('mock-token');
    setUser({
      id: 'mock-neocare-001',
      role: 'neo_care',
      phone: '',
      displayName: neoCareProfile.fullName ?? '',
      linkedNeoSeniorId: neoSeniorId,
      language: 'en',
    });
    reset(); // RootNavigator flips to the NeoCare tabs
  };

  return (
    <ScreenShell
      headerRight={<StepDots current={3} total={3} />}
      title={t('neoCareOnboarding.step3Title')}
      greeting={
        careFirstName ? (
          <Greeting prefix={t('neoCareOnboarding.step3Hello')} name={careFirstName} />
        ) : undefined
      }
      subtitle={t('neoCareOnboarding.step3Subtitle')}
    >
      <FormCard>
        <PairingCodeCard name={seniorName} neoSeniorId={neoSeniorId} />
        <PrimaryButton label={t('common.complete')} onPress={handleComplete} />
      </FormCard>
    </ScreenShell>
  );
}
