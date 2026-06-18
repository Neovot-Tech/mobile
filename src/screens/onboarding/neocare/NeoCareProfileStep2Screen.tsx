import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ElderlyProfileFlow from '../../../components/ElderlyProfileFlow';
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

  const handleSubmit = async (data: NeoSeniorProfilePayload) => {
    setSubmitting(true);
    try {
      setNeoSeniorProfile(data);
      const { neoSeniorId } = await submitNeoSeniorProfile(data);
      // Remember the code locally so the dashboard can show "share this code"
      // until the senior activates (no backend endpoint lists created profiles).
      addCreated({ nsr: neoSeniorId, name: data.fullName });
      completeOnboarding(); // → NeoCare dashboard
    } catch (err) {
      Alert.alert(t('common.error'), getApiErrorMessage(err));
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
    />
  );
}
