import React from 'react';
import { Image, StyleSheet } from 'react-native';

export default function Logo() {
  return (
    <Image
      source={require('../../assets/logo.png')}
      style={styles.logo}
      resizeMode="contain"
      accessible={false}
    />
  );
}

const styles = StyleSheet.create({
  logo: { width: 89, height: 19 },
});
