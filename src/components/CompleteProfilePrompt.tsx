import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Brand, Colors, Fonts, FontSize, Spacing, BorderRadius } from '../theme';

interface CompleteProfilePromptProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function CompleteProfilePrompt({ visible, onDismiss }: CompleteProfilePromptProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={56} color={Brand.primary} />
          </View>

          <Text style={styles.title}>{t('completeProfile.title')}</Text>
          <Text style={styles.body}>{t('completeProfile.body')}</Text>

          <View style={styles.hint}>
            <Ionicons name="information-circle-outline" size={18} color="#9a5b14" />
            <Text style={styles.hintText}>{t('completeProfile.hint')}</Text>
          </View>

          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>{t('completeProfile.cta')}</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,46,56,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: Brand.bgCream,
    borderRadius: 26,
    padding: 32,
    alignItems: 'center',
    gap: Spacing.md,
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#EEF5F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: FontSize['3xl'],
    color: Brand.primary,
    textAlign: 'center',
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: FontSize.base,
    color: Brand.bodyText,
    textAlign: 'center',
    lineHeight: 24,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Brand.bgWarmCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignSelf: 'stretch',
    marginBottom: Spacing.sm,
  },
  hintText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.primaryText,
    lineHeight: 20,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    alignSelf: 'stretch',
    height: 56,
    backgroundColor: Brand.primaryForm,
    borderRadius: 12,
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaPressed: { opacity: 0.85 },
  ctaText: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
});
