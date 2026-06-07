import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
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
import { MOCK_FLOW, MockValues } from '../../config/mockFlow';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export default function SignInScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');

  const isSenior = role === 'neo_senior';

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
          onPress={() => {
            // TODO Phase 5: Google auth — for now go straight to OTP with mock phone
            navigation.navigate('Otp', { phone: phone.trim() || MockValues.phone, role, mode: 'signin' });
          }}
        />
        <LabeledDivider label={t('auth.orSignInWith')} />
        <PhoneInput value={phone} onChangeText={setPhone} />
        <PrimaryButton
          label={t('auth.signIn')}
          disabled={!MOCK_FLOW && !phone.trim()}
          onPress={() =>
            navigation.navigate('Otp', { phone: phone.trim() || MockValues.phone, role, mode: 'signin' })
          }
        />
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
