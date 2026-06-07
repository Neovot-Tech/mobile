import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../theme';

export default function NeoCaresDashboardScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t('neoCare.dashboardEmpty')}</Text>
      <Text style={styles.sub}>Weekly snapshot + alert feed — TODO Phase 4</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { color: Colors.textSecondary, textAlign: 'center' },
  sub: { color: Colors.textMuted, marginTop: 8, textAlign: 'center' },
});
