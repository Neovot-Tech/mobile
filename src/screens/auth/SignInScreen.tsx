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
import { loginNeoCare, requestSeniorOtp } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { getApiErrorMessage } from '../../services/http';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export default function SignInScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const { t } = useTranslation();
  const signIn = useAuthStore((s) => s.signIn);

  const isSenior = role === 'neo_senior';

  // NeoCare
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // NeoSenior
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNeoCareSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const { user, tokens } = await loginNeoCare(email.trim(), password);
      await signIn(user, tokens); // RootNavigator flips to the NeoCare tabs
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSeniorSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const ph = phone.trim();
      const { sessionInfo } = await requestSeniorOtp(ph);
      navigation.navigate('Otp', { phone: ph, sessionInfo, mode: 'signin' });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const neoCareDisabled = !email.trim() || !password;

  return (
    <ScreenShell
      showTopographic
      headerRight={<BackPill />}
      title={isSenior ? t('auth.neoSenior') : t('auth.neoCare')}
      subtitle={t('auth.signInSubtitle')}
    >
      <FormCard>
        {isSenior ? (
          <>
            <PhoneInput value={phone} onChangeText={setPhone} />
            <PrimaryButton
              label={t('auth.signIn')}
              disabled={!phone.trim()}
              loading={loading}
              onPress={handleSeniorSignIn}
            />
          </>
        ) : (
          <>
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
              autoComplete="password"
            />
            <PrimaryButton
              label={t('auth.signIn')}
              disabled={neoCareDisabled}
              loading={loading}
              onPress={handleNeoCareSignIn}
            />
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.alreadyHaveAccount')} </Text>
          <Pressable
            onPress={() => navigation.navigate('SignUp', { role })}
            accessibilityRole="link"
            hitSlop={8}
          >
            <Text style={styles.footerLink}>{t('auth.signUp')}</Text>
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
