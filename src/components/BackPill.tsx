import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize } from '../theme';

export default function BackPill() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => navigation.goBack()}
      style={styles.pill}
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      hitSlop={8}
    >
      <Text style={styles.chevron}>‹</Text>
      <Text style={styles.label}>{t('common.back')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
    minHeight: 38,
  },
  chevron: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    marginRight: 6,
    lineHeight: 20,
  },
  label: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '500' },
});
