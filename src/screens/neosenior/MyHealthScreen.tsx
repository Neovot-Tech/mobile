import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme';

export default function NeoSeniorMyHealthScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>My Health — TODO Phase 3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  text: { color: Colors.textSecondary },
});
