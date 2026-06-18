import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenShell from '../../../components/ScreenShell';
import StepDots from '../../../components/StepDots';
import FormCard from '../../../components/FormCard';
import PairingCodeCard from '../../../components/PairingCodeCard';
import PrimaryButton from '../../../components/PrimaryButton';
import CompleteProfilePrompt from '../../../components/CompleteProfilePrompt';
import { NeoSeniorOnboardingStackParamList } from '../../../navigation/types';
import { useOnboardingStore } from '../../../store/onboarding.store';
import { useAuthStore } from '../../../store/auth.store';

type Props = NativeStackScreenProps<NeoSeniorOnboardingStackParamList, 'NeoSeniorIdReveal'>;

export default function NeoSeniorIdRevealScreen({ route }: Props) {
  const { neoSeniorId } = route.params;
  const { t } = useTranslation();
  const { neoSeniorProfile, reset } = useOnboardingStore();
  const { user, setUser, completeOnboarding } = useAuthStore();

  const seniorName = neoSeniorProfile.fullName ?? '';
  const [showPrompt, setShowPrompt] = useState(false);

  const handleDismissPrompt = () => {
    setShowPrompt(false);
    // Already authenticated from OTP verify; attach the freshly-issued NSR code.
    // TODO Phase 4: route through BiometricSetup before landing home.
    if (user) {
      setUser({
        ...user,
        neoSeniorId,
        displayName: seniorName || user.displayName,
        phone: neoSeniorProfile.phone ?? user.phone,
      });
    }
    completeOnboarding(); // RootNavigator flips to the NeoSenior tabs
    reset();
  };

  return (
    <ScreenShell
      headerRight={<StepDots current={3} total={3} />}
      title={t('neoCareOnboarding.step3Title')}
      subtitle={t('neoCareOnboarding.step3SubtitleAlt')}
    >
      <FormCard>
        <PairingCodeCard name={seniorName} neoSeniorId={neoSeniorId} />
        <PrimaryButton label={t('common.complete')} onPress={() => setShowPrompt(true)} />
      </FormCard>

      <CompleteProfilePrompt visible={showPrompt} onDismiss={handleDismissPrompt} />
    </ScreenShell>
  );
}
