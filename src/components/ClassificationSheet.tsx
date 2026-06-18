import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { ManualCategory } from '../services/types';
import { Colors, Brand, Fonts, FontSize, Spacing, BorderRadius, MinTapTarget } from '../theme';

const DEVICES: { key: ManualCategory; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'bp_monitor', icon: 'pulse' },
  { key: 'glucometer', icon: 'water' },
  { key: 'test_strip', icon: 'eyedrop' },
  { key: 'pulse_oximeter', icon: 'finger-print' },
  { key: 'weight_scale', icon: 'speedometer' },
];

interface ClassificationSheetProps {
  visible: boolean;
  onSelect: (category: ManualCategory) => void;
  onCancel: () => void;
}

export default function ClassificationSheet({
  visible,
  onSelect,
  onCancel,
}: ClassificationSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t('neoSeniorHome.classifyTitle')}</Text>
          <Text style={styles.subtitle}>{t('neoSeniorHome.classifySubtitle')}</Text>

          {DEVICES.map((d) => (
            <Pressable
              key={d.key}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={() => onSelect(d.key)}
              accessibilityRole="button"
              accessibilityLabel={t(`devices.${d.key}`)}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={d.icon} size={22} color={Brand.primary} />
              </View>
              <Text style={styles.optionLabel}>{t(`devices.${d.key}`)}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </Pressable>
          ))}

          <Pressable
            style={styles.cancel}
            onPress={onCancel}
            accessibilityRole="button"
          >
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(2,46,56,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Brand.bgCream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Brand.borderForm,
    marginBottom: Spacing.lg,
  },
  title: { fontFamily: Fonts.heading, fontSize: FontSize['2xl'], color: Brand.primary },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSize.base,
    lineHeight: 22,
    color: Brand.bodyText,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    gap: Spacing.base,
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  optionPressed: { opacity: 0.7 },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: Brand.accentPeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: { flex: 1, fontFamily: Fonts.bodyMedium, fontSize: FontSize.lg, color: Brand.primaryContent },
  cancel: {
    minHeight: MinTapTarget.neoSenior,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  cancelText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.base, color: Brand.mutedTeal },
});
