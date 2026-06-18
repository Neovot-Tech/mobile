import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize, MinTapTarget, Spacing, BorderRadius, Fonts } from '../theme';

export interface Country {
  code: string; // ISO
  name: string;
  dial: string; // e.g. "+234"
  flag: string;
  example: string; // national-format example
}

// Primary markets first. Extend as needed.
export const COUNTRIES: Country[] = [
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬', example: '801 234 5678' },
  { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭', example: '20 865 2278' },
];

const DEFAULT_COUNTRY = COUNTRIES[0]; // Nigeria

/** Strip everything but digits. */
const digitsOnly = (s: string) => s.replace(/[^\d]/g, '');

interface PhoneInputProps {
  /** Full E.164 value, e.g. "+234801234567". */
  value: string;
  onChangeText: (e164: string) => void;
  label?: string;
  /** Review mode: bottom border only, not editable */
  readOnly?: boolean;
}

export default function PhoneInput({ value, onChangeText, label, readOnly }: PhoneInputProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [pickerOpen, setPickerOpen] = useState(false);

  // Derive the selected country + national digits from the E.164 value.
  const { country, national } = useMemo(() => {
    const match = COUNTRIES.find((c) => value.startsWith(c.dial));
    if (match) return { country: match, national: value.slice(match.dial.length) };
    return { country: DEFAULT_COUNTRY, national: digitsOnly(value) };
  }, [value]);

  const emit = (nextCountry: Country, nextNational: string) =>
    onChangeText(`${nextCountry.dial}${digitsOnly(nextNational)}`);

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
        <Pressable
          style={styles.flagBox}
          onPress={() => setPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`${country.name} (${country.dial})`}
        >
          <Text style={styles.flag}>{country.flag}</Text>
          <Text style={styles.dial}>{country.dial}</Text>
          <Text style={styles.chevron}>⌄</Text>
        </Pressable>
        <TextInput
          value={national}
          onChangeText={(text) => emit(country, text)}
          keyboardType="phone-pad"
          placeholder={country.example}
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
          accessibilityLabel={label ?? t('auth.phonePlaceholder')}
        />
      </View>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
            <View style={styles.handle} />
            {COUNTRIES.map((c) => {
              const active = c.code === country.code;
              return (
                <Pressable
                  key={c.code}
                  style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                  onPress={() => {
                    emit(c, national);
                    setPickerOpen(false);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.optionFlag}>{c.flag}</Text>
                  <Text style={styles.optionName}>{c.name}</Text>
                  <Text style={styles.optionDial}>{c.dial}</Text>
                  {active ? <Text style={styles.optionCheck}>✓</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
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
  dial: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.base, color: Colors.textPrimary },
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

  backdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MinTapTarget.neoSenior,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionPressed: { opacity: 0.6 },
  optionFlag: { fontSize: FontSize.xl },
  optionName: { flex: 1, fontFamily: Fonts.bodyMedium, fontSize: FontSize.base, color: Colors.textPrimary },
  optionDial: { fontFamily: Fonts.body, fontSize: FontSize.base, color: Colors.textSecondary },
  optionCheck: { fontSize: FontSize.base, color: Colors.primary, fontWeight: '700' },
});
