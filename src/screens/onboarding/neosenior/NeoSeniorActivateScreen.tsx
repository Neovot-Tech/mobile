import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenShell from '../../../components/ScreenShell';
import FormCard from '../../../components/FormCard';
import LabeledInput from '../../../components/LabeledInput';
import PrimaryButton from '../../../components/PrimaryButton';
import CompleteProfilePrompt from '../../../components/CompleteProfilePrompt';
import { NeoSeniorOnboardingStackParamList } from '../../../navigation/types';
import { activateProfile } from '../../../services/onboarding.service';
import { getApiErrorMessage } from '../../../services/http';
import { useAuthStore } from '../../../store/auth.store';
import { Colors, FontSize, Spacing } from '../../../theme';

type Props = NativeStackScreenProps<NeoSeniorOnboardingStackParamList, 'NeoSeniorActivate'>;

/** Normalise free input into the NSR-XXXXX shape. */
function normaliseId(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/\s+/g, '');
  const body = cleaned.replace(/^NSR-?/, '');
  return body ? `NSR-${body}` : '';
}

export default function NeoSeniorActivateScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { user, setUser, completeOnboarding } = useAuthStore();

  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [pendingNsr, setPendingNsr] = useState('');

  const handleActivate = async () => {
    const nsr = normaliseId(id);
    setLoading(true);
    setError(null);
    try {
      await activateProfile(nsr);
      if (user) setUser({ ...user, neoSeniorId: nsr });
      setPendingNsr(nsr);
      setShowPrompt(true);
    } catch (err) {
      const msg = getApiErrorMessage(err, '');
      // Already activated/linked → the senior is set up; just enter the app
      // rather than dead-ending on this screen.
      if (/already|activated|linked/i.test(msg)) {
        if (user) setUser({ ...user, neoSeniorId: nsr });
        setPendingNsr(nsr);
        setShowPrompt(true);
      } else {
        setError(msg || t('neoSeniorOnboarding.invalidId'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDismissPrompt = () => {
    setShowPrompt(false);
    void pendingNsr;
    completeOnboarding(); // RootNavigator flips to the NeoSenior tabs
  };

  return (
    <ScreenShell
      showTopographic
      title={t('neoSeniorOnboarding.activateTitle')}
      subtitle={t('neoSeniorOnboarding.activateSubtitle')}
    >
      <FormCard>
        <LabeledInput
          label={t('neoSeniorOnboarding.idLabel')}
          placeholder={t('neoSeniorOnboarding.idPlaceholder')}
          value={id}
          onChangeText={setId}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          label={t('neoSeniorOnboarding.activateCta')}
          disabled={!normaliseId(id)}
          loading={loading}
          onPress={handleActivate}
        />

        <CompleteProfilePrompt visible={showPrompt} onDismiss={handleDismissPrompt} />
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('neoSeniorOnboarding.setupOwnPrompt')} </Text>
          <Pressable
            onPress={() => navigation.navigate('NeoSeniorSelfReg')}
            accessibilityRole="link"
            hitSlop={8}
          >
            <Text style={styles.footerLink}>{t('neoSeniorOnboarding.setupOwnLink')}</Text>
          </Pressable>
        </View>
      </FormCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  error: { color: Colors.error, fontSize: FontSize.sm, marginBottom: Spacing.sm },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
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
