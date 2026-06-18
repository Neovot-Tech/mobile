import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenShell from '../../components/ScreenShell';
import BackPill from '../../components/BackPill';
import FormCard from '../../components/FormCard';
import LabeledInput from '../../components/LabeledInput';
import PhoneInput from '../../components/PhoneInput';
import PrimaryButton from '../../components/PrimaryButton';
import { AuthStackParamList } from '../../navigation/types';
import { Colors, FontSize, Spacing } from '../../theme';
import {
  registerNeoCare,
  loginNeoCare,
  requestSeniorOtp,
} from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { getApiErrorMessage } from '../../services/http';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const { t } = useTranslation();
  const beginOnboarding = useAuthStore((s) => s.beginOnboarding);

  const isSenior = role === 'neo_senior';

  // NeoCare fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // NeoSenior field
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNeoCareSignUp = async () => {
    setLoading(true);
    setError(null);
    try {
      const e = email.trim();
      const name = fullName.trim();
      await registerNeoCare(e, password, name);
      // Sign in to obtain tokens, then route through onboarding (create the
      // elderly profile) before the dashboard appears.
      const { user, tokens } = await loginNeoCare(e, password);
      await beginOnboarding(user, tokens);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSeniorSignUp = async () => {
    setLoading(true);
    setError(null);
    try {
      const ph = phone.trim();
      const { sessionInfo } = await requestSeniorOtp(ph);
      navigation.navigate('Otp', { phone: ph, sessionInfo, mode: 'signup' });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const neoCareDisabled = !fullName.trim() || !email.trim() || !password;

  return (
    <ScreenShell
      showTopographic
      headerRight={<BackPill />}
      title={isSenior ? t('auth.neoSenior') : t('auth.neoCare')}
      subtitle={isSenior ? t('auth.neoSeniorSignUpSubtitle') : t('auth.signUpSubtitle')}
    >
      <FormCard>
        {isSenior ? (
          <>
            <PhoneInput value={phone} onChangeText={setPhone} />
            <PrimaryButton
              label={t('auth.signUp')}
              disabled={!phone.trim()}
              loading={loading}
              onPress={handleSeniorSignUp}
            />
          </>
        ) : (
          <>
            <LabeledInput
              label={t('auth.fullName')}
              placeholder={t('auth.fullNamePlaceholder')}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
            <LabeledInput
              label={t('auth.email')}
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <LabeledInput
              label={t('auth.password')}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password-new"
            />
            <PrimaryButton
              label={t('auth.signUp')}
              disabled={neoCareDisabled}
              loading={loading}
              onPress={handleNeoCareSignUp}
            />
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.dontHaveAccount')} </Text>
          <Pressable
            onPress={() => navigation.navigate('SignIn', { role })}
            accessibilityRole="link"
            hitSlop={8}
          >
            <Text style={styles.footerLink}>{t('auth.signIn')}</Text>
          </Pressable>
        </View>
      </FormCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  error: {
    color: Colors.error,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  footerText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
  footerLink: {
    color: '#FF0000',
    fontSize: FontSize.sm,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
