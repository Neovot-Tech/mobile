import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, FontSize, MinTapTarget, Spacing } from '../theme';
import GoogleGIcon from './GoogleGIcon';

interface GoogleButtonProps {
  label: string;
  loading?: boolean;
  onPress: () => void;
}

export default function GoogleButton({ label, loading = false, onPress }: GoogleButtonProps) {
  return (
    <Pressable
      style={[styles.button, loading && styles.disabled]}
      onPress={loading ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <GoogleGIcon size={20} />
      )}
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
  disabled: { opacity: 0.6 },
  label: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '600' },
});
