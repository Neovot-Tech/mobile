import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Brand, Colors, Fonts, FontSize, Spacing } from '../theme';

export const CONDITION_OPTIONS = [
  'Hypertension',
  'Diabetes',
  'Heart condition',
  'COPD/Respiratory',
  'Other',
] as const;

export type Condition = (typeof CONDITION_OPTIONS)[number];

interface ConditionMultiSelectProps {
  label?: string;
  hint?: string;
  selected: string[];
  onChange: (selected: string[]) => void;
  readOnly?: boolean;
}

export default function ConditionMultiSelect({
  label,
  hint,
  selected,
  onChange,
  readOnly,
}: ConditionMultiSelectProps) {
  const toggle = (key: string) => {
    if (readOnly) return;
    if (selected.includes(key)) {
      onChange(selected.filter((c) => c !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.list}>
        {CONDITION_OPTIONS.map((key) => {
          const active = selected.includes(key);
          return (
            <Pressable
              key={key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggle(key)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              accessibilityLabel={key}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {key}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.lg },
  label: {
    fontFamily: Fonts.heading,
    fontWeight: '700',
    fontSize: 15,
    color: Brand.primaryText,
    marginBottom: 9,
  },
  hint: {
    fontFamily: Fonts.body,
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.borderForm,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Brand.primaryForm,
    borderColor: Brand.primaryForm,
  },
  chipText: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    color: Brand.primaryForm,
  },
  chipTextActive: {
    color: '#fff',
  },
});
