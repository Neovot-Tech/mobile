import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import ScreenShell from '../../../components/ScreenShell';
import PrimaryButton from '../../../components/PrimaryButton';
import CompleteProfilePrompt from '../../../components/CompleteProfilePrompt';
import { listPendingLinks, respondToLink, PendingLink } from '../../../services/onboarding.service';
import { useAuthStore } from '../../../store/auth.store';
import { ConsentMap } from '../../../services/types';
import { Colors, Brand, Fonts, FontSize, Spacing, BorderRadius, MinTapTarget } from '../../../theme';

export default function NeoSeniorConfirmLinkScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const [showPrompt, setShowPrompt] = useState(false);

  const pendingQ = useQuery({ queryKey: ['pendingLinks'], queryFn: listPendingLinks });
  const links = pendingQ.data ?? [];

  const respond = useMutation({
    mutationFn: (vars: { linkId: string; accept: boolean }) => respondToLink(vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pendingLinks'] }),
  });

  return (
    <ScreenShell
      title={t('neoSeniorOnboarding.confirmTitle')}
      subtitle={t('neoSeniorOnboarding.confirmSubtitle')}
    >
      {pendingQ.isLoading ? (
        <ActivityIndicator color={Brand.primary} style={{ marginTop: Spacing['2xl'] }} />
      ) : links.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="people-outline" size={40} color={Brand.mutedTeal} />
          <Text style={styles.empty}>{t('neoSeniorOnboarding.noPending')}</Text>
        </View>
      ) : (
        links.map((link) => (
          <LinkCard
            key={link.id}
            link={link}
            pending={respond.isPending}
            onRespond={(accept) => respond.mutate({ linkId: link.id, accept })}
          />
        ))
      )}

      <PrimaryButton
        label={t('common.complete')}
        variant="secondary"
        onPress={() => setShowPrompt(true)}
        style={{ marginTop: Spacing.lg }}
      />

      <CompleteProfilePrompt
        visible={showPrompt}
        onDismiss={() => {
          setShowPrompt(false);
          completeOnboarding();
        }}
      />
    </ScreenShell>
  );
}

function LinkCard({
  link,
  pending,
  onRespond,
}: {
  link: PendingLink;
  pending: boolean;
  onRespond: (accept: boolean) => void;
}) {
  const { t } = useTranslation();
  const permLabels: { key: keyof ConsentMap; label: string }[] = [
    { key: 'vitals', label: t('neoSeniorOnboarding.permVitals') },
    { key: 'medications', label: t('neoSeniorOnboarding.permMedications') },
    { key: 'symptoms', label: t('neoSeniorOnboarding.permSymptoms') },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{link.neoCareName}</Text>
      <Text style={styles.wants}>{t('neoSeniorOnboarding.linkWants')}</Text>

      <View style={styles.chips}>
        {permLabels
          .filter((p) => link.permissions?.[p.key])
          .map((p) => (
            <View key={p.key} style={styles.chip}>
              <Ionicons name="checkmark" size={14} color={Brand.primary} />
              <Text style={styles.chipText}>{p.label}</Text>
            </View>
          ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, styles.reject]}
          onPress={() => onRespond(false)}
          disabled={pending}
          accessibilityRole="button"
        >
          <Text style={styles.rejectText}>{t('neoSeniorOnboarding.reject')}</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.accept]}
          onPress={() => onRespond(true)}
          disabled={pending}
          accessibilityRole="button"
        >
          <Text style={styles.acceptText}>{t('neoSeniorOnboarding.accept')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyWrap: { alignItems: 'center', gap: Spacing.md, marginVertical: Spacing['3xl'] },
  empty: { fontFamily: Fonts.body, fontSize: FontSize.base, color: Brand.mutedTeal, textAlign: 'center' },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
  },
  name: { fontFamily: Fonts.heading, fontSize: FontSize.lg, color: Brand.primary },
  wants: { fontFamily: Fonts.body, fontSize: FontSize.base, color: Brand.bodyText, marginTop: Spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Brand.bgWarmCard,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  chipText: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.sm, color: Brand.primaryContent },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  btn: {
    flex: 1,
    minHeight: MinTapTarget.neoSenior,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reject: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Brand.borderForm },
  rejectText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.base, color: Brand.mutedTeal },
  accept: { backgroundColor: Brand.primary },
  acceptText: { fontFamily: Fonts.bodySemiBold, fontSize: FontSize.base, color: Colors.white },
});
