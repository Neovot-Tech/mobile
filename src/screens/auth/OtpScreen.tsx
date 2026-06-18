import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenShell from '../../components/ScreenShell';
import BackPill from '../../components/BackPill';
import FormCard from '../../components/FormCard';
import LabeledDivider from '../../components/LabeledDivider';
import PhoneInput from '../../components/PhoneInput';
import OtpInput from '../../components/OtpInput';
import PrimaryButton from '../../components/PrimaryButton';
import { AuthStackParamList } from '../../navigation/types';
import { Colors, FontSize, Spacing } from '../../theme';
import { verifySeniorOtp } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { getApiErrorMessage } from '../../services/http';

type Props = NativeStackScreenProps<AuthStackParamList, 'Otp'>;

const OTP_LENGTH = 6;

export default function OtpScreen({ route }: Props) {
  const { phone: initialPhone, sessionInfo } = route.params;
  const { t } = useTranslation();
  const { signIn, beginOnboarding } = useAuthStore();

  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      const { user, tokens, onboarding } = await verifySeniorOtp({
        sessionInfo,
        code: otp,
        phone,
      });
      // Route by the senior's actual backend state, not which button they tapped:
      // already activated + linked → app; otherwise the right onboarding step.
      if (onboarding === 'ready') {
        await signIn(user, tokens);
      } else {
        await beginOnboarding(user, tokens, onboarding);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell
      showTopographic
      headerRight={<BackPill />}
      title={t('auth.neoSenior')}
      subtitle={t('auth.neoSeniorSignUpSubtitle')}
    >
      <FormCard>
        <PhoneInput value={phone} onChangeText={setPhone} />
        <LabeledDivider label={t('auth.enterOtp')} />
        <OtpInput length={OTP_LENGTH} value={otp} onChange={setOtp} />
        <PrimaryButton
          label={t('auth.verifyOtp')}
          disabled={otp.length < OTP_LENGTH}
          loading={loading}
          onPress={handleVerify}
          style={{ marginTop: Spacing.xl }}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </FormCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  error: {
    color: Colors.error,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: Spacing.base,
  },
});
