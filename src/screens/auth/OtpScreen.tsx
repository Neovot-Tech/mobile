import React, { useState } from 'react';
import { Platform, Text, StyleSheet } from 'react-native';
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
import { verifyOtp } from '../../services/auth.service';
import { verifySeniorOtpWeb } from '../../services/seniorWebAuth';
import { useAuthStore } from '../../store/auth.store';
import { getApiErrorMessage } from '../../services/http';

type Props = NativeStackScreenProps<AuthStackParamList, 'Otp'>;

const OTP_LENGTH = 6;

export default function OtpScreen({ route }: Props) {
  const { phone: initialPhone, sessionInfo, role } = route.params;
  const { t } = useTranslation();
  const { signIn, beginOnboarding } = useAuthStore();

  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSenior = role === 'neo_senior';

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      if (Platform.OS === 'web') {
        const result = await verifySeniorOtpWeb(otp, role);
        const { user, tokens } = result;
        if (result.user.role === 'neo_senior') {
          const step = result.seniorOnboarding!;
          if (step === 'ready') {
            await signIn(user, tokens);
          } else {
            await beginOnboarding(user, tokens, step);
          }
        } else {
          if (result.created) {
            await beginOnboarding(user, tokens);
          } else {
            await signIn(user, tokens);
          }
        }
        return;
      }

      const result = await verifyOtp({
        sessionInfo: sessionInfo!,
        code: otp,
        role,
        phone,
      });
      const { user, tokens } = result;

      // Always route on the server-confirmed role, never the client-supplied one.
      // This handles: existing user signing up again, and wrong-role selection.
      if (result.user.role === 'neo_senior') {
        const onboarding = result.seniorOnboarding!;
        if (onboarding === 'ready') {
          await signIn(user, tokens);
        } else {
          await beginOnboarding(user, tokens, onboarding);
        }
      } else {
        // NeoCare: new accounts go through onboarding; returning users go straight to app.
        if (result.created) {
          await beginOnboarding(user, tokens);
        } else {
          await signIn(user, tokens);
        }
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
      title={isSenior ? t('auth.neoSenior') : t('auth.neoCare')}
      subtitle={isSenior ? t('auth.neoSeniorSignUpSubtitle') : t('auth.signInSubtitle')}
    >
      <FormCard>
        <PhoneInput value={phone} onChangeText={setPhone} readOnly />
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
