import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing } from '../theme';

interface LabeledDividerProps {
  label: string;
}

export default function LabeledDivider({ label }: LabeledDividerProps) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.lg,
  },
  line: { flex: 1, height: 1, backgroundColor: Colors.primary },
  label: { color: Colors.primary, fontSize: FontSize.sm },
});
