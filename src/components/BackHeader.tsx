import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Colors, Fonts, FontSize, Spacing } from '../theme';

interface BackHeaderProps {
  title?: string;
  /** Show a hairline border-bottom below the row (used on long-form screens). */
  bordered?: boolean;
}

export default function BackHeader({ title, bordered }: BackHeaderProps) {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <View style={[styles.row, bordered && styles.rowBordered]}>
      <Pressable
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        hitSlop={8}
        style={styles.btn}
      >
        <Ionicons name="arrow-back" size={20} color={Brand.primary} />
      </Pressable>
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
  },
  rowBordered: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3ead6',
    marginBottom: Spacing.xl,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.xl,
    color: Brand.primary,
    flex: 1,
  },
});
