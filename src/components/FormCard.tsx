import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing } from '../theme';

interface FormCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function FormCard({ children, style }: FormCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCDEA7',
    padding: Spacing.xl,
  },
});
