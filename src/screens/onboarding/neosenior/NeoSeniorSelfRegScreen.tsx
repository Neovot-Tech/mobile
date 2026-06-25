import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ElderlyProfileFlow from '../../../components/ElderlyProfileFlow';
import BrandAlert from '../../../components/BrandAlert';
import { NeoSeniorOnboardingStackParamList } from '../../../navigation/types';
import { useOnboardingStore } from '../../../store/onboarding.store';
import {
  selfRegisterNeoSenior,
  NeoSeniorProfilePayload,
} from '../../../services/onboarding.service';
import { getApiErrorMessage } from '../../../services/http';

type Props = NativeStackScreenProps<NeoSeniorOnboardingStackParamList, 'NeoSeniorSelfReg'>;

export default function NeoSeniorSelfRegScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { setNeoSeniorProfile, setGeneratedNeoSeniorId } = useOnboardingStore();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (data: NeoSeniorProfilePayload) => {
    setSubmitting(true);
    try {
      setNeoSeniorProfile(data);
      const { neoSeniorId } = await selfRegisterNeoSenior(data);
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
      <ElderlyProfileFlow
      title={t('neoSeniorOnboarding.step2Title')}
      subtitle={t('neoSeniorOnboarding.step2Subtitle')}
      onSubmit={handleSubmit}
      submitting={submitting}
    />
    </>
  );
}
