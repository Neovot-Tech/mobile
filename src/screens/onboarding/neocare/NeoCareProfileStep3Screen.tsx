import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenShell from '../../../components/ScreenShell';
import StepDots from '../../../components/StepDots';
import FormCard from '../../../components/FormCard';
import Greeting from '../../../components/Greeting';
import PairingCodeCard from '../../../components/PairingCodeCard';
import PrimaryButton from '../../../components/PrimaryButton';
import CompleteProfilePrompt from '../../../components/CompleteProfilePrompt';
import { NeoCareOnboardingStackParamList } from '../../../navigation/types';
import { useOnboardingStore } from '../../../store/onboarding.store';
import { useAuthStore } from '../../../store/auth.store';

type Props = NativeStackScreenProps<NeoCareOnboardingStackParamList, 'NeoCareProfileStep3'>;

export default function NeoCareProfileStep3Screen({ route }: Props) {
  const { neoSeniorId } = route.params;
  const { t } = useTranslation();
  const { neoCareProfile, neoSeniorProfile, reset } = useOnboardingStore();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  const [showPrompt, setShowPrompt] = useState(false);

  const careFirstName = (neoCareProfile.fullName ?? '').split(' ')[0] || '';
  const seniorName = neoSeniorProfile.fullName ?? '';

  const handleDismissPrompt = () => {
    setShowPrompt(false);
    completeOnboarding(); // RootNavigator flips to the NeoCare tabs
    reset();
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
        <PrimaryButton label={t('common.complete')} onPress={() => setShowPrompt(true)} />
      </FormCard>

      <CompleteProfilePrompt visible={showPrompt} onDismiss={handleDismissPrompt} />
    </ScreenShell>
  );
}
