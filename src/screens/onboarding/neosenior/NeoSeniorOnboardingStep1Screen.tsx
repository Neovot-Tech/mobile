import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenShell from '../../../components/ScreenShell';
import FormCard from '../../../components/FormCard';
import LabeledInput from '../../../components/LabeledInput';
import PhoneInput from '../../../components/PhoneInput';
import DateInput from '../../../components/DateInput';
import PrimaryButton from '../../../components/PrimaryButton';
import StepDots from '../../../components/StepDots';
import { useOnboardingStore } from '../../../store/onboarding.store';
import { NeoSeniorOnboardingStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<NeoSeniorOnboardingStackParamList, 'NeoSeniorStep1'>;

export default function NeoSeniorOnboardingStep1Screen({ navigation }: Props) {
  const { t } = useTranslation();
  const { setNeoSeniorProfile } = useOnboardingStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const formValid = !!fullName.trim();

  const handleNext = () => {
    if (!formValid) return;
    setNeoSeniorProfile({
      fullName: fullName.trim(),
      phone,
      address,
      dateOfBirth: dateOfBirth || undefined,
    });
    navigation.navigate('NeoSeniorStep2');
  };

  return (
    <ScreenShell
      headerRight={<StepDots current={1} total={3} />}
      title={t('neoSeniorOnboarding.step1Title')}
      subtitle={t('neoSeniorOnboarding.step1Subtitle')}
      showTopographic
    >
      <FormCard>
        <LabeledInput
          label={t('neoCareOnboarding.elderlyFullName')}
          placeholder={t('neoCareOnboarding.elderlyNamePlaceholder')}
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          autoCorrect={false}
        />
        <PhoneInput
          label={t('neoCareOnboarding.phoneNumber')}
          value={phone}
          onChangeText={setPhone}
        />
        <LabeledInput
          label={t('neoCareOnboarding.residentialAddress')}
          placeholder={t('neoCareOnboarding.addressPlaceholder')}
          value={address}
          onChangeText={setAddress}
          autoCapitalize="words"
        />
        <DateInput
          label={t('onboarding.dateOfBirth')}
          value={dateOfBirth}
          onChange={setDateOfBirth}
        />
        <PrimaryButton
          label={t('common.next')}
          disabled={!formValid}
          onPress={handleNext}
        />
      </FormCard>
    </ScreenShell>
  );
}
