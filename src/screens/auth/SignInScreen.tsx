import React, { useState } from 'react';
import { Platform, View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenShell from '../../components/ScreenShell';
import BackPill from '../../components/BackPill';
import FormCard from '../../components/FormCard';
import GoogleButton from '../../components/GoogleButton';
import LabeledDivider from '../../components/LabeledDivider';
import PhoneInput from '../../components/PhoneInput';
import PrimaryButton from '../../components/PrimaryButton';
import { AuthStackParamList } from '../../navigation/types';
import { Colors, FontSize, Spacing } from '../../theme';
import { requestOtp } from '../../services/auth.service';
import { requestSeniorOtpWeb } from '../../services/seniorWebAuth';
import { getApiErrorMessage } from '../../services/http';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export default function SignInScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const { t } = useTranslation();

  const isSenior = role === 'neo_senior';

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { googleLoading, googleError, clearGoogleError, promptGoogleSignIn } = useGoogleAuth(role);

  const displayError = error ?? googleError;

  const handlePhoneSubmit = async () => {
    clearGoogleError();
    setLoading(true);
    setError(null);
    try {
      const ph = phone.trim();
      if (Platform.OS === 'web') {
        await requestSeniorOtpWeb(ph);
        navigation.navigate('Otp', { phone: ph, role });
      } else {
        const { sessionInfo } = await requestOtp(ph);
        navigation.navigate('Otp', { phone: ph, sessionInfo, role });
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
      subtitle={t('auth.signInSubtitle')}
    >
      <FormCard>
        <GoogleButton
          label={t('auth.continueWithGoogle')}
          loading={googleLoading}
          onPress={promptGoogleSignIn}
        />
        <LabeledDivider label={t('auth.orSignInWith')} />

        <PhoneInput value={phone} onChangeText={setPhone} />
        <PrimaryButton
          label={t('auth.signIn')}
          disabled={!phone.trim()}
          loading={loading}
          onPress={handlePhoneSubmit}
        />

        {displayError ? <Text style={styles.error}>{displayError}</Text> : null}

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.dontHaveAccount')} </Text>
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
