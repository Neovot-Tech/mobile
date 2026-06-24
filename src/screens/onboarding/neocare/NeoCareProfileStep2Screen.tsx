import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ElderlyProfileFlow from '../../../components/ElderlyProfileFlow';
import BrandAlert from '../../../components/BrandAlert';
import Greeting from '../../../components/Greeting';
import { NeoCareOnboardingStackParamList } from '../../../navigation/types';
import { useOnboardingStore } from '../../../store/onboarding.store';
import { useAuthStore } from '../../../store/auth.store';
import { useCreatedSeniors } from '../../../store/createdSeniors.store';
import {
  submitNeoSeniorProfile,
  NeoSeniorProfilePayload,
} from '../../../services/onboarding.service';
import { getApiErrorMessage } from '../../../services/http';

type Props = NativeStackScreenProps<NeoCareOnboardingStackParamList, 'NeoCareProfileStep2'>;

export default function NeoCareProfileStep2Screen({ navigation }: Props) {
  void navigation;
  const { t } = useTranslation();
  const setNeoSeniorProfile = useOnboardingStore((s) => s.setNeoSeniorProfile);
  const addCreated = useCreatedSeniors((s) => s.add);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const careFirstName = useAuthStore((s) => (s.user?.displayName ?? '').split(' ')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (data: NeoSeniorProfilePayload) => {
    setSubmitting(true);
    try {
      setNeoSeniorProfile(data);
      const { neoSeniorId } = await submitNeoSeniorProfile(data);
      addCreated({ nsr: neoSeniorId, name: data.fullName });
      completeOnboarding();
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
    />
    </>
  );
}
