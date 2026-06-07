import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing } from '../theme';

interface GreetingProps {
  prefix: string; // e.g. "Hello, "
  name: string;
}

export default function Greeting({ prefix, name }: GreetingProps) {
  return (
    <Text style={styles.prefix}>
      {prefix}
      <Text style={styles.name}>{name}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  prefix: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    marginBottom: Spacing.md,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: FontSize['2xl'],
    fontWeight: '600',
  },
});
