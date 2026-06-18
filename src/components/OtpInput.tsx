import React, { useRef } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Colors, FontSize, MinTapTarget, Spacing } from '../theme';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
}

export default function OtpInput({ length = 4, value, onChange }: OtpInputProps) {
  const refs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const chars = value.split('');
    chars[index] = text.slice(-1);
    const next = chars.join('').slice(0, length);
    onChange(next);
    if (text && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length }, (_, i) => (
        <TextInput
          key={i}
          ref={(r) => {
            refs.current[i] = r;
          }}
          value={value[i] ?? ''}
          onChangeText={(text) => handleChange(text, i)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
          maxLength={1}
          keyboardType="numeric"
          autoCapitalize="none"
          style={styles.box}
          accessibilityLabel={`OTP digit ${i + 1}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  box: {
    flex: 1,
    minHeight: MinTapTarget.neoSenior,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    textAlign: 'center',
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
