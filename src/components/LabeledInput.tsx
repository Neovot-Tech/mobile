import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors, FontSize, MinTapTarget, Spacing } from '../theme';

interface LabeledInputProps extends TextInputProps {
  label: string;
  /** Review mode: bottom border only, not editable */
  readOnly?: boolean;
}

export default function LabeledInput({ label, readOnly, style, ...inputProps }: LabeledInputProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        editable={!readOnly}
        placeholderTextColor={Colors.textMuted}
        style={[styles.input, readOnly && styles.inputReadOnly, style]}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.lg },
  label: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  input: {
    minHeight: MinTapTarget.neoSenior,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: Spacing.base,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  inputReadOnly: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
  },
});
