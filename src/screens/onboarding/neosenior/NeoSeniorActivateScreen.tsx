import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../../theme';

export default function NeoSeniorActivateScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Enter NeoSenior ID — TODO Phase 2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  text: { color: Colors.textSecondary },
});
