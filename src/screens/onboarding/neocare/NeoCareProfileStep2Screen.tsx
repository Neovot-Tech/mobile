import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ElderlyProfileFlow from '../../../components/ElderlyProfileFlow';
import Greeting from '../../../components/Greeting';
import StepDots from '../../../components/StepDots';
import { NeoCareOnboardingStackParamList } from '../../../navigation/types';
import { useOnboardingStore } from '../../../store/onboarding.store';
import {
  submitNeoSeniorProfile,
  NeoSeniorProfilePayload,
} from '../../../services/onboarding.service';

type Props = NativeStackScreenProps<NeoCareOnboardingStackParamList, 'NeoCareProfileStep2'>;

export default function NeoCareProfileStep2Screen({ navigation }: Props) {
  const { t } = useTranslation();
  const { neoCareProfile, setNeoSeniorProfile, setGeneratedNeoSeniorId } =
    useOnboardingStore();
  const [submitting, setSubmitting] = useState(false);

  const careFirstName = (neoCareProfile.fullName ?? '').split(' ')[0] || '';

  const handleSubmit = async (data: NeoSeniorProfilePayload) => {
    setSubmitting(true);
    try {
      setNeoSeniorProfile(data);
      const { neoSeniorId } = await submitNeoSeniorProfile(data);
      setGeneratedNeoSeniorId(neoSeniorId);
      navigation.navigate('NeoCareProfileStep3', { neoSeniorId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ElderlyProfileFlow
      title={t('neoCareOnboarding.step2Title')}
      greeting={
        careFirstName ? (
          <Greeting prefix={t('neoCareOnboarding.step2Hello')} name={careFirstName} />
        ) : undefined
      }
      subtitle={t('neoCareOnboarding.step2Subtitle')}
      onSubmit={handleSubmit}
      submitting={submitting}
      headerRight={<StepDots current={2} total={3} />}
    />
  );
}
