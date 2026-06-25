import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HealthLogSummary, EscalationTier } from '../services/healthLogs.service';
import { Colors, Brand, Fonts, FontSize, Spacing, BorderRadius } from '../theme';

// ─── Shared design tokens used by both list and detail screens ────────────────

export const SEVERITY_BADGE = {
  Normal: { bg: '#00BFA5', label: 'Normal' },
  Watch: { bg: '#F9A825', label: 'Watch' },
  Alert: { bg: '#EF5350', label: 'Alert' },
} as const;

export type SeverityStatus = keyof typeof SEVERITY_BADGE;

export function toSeverity(tier: EscalationTier): SeverityStatus {
  if (tier === 'urgent') return 'Alert';
  if (tier === 'warning') return 'Watch';
  return 'Normal';
}

export function deriveMood(tier: EscalationTier): string {
  if (tier === 'urgent') return 'Unwell';
  if (tier === 'warning') return 'Fair';
  return 'Stable';
}

export function deriveMeds(log: HealthLogSummary): string {
  if (log.logType !== 'medication') return '—';
  return log.escalationTier === 'urgent' || log.escalationTier === 'warning'
    ? 'Missed'
    : 'Taken';
}

export function formatCardDate(iso: string): string {
  const date = new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
  const time = new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${date} · ${time}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface HistoryLogCardProps {
  item: HealthLogSummary;
  onPress?: () => void;
  /** Blood pressure reading — shown when available (e.g. from extractedEntities). */
  bp?: string;
  /** Blood sugar reading — shown when available. */
  sugar?: string;
}

export default function HistoryLogCard({
  item,
  onPress,
  bp = '—',
  sugar = '—',
}: HistoryLogCardProps) {
  const severity = toSeverity(item.escalationTier);
  const badge = SEVERITY_BADGE[severity];

  const inner = (
    <View style={card.container}>
      {/* Date + time header row */}
      <View style={card.header}>
        <Text style={card.date} numberOfLines={1}>
          {formatCardDate(item.loggedAt)}
        </Text>
        <View style={[card.badge, { backgroundColor: badge.bg }]}>
          <Text style={card.badgeText}>{badge.label}</Text>
        </View>
      </View>

      {/* Metrics grid */}
      <View style={card.metricsRow}>
        {/* Left: BP + Sugar */}
        <View style={card.metricsCol}>
          <View style={card.metricItem}>
            <Text style={card.metricLabel}>BP: </Text>
            <Text style={card.metricValue} numberOfLines={1}>{bp}</Text>
          </View>
          <View style={card.metricItem}>
            <Text style={card.metricLabel}>Sugar: </Text>
            <Text style={card.metricValue} numberOfLines={1}>{sugar}</Text>
          </View>
        </View>

        {/* Right: Mood + Meds */}
        <View style={card.metricsCol}>
          <View style={card.metricItem}>
            <Text style={card.metricLabel}>Mood: </Text>
            <Text style={card.metricValue}>{deriveMood(item.escalationTier)}</Text>
          </View>
          <View style={card.metricItem}>
            <Text style={card.metricLabel}>Meds: </Text>
            <Text style={card.metricValue}>{deriveMeds(item)}</Text>
          </View>
        </View>
      </View>

      {/* AI summary */}
      {!!item.aiSummary && (
        <View style={card.summaryRow}>
          <Ionicons name="document-text-outline" size={14} color={Brand.mutedTeal} />
          <Text style={card.summaryText} numberOfLines={2}>
            {item.aiSummary}
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => (pressed ? { opacity: 0.75 } : undefined)}
      >
        {inner}
      </Pressable>
    );
  }

  return inner;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const card = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#FFE6D5',
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  date: {
    flex: 1,
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Brand.primary,
    paddingRight: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  badgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.white,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricsCol: {
    width: '48%',
    gap: Spacing.sm,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.mutedTeal,
  },
  metricValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Brand.primary,
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#EFEBE4',
  },
  summaryText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.bodyText,
    lineHeight: 19,
  },
});
