import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Brand, Colors, Fonts, FontSize, Spacing } from '../theme';

interface ProfileNudgeBannerProps {
  /** Rendered when true; hidden (null) otherwise — no layout space consumed. */
  visible: boolean;
  /** Called when the user taps the dismiss X. */
  onDismiss: () => void;
  /** Called when the user taps the CTA — should navigate to the Edit Profile screen. */
  onComplete: () => void;
  /** When provided, copy reads "Complete [name]'s profile" (NeoCare flow). */
  seniorName?: string;
}

export default function ProfileNudgeBanner({
  visible,
  onDismiss,
  onComplete,
  seniorName,
}: ProfileNudgeBannerProps) {
  const { t } = useTranslation();

  if (!visible) return null;

  const title = seniorName
    ? t('profileNudge.titleSenior', { name: seniorName })
    : t('profileNudge.titleSelf');

  return (
    <View style={styles.banner}>
      <View style={styles.iconCircle}>
        <Ionicons name="person-outline" size={22} color="#9a5b14" />
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.hint}>{t('profileNudge.hint')}</Text>
        <Pressable
          onPress={onComplete}
          accessibilityRole="button"
          accessibilityLabel={t('profileNudge.cta')}
          hitSlop={8}
        >
          <View style={styles.ctaRow}>
            <Text style={styles.cta}>{t('profileNudge.cta')}</Text>
            <Ionicons name="arrow-forward" size={16} color={Brand.primary} />
          </View>
        </Pressable>
      </View>

      <Pressable
        style={styles.dismissBtn}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={t('profileNudge.dismiss')}
        hitSlop={8}
      >
        <Ionicons name="close" size={16} color="#9a5b14" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.goldLight,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.gold,
    padding: 16,
    marginBottom: 22,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.lg,
    color: Brand.primary,
    lineHeight: 22,
  },
  hint: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: '#7a6230',
    marginTop: 4,
    marginBottom: 10,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cta: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: Brand.primary,
  },
  dismissBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
