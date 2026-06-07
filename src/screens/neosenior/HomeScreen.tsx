import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize } from '../../theme';

export default function NeoSeniorHomeScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t('neoSeniorHome.title')}</Text>
      <Text style={styles.sub}>Mic button + yesterday's summary — TODO Phase 3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { color: Colors.textPrimary, fontSize: FontSize.lg, textAlign: 'center' },
  sub: { color: Colors.textSecondary, fontSize: FontSize.base, marginTop: 8, textAlign: 'center' },
});
