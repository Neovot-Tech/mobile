import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import ElderlyProfileFlow from '../../components/ElderlyProfileFlow';
import { NeoCareAppStackParamList } from '../../navigation/types';
import { useCreatedSeniors } from '../../store/createdSeniors.store';
import { submitNeoSeniorProfile, NeoSeniorProfilePayload } from '../../services/onboarding.service';
import { getApiErrorMessage } from '../../services/http';

/** Post-onboarding "create a new NeoSenior" — reuses the onboarding profile form,
 *  then returns to the dashboard which shows the share-this-code card. */
export default function CreateSeniorScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const navigation = useNavigation<NativeStackNavigationProp<NeoCareAppStackParamList>>();
  const addCreated = useCreatedSeniors((s) => s.add);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: NeoSeniorProfilePayload) => {
    setSubmitting(true);
    try {
      const { neoSeniorId } = await submitNeoSeniorProfile(data);
      addCreated({ nsr: neoSeniorId, name: data.fullName });
      qc.invalidateQueries({ queryKey: ['linkedProfiles'] });
      navigation.popToTop(); // back to the dashboard
    } catch (err) {
      Alert.alert(t('common.error'), getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ElderlyProfileFlow
      title={t('neoCareOnboarding.step2Title')}
      subtitle={t('neoCareOnboarding.step2Subtitle')}
      onSubmit={handleSubmit}
      submitting={submitting}
    />
  );
}
