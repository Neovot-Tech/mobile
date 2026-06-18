import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import LinkOrCreateChoice from '../../components/LinkOrCreateChoice';
import { NeoCareAppStackParamList } from '../../navigation/types';

/** Post-onboarding "Add a NeoSenior" — same link-or-create choice as onboarding. */
export default function AddSeniorScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const navigation = useNavigation<NativeStackNavigationProp<NeoCareAppStackParamList>>();

  return (
    <Screen>
      <BackHeader title={t('neoCareLink.addTitle')} />
      <LinkOrCreateChoice
        onLinked={() => {
          qc.invalidateQueries({ queryKey: ['linkedProfiles'] });
          navigation.goBack();
        }}
        onCreateNew={() => navigation.navigate('CreateSenior')}
      />
    </Screen>
  );
}
