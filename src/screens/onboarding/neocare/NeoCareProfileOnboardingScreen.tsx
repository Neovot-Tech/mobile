import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import ScreenShell from '../../../components/ScreenShell';
import FormCard from '../../../components/FormCard';
import LabeledInput from '../../../components/LabeledInput';
import Select from '../../../components/Select';
import PrimaryButton from '../../../components/PrimaryButton';
import { Colors, FontSize, Spacing } from '../../../theme';
import { updateMe } from '../../../services/users.service';
import { useAuthStore } from '../../../store/auth.store';
import { getApiErrorMessage } from '../../../services/http';

export default function NeoCareProfileOnboardingScreen() {
  const { t } = useTranslation();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  const [fullName, setFullName] = useState(user?.displayName ?? '');
  const [livesWith, setLivesWith] = useState(t('neoCareOnboarding.liveWithElderlyNo'));
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const livesWithOptions = [
    t('neoCareOnboarding.liveWithElderlyYes'),
    t('neoCareOnboarding.liveWithElderlyNo'),
  ];

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await updateMe({
        fullName: fullName.trim() || undefined,
        address: address.trim() || undefined,
        livesWithNeoSenior: livesWith === t('neoCareOnboarding.liveWithElderlyYes'),
      });
      if (user && fullName.trim()) {
        setUser({ ...user, displayName: fullName.trim() });
      }
      completeOnboarding();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell
      showTopographic
      title={t('auth.neoCare')}
      subtitle={t('neoCareOnboarding.step1Subtitle')}
    >
      <FormCard>
        <LabeledInput
          label={t('neoCareOnboarding.fullName')}
          placeholder={t('neoCareOnboarding.fullNamePlaceholder')}
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          autoComplete="name"
        />
        <Select
          label={t('neoCareOnboarding.liveWithElderly')}
          value={livesWith}
          options={livesWithOptions}
          onChange={setLivesWith}
        />
        <LabeledInput
          label={t('neoCareOnboarding.yourAddress')}
          placeholder={t('neoCareOnboarding.addressPlaceholder')}
          value={address}
          onChangeText={setAddress}
          autoCapitalize="words"
        />
        <PrimaryButton
          label={t('neoCareOnboarding.submit')}
          disabled={!fullName.trim()}
          loading={loading}
          onPress={handleSubmit}
          style={{ marginTop: Spacing.sm }}
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
    marginTop: Spacing.sm,
  },
});
