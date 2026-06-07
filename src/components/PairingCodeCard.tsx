import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize, MinTapTarget, Spacing } from '../theme';

interface PairingCodeCardProps {
  name: string;
  /** Full NeoSenior ID, e.g. "NSR-227Q0" — boxes show the part after "NSR-" */
  neoSeniorId: string;
}

export default function PairingCodeCard({ name, neoSeniorId }: PairingCodeCardProps) {
  const { t } = useTranslation();
  const code = neoSeniorId.replace(/^NSR-/, '');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <Pressable
          style={styles.copyButton}
          onPress={() => Clipboard.setStringAsync(neoSeniorId)}
          accessibilityRole="button"
          accessibilityLabel={t('common.copy')}
          hitSlop={8}
        >
          <Text style={styles.copyLabel}>{t('common.copy')}</Text>
          <Ionicons name="copy-outline" size={14} color={Colors.textPrimary} />
        </Pressable>
      </View>
      <View style={styles.boxRow}>
        {code.split('').map((char, i) => (
          <View key={i} style={styles.box}>
            <Text style={styles.boxChar}>{char}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.goldDark,
    borderRadius: 12,
    backgroundColor: Colors.goldLight,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  name: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '600' },
  copyButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  copyLabel: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600' },
  boxRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  box: {
    flex: 1,
    minHeight: MinTapTarget.neoSenior,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChar: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '600' },
});
