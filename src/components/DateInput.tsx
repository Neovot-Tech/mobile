import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Platform, Modal, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, MinTapTarget } from '../theme';

interface DateInputProps {
  label?: string;
  value: string; // ISO 'YYYY-MM-DD' or ''
  onChange: (iso: string) => void;
}

function isoToDisplay(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function displayToIso(display: string): string | null {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const day = parseInt(d, 10);
  const month = parseInt(m, 10);
  const year = parseInt(y, 10);
  const date = new Date(year, month - 1, day);
  if (
    isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  )
    return null;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export default function DateInput({ label, value, onChange }: DateInputProps) {
  const [text, setText] = useState(() => isoToDisplay(value));
  const [showPicker, setShowPicker] = useState(false);
  const [invalid, setInvalid] = useState(false);
  // iOS: track spinning selection before the user confirms with "Done"
  const [iosDraft, setIosDraft] = useState<Date | null>(null);

  const handleTextChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setText(formatted);

    if (digits.length === 8) {
      const iso = displayToIso(formatted);
      setInvalid(!iso);
      if (iso) onChange(iso);
    } else {
      setInvalid(false);
      if (!digits) onChange('');
    }
  };

  const openPicker = () => {
    const base = value ? new Date(value + 'T12:00:00') : new Date(1955, 0, 1);
    setIosDraft(base);
    setShowPicker(true);
  };

  const handleAndroidChange = (_event: DateTimePickerChangeEvent, date?: Date) => {
    setShowPicker(false);
    if (!date) return;
    const iso = date.toISOString().split('T')[0];
    setText(isoToDisplay(iso));
    setInvalid(false);
    onChange(iso);
  };

  const handleIOSSpin = (_event: DateTimePickerChangeEvent, date?: Date) => {
    if (date) setIosDraft(date);
  };

  const confirmIOS = () => {
    const draft = iosDraft ?? (value ? new Date(value + 'T12:00:00') : new Date(1955, 0, 1));
    const iso = draft.toISOString().split('T')[0];
    setText(isoToDisplay(iso));
    setInvalid(false);
    onChange(iso);
    setShowPicker(false);
  };

  const pickerBase = value ? new Date(value + 'T12:00:00') : new Date(1955, 0, 1);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.row, invalid && styles.rowError]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleTextChange}
          placeholder="DD / MM / YYYY"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          maxLength={10}
          accessibilityLabel={label}
        />
        <Pressable
          style={styles.iconBtn}
          onPress={Platform.OS !== 'web' ? openPicker : undefined}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open calendar"
        >
          <Ionicons name="calendar-outline" size={22} color={Colors.textMuted} />
          {Platform.OS === 'web' && (
            // @ts-ignore: raw <input> is valid in a browser environment
            <input
              type="date"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0,
                cursor: 'pointer',
                width: '100%',
                height: '100%',
              }}
              max={new Date().toISOString().split('T')[0]}
              min="1900-01-01"
              value={value || ''}
              onChange={(e: any) => {
                const iso: string = e.target.value; // 'YYYY-MM-DD'
                if (iso) {
                  setText(isoToDisplay(iso));
                  setInvalid(false);
                  onChange(iso);
                }
              }}
            />
          )}
        </Pressable>
      </View>
      {invalid && <Text style={styles.error}>Enter a valid date (DD/MM/YYYY)</Text>}

      {Platform.OS === 'ios' && showPicker && (
        <Modal transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
          <Pressable style={styles.backdrop} onPress={() => setShowPicker(false)}>
            <View style={styles.sheet}>
              <DateTimePicker
                value={iosDraft ?? pickerBase}
                mode="date"
                display="spinner"
                onValueChange={handleIOSSpin}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
                style={{ width: '100%' }}
              />
              <Pressable style={styles.doneBtn} onPress={confirmIOS} accessibilityRole="button">
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}

      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={pickerBase}
          mode="date"
          display="default"
          onValueChange={handleAndroidChange}
          onDismiss={() => setShowPicker(false)}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}
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
    minHeight: MinTapTarget.neoSenior,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
  },
  rowError: { borderColor: Colors.error },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  iconBtn: { padding: Spacing.xs },
  error: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
  },
  doneBtn: {
    alignSelf: 'flex-end',
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  doneText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.primary,
  },
});
