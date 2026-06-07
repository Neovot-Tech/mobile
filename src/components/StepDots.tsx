import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize } from '../theme';

interface StepDotsProps {
  current: number; // 1-based
  total: number;
}

export default function StepDots({ current, total }: StepDotsProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: i + 1 === current ? Colors.accent : Colors.primary },
          ]}
        />
      ))}
      <Text style={styles.label}>{t('common.stepOf', { current, total })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    marginLeft: 4,
  },
});
