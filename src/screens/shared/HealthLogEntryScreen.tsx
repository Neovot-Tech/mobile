import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import { getHealthLogEntry } from '../../services/healthLogs.service';
import { getApiErrorMessage } from '../../services/http';
import { NeoSeniorAppStackParamList } from '../../navigation/types';
import { Colors, Brand, Fonts, FontSize, Spacing } from '../../theme';

// ─── Tier badge config ─────────────────────────────────────────────────────────

type TierConfig = {
  bg: string;
  border: string;
  fg: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

const TIER_CONFIG: Record<string, TierConfig> = {
  urgent: {
    bg: '#fbe7e7',
    border: 'rgba(163,38,31,0.18)',
    fg: '#a3261f',
    icon: 'warning-outline',
    label: 'Urgent',
  },
  warning: {
    bg: '#fdf0e1',
    border: 'rgba(154,91,20,0.18)',
    fg: '#9a5b14',
    icon: 'warning-outline',
    label: 'Monitor',
  },
  normal: {
    bg: '#e6f0ec',
    border: 'rgba(31,107,79,0.15)',
    fg: '#1f6b4f',
    icon: 'checkmark-circle-outline',
    label: 'Normal',
  },
};

function getTierConfig(tier: string): TierConfig {
  return TIER_CONFIG[tier] ?? TIER_CONFIG.normal;
}

function formatKey(k: string): string {
  return k
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HealthLogEntryScreen() {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<NeoSeniorAppStackParamList, 'HealthLogEntry'>>();
  const { logId } = route.params;

  const entryQ = useQuery({
    queryKey: ['healthLogEntry', logId],
    queryFn: () => getHealthLogEntry(logId),
  });
  const entry = entryQ.data;

  return (
    <Screen contentContainerStyle={styles.content}>
      <BackHeader title={t('logEntry.title')} />

      {entryQ.isLoading ? (
        <ActivityIndicator color={Brand.primary} style={{ marginTop: Spacing['2xl'] }} />
      ) : entryQ.isError || !entry ? (
        <Text style={styles.error}>{getApiErrorMessage(entryQ.error)}</Text>
      ) : (
        <>
          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {t(`logEntry.type_${entry.logType}`)}
              </Text>
            </View>
            <TierBadge tier={entry.escalationTier} />
            <Text style={styles.timestamp}>
              {new Date(entry.loggedAt).toLocaleString()}
            </Text>
          </View>

          {/* Summary */}
          <Text style={styles.sectionLabel}>{t('logEntry.summary')}</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>{entry.aiSummary}</Text>
          </View>

          {/* Escalation block */}
          {entry.escalationReason && (
            <View style={styles.escalationBlock}>
              <Ionicons name="warning-outline" size={22} color="#a3261f" style={{ marginTop: 1 }} />
              <Text style={styles.escalationText}>{entry.escalationReason}</Text>
            </View>
          )}

          {/* Transcript */}
          <Text style={styles.sectionLabel}>{t('logEntry.transcript')}</Text>
          {entry.rawTranscript ? (
            <View style={styles.transcriptCard}>
              <Text style={styles.transcriptText}>"{entry.rawTranscript}"</Text>
            </View>
          ) : (
            <View style={styles.noTranscriptCard}>
              <View style={styles.noTranscriptIcon}>
                <Ionicons name="image-outline" size={30} color="#b89a5b" />
              </View>
              <Text style={styles.noTranscriptText}>{t('logEntry.noTranscript')}</Text>
            </View>
          )}

          {/* Details */}
          {entry.extractedEntities && Object.keys(entry.extractedEntities).length > 0 && (
            <>
              <Text style={styles.sectionLabel}>{t('logEntry.details')}</Text>
              <View style={styles.detailsCard}>
                {Object.entries(entry.extractedEntities).map(([k, v], i, arr) => (
                  <View
                    key={k}
                    style={[styles.kvRow, i < arr.length - 1 && styles.kvDivider]}
                  >
                    <Text style={styles.kvKey}>{formatKey(k)}</Text>
                    <Text style={styles.kvVal}>{String(v)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </>
      )}
    </Screen>
  );
}

// ─── Tier badge sub-component ─────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string }) {
  const cfg = getTierConfig(tier);
  return (
    <View
      style={[
        styles.tierBadge,
        { backgroundColor: cfg.bg, borderColor: cfg.border },
      ]}
    >
      <Ionicons name={cfg.icon} size={14} color={cfg.fg} />
      <Text style={[styles.tierBadgeText, { color: cfg.fg }]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  typeBadge: {
    borderWidth: 1,
    borderColor: '#cdd9da',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  typeBadgeText: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Brand.primaryForm,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tierBadgeText: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  timestamp: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.sm,
    color: Brand.mutedTeal,
  },

  // Section labels
  sectionLabel: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Brand.mutedTeal,
    marginTop: 26,
    marginBottom: 8,
  },

  // Summary card
  summaryCard: {
    backgroundColor: Brand.bgWarmCard,
    borderWidth: 1,
    borderColor: Brand.borderCard,
    borderRadius: 18,
    padding: 22,
  },
  summaryText: {
    fontFamily: Fonts.body,
    fontSize: 20,
    lineHeight: 31,
    color: Brand.primary,
  },

  // Escalation
  escalationBlock: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: '#fbe7e7',
    borderWidth: 1,
    borderColor: 'rgba(163,38,31,0.18)',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
  },
  escalationText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    lineHeight: 23,
    color: '#a3261f',
    flex: 1,
  },

  // Transcript
  transcriptCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    borderRadius: 18,
    padding: 18,
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  transcriptText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.lg,
    lineHeight: 28,
    color: Brand.bodyText,
    fontStyle: 'italic',
  },
  noTranscriptCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  noTranscriptIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Brand.bgWarmCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  noTranscriptText: {
    fontFamily: Fonts.body,
    fontSize: 17,
    lineHeight: 26,
    color: Brand.mutedTeal,
    textAlign: 'center',
  },

  // Details
  detailsCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  kvDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3ead6',
  },
  kvKey: {
    fontFamily: Fonts.body,
    fontSize: 17,
    color: Brand.mutedTeal,
    flexShrink: 1,
  },
  kvVal: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    color: Brand.primary,
    textAlign: 'right',
    flexShrink: 1,
  },

  error: {
    fontFamily: Fonts.body,
    fontSize: FontSize.base,
    color: Colors.error,
    marginTop: Spacing.lg,
  },
});
