import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { createLink } from '../services/onboarding.service';
import { getApiErrorMessage } from '../services/http';
import { useCreatedSeniors } from '../store/createdSeniors.store';
import { Colors, Brand, Fonts, FontSize, Spacing, BorderRadius, MinTapTarget } from '../theme';

/** Normalise free input into the NSR-XXXXX shape. */
function normaliseId(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/\s+/g, '');
  const body = cleaned.replace(/^NSR-?/, '');
  return body ? `NSR-${body}` : '';
}

interface LinkOrCreateChoiceProps {
  /** Called after a link request is successfully sent. */
  onLinked: () => void;
  /** Called when the user chooses to create a brand-new profile. */
  onCreateNew: () => void;
}

/**
 * Two NeoCare onboarding paths: link an existing NeoSenior by their ID, or
 * create a new profile. Renders content only (no screen shell) so it can sit
 * inside ScreenShell (onboarding) or Screen (dashboard "add").
 */
export default function LinkOrCreateChoice({ onLinked, onCreateNew }: LinkOrCreateChoiceProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const addLinkRequest = useCreatedSeniors((s) => s.addLinkRequest);

  const linkMut = useMutation({
    mutationFn: (id: string) => createLink(id),
    onSuccess: (_res, id) => {
      // Remember the outgoing request locally — the backend doesn't list a
      // NeoCare's pending links, so the dashboard shows it from here.
      addLinkRequest(id);
      Alert.alert(t('neoCareLink.linkCta'), t('neoCareLink.linkPending'));
      onLinked();
    },
  });

  const nsr = normaliseId(code);

  return (
    <View>
      {/* Path A — link by existing code */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('neoCareLink.haveCodeTitle')}</Text>
        <Text style={styles.cardHint}>{t('neoCareLink.haveCodeHint')}</Text>

        <Text style={styles.inputLabel}>{t('neoCareLink.codeLabel')}</Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder={t('neoCareLink.codePlaceholder')}
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
        />
        {linkMut.isError && (
          <Text style={styles.error}>{getApiErrorMessage(linkMut.error, t('neoCareLink.invalidCode'))}</Text>
        )}
        <Pressable
          style={[styles.primaryBtn, (!nsr || linkMut.isPending) && styles.btnDisabled]}
          onPress={() => linkMut.mutate(nsr)}
          disabled={!nsr || linkMut.isPending}
          accessibilityRole="button"
        >
          {linkMut.isPending ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryBtnText}>{t('neoCareLink.linkCta')}</Text>
          )}
        </Pressable>
      </View>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('neoCareLink.or')}</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Path B — create new */}
      <Pressable
        style={({ pressed }) => [styles.createCard, pressed && styles.createPressed]}
        onPress={onCreateNew}
        accessibilityRole="button"
      >
        <View style={styles.createIcon}>
          <Ionicons name="person-add" size={22} color={Brand.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{t('neoCareLink.createTitle')}</Text>
          <Text style={styles.cardHint}>{t('neoCareLink.createHint')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    padding: Spacing.lg,
  },
  cardTitle: { fontFamily: Fonts.heading, fontSize: FontSize.lg, color: Brand.primary },
  cardHint: {
    fontFamily: Fonts.body,
    fontSize: FontSize.base,
    lineHeight: 22,
    color: Brand.bodyText,
    marginTop: Spacing.xs,
  },
  inputLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSize.sm,
    color: Brand.primaryText,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  input: {
    minHeight: MinTapTarget.neoCare,
    borderWidth: 1,
    borderColor: Brand.borderForm,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.base,
    fontSize: FontSize.base,
    color: Brand.inputText,
    backgroundColor: Colors.surface,
  },
  error: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: Colors.error, marginTop: Spacing.sm },
  primaryBtn: {
    minHeight: MinTapTarget.neoSenior,
    backgroundColor: Brand.primary,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.base,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.base, color: Colors.white },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: Brand.borderForm },
  dividerText: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: Brand.mutedTeal },

  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    padding: Spacing.lg,
  },
  createPressed: { opacity: 0.7 },
  createIcon: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.full,
    backgroundColor: Brand.bgWarmCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
