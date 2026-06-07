import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme';

export default function NeoCareSettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings (NeoCare) — TODO Phase 4</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  text: { color: Colors.textSecondary },
});
