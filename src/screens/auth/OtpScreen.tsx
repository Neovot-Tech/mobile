import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import {
  NativeStackScreenProps,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import ScreenShell from '../../components/ScreenShell';
import BackPill from '../../components/BackPill';
import FormCard from '../../components/FormCard';
import LabeledDivider from '../../components/LabeledDivider';
import PhoneInput from '../../components/PhoneInput';
import OtpInput from '../../components/OtpInput';
import PrimaryButton from '../../components/PrimaryButton';
import { AuthStackParamList, RootStackParamList } from '../../navigation/types';
import { Spacing } from '../../theme';
import { verifyOtp, neoSeniorVerifyOtp } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { MOCK_FLOW, MockValues } from '../../config/mockFlow';

type Props = NativeStackScreenProps<AuthStackParamList, 'Otp'>;

const OTP_LENGTH = 4;

export default function OtpScreen({ route }: Props) {
  const { phone: initialPhone, role, mode } = route.params;
  const { t } = useTranslation();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setUser, setToken } = useAuthStore();

  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const isSenior = role === 'neo_senior';

  const handleVerify = async () => {
    setLoading(true);
    try {
      const code = otp || MockValues.otp;
      if (mode === 'signin') {
        const { token, user } = isSenior
          ? await neoSeniorVerifyOtp(phone, code)
          : await verifyOtp(phone, code);
        setToken(token);
        setUser(user); // RootNavigator flips to the role's tab navigator
      } else if (isSenior) {
        rootNav.navigate('NeoSeniorOnboarding', { screen: 'NeoSeniorSelfReg' });
      } else {
        rootNav.navigate('NeoCareOnboarding', { screen: 'NeoCareProfileStep1' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell
      showTopographic
      headerRight={<BackPill />}
      title={isSenior ? t('auth.neoSenior') : t('auth.neoCare')}
      subtitle={isSenior ? t('auth.neoSeniorSignUpSubtitle') : t('auth.signUpSubtitle')}
    >
      <FormCard>
        <PhoneInput value={phone} onChangeText={setPhone} />
        <LabeledDivider label={t('auth.enterOtp')} />
        <OtpInput length={OTP_LENGTH} value={otp} onChange={setOtp} />
        <PrimaryButton
          label={t('auth.verifyOtp')}
          disabled={!MOCK_FLOW && otp.length < OTP_LENGTH}
          loading={loading}
          onPress={handleVerify}
          style={{ marginTop: Spacing.xl }}
        />
      </FormCard>
    </ScreenShell>
  );
}
