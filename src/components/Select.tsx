import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Colors, FontSize, MinTapTarget, Spacing } from '../theme';

interface SelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  /** Review mode: bottom border only, not pressable */
  readOnly?: boolean;
}

export default function Select({ label, value, options, onChange, readOnly }: SelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => !readOnly && setOpen(true)}
        style={[styles.field, readOnly && styles.fieldReadOnly]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.optionText}>{item}</Text>
                </Pressable>
              )}
            />
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
  field: {
    minHeight: MinTapTarget.neoSenior,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
  },
  fieldReadOnly: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
    paddingHorizontal: Spacing.sm,
  },
  value: { fontSize: FontSize.base, color: Colors.textPrimary },
  chevron: { color: Colors.textPrimary, fontSize: FontSize.lg, marginTop: -8 },
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    maxHeight: 320,
    overflow: 'hidden',
  },
  option: {
    minHeight: MinTapTarget.neoSenior,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionText: { fontSize: FontSize.base, color: Colors.textPrimary },
});
