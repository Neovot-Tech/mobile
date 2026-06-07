import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, MinTapTarget, Spacing } from '../theme';

interface GoogleButtonProps {
  label: string;
  onPress: () => void;
}

export default function GoogleButton({ label, onPress }: GoogleButtonProps) {
  return (
    <Pressable
      style={styles.button}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name="logo-google" size={18} color="#4285F4" />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    minHeight: MinTapTarget.neoSenior,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    backgroundColor: Colors.surface,
  },
  label: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '600' },
});
