import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize, MinTapTarget, Spacing } from '../theme';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  /** Review mode: bottom border only, not editable */
  readOnly?: boolean;
}

export default function PhoneInput({ value, onChangeText, label, readOnly }: PhoneInputProps) {
  const { t } = useTranslation();

  if (readOnly) {
    return (
      <View style={styles.wrap}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <Text style={styles.readOnlyValue}>{value}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <View style={styles.flagBox}>
          <Text style={styles.flag}>🇬🇭</Text>
          <Text style={styles.chevron}>⌄</Text>
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="phone-pad"
          placeholder={t('auth.phonePlaceholder')}
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
          accessibilityLabel={label ?? t('auth.phonePlaceholder')}
        />
      </View>
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
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    minHeight: MinTapTarget.neoSenior,
    alignItems: 'center',
  },
  flagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    alignSelf: 'stretch',
    gap: 4,
  },
  flag: { fontSize: FontSize.lg },
  chevron: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: -6 },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    minHeight: MinTapTarget.neoSenior,
  },
  readOnlyValue: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },
});
