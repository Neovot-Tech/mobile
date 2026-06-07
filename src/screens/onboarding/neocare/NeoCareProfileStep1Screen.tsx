import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenShell from '../../../components/ScreenShell';
import StepDots from '../../../components/StepDots';
import FormCard from '../../../components/FormCard';
import LabeledInput from '../../../components/LabeledInput';
import Select from '../../../components/Select';
import PrimaryButton from '../../../components/PrimaryButton';
import { NeoCareOnboardingStackParamList } from '../../../navigation/types';
import { useOnboardingStore } from '../../../store/onboarding.store';
import { submitNeoCareProfile } from '../../../services/onboarding.service';
import { MOCK_FLOW, MockValues } from '../../../config/mockFlow';

type Props = NativeStackScreenProps<NeoCareOnboardingStackParamList, 'NeoCareProfileStep1'>;

// TODO: Twi — option strings also need locale entries when the dropdown copy is finalised
const LIVE_WITH_OPTIONS = [
  'No i come assist and leave',
  'Yes we live together',
  'Sometimes / part-time',
];

export default function NeoCareProfileStep1Screen({ navigation }: Props) {
  const { t } = useTranslation();
  const { setNeoCareProfile } = useOnboardingStore();

  const [fullName, setFullName] = useState('');
  const [livesWith, setLivesWith] = useState(LIVE_WITH_OPTIONS[0]);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const profile = {
        fullName: fullName.trim() || MockValues.neoCareName,
        livesWithElderly: livesWith,
        address: address.trim() || MockValues.address,
      };
      setNeoCareProfile(profile);
      await submitNeoCareProfile(profile);
      navigation.navigate('NeoCareProfileStep2');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell
      headerRight={<StepDots current={1} total={3} />}
      title={t('neoCareOnboarding.step1Title')}
      subtitle={t('neoCareOnboarding.step1Subtitle')}
    >
      <FormCard>
        <LabeledInput
          label={t('neoCareOnboarding.fullName')}
          placeholder={t('neoCareOnboarding.fullNamePlaceholder')}
          value={fullName}
          onChangeText={setFullName}
        />
        <Select
          label={t('neoCareOnboarding.liveWithElderly')}
          value={livesWith}
          options={LIVE_WITH_OPTIONS}
          onChange={setLivesWith}
        />
        <LabeledInput
          label={t('neoCareOnboarding.yourAddress')}
          placeholder={t('neoCareOnboarding.addressPlaceholder')}
          value={address}
          onChangeText={setAddress}
        />
        <PrimaryButton
          label={t('common.submit')}
          disabled={!MOCK_FLOW && (!fullName.trim() || !address.trim())}
          loading={loading}
          onPress={handleSubmit}
        />
      </FormCard>
    </ScreenShell>
  );
}
