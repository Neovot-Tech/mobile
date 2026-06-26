import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { getHealthLogEntry } from '../../services/healthLogs.service';
import { getApiErrorMessage } from '../../services/http';
import { useAuthStore } from '../../store/auth.store';
import { NeoSeniorAppStackParamList } from '../../navigation/types';
import { Colors, Brand, Fonts, FontSize, Spacing, BorderRadius } from '../../theme';

// ─── Design tokens ────────────────────────────────────────────────────────────

const CARD_BORDER = '#FFE6C2';
const ROW_DIVIDER = '#EFEBE4';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

const LOG_LABEL: Record<string, string> = {
  symptom: 'Symptom Report',
  vitals: 'Vitals Reading',
  medication: 'Medication Log',
  prescription: 'Prescription Scan',
};

const LOG_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  symptom: 'create-outline',
  vitals: 'heart-circle-outline',
  medication: 'medkit-outline',
  prescription: 'document-text-outline',
};

const SEVERITY_BG: Record<string, string> = {
  urgent: '#EF5350',
  warning: '#F9A825',
  info: '#F9A825',
  none: '#00BFA5',
};

const SEVERITY_LABEL: Record<string, string> = {
  urgent: 'Alert',
  warning: 'Watch',
  info: 'Watch',
  none: 'Normal',
};

function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr);
  const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const time = `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
  return `${DAY[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}  ·  ${time}`;
}

function formatKey(k: string): string {
  return k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildEntityRows(
  entities: Record<string, unknown>,
): Array<{ key: string; value: string }> {
  const rows: Array<{ key: string; value: string }> = [];
  const seen = new Set<string>();

  // Compose BP from the two component keys
  if (entities.bp_systolic != null && entities.bp_diastolic != null) {
    rows.push({ key: 'Blood Pressure', value: `${entities.bp_systolic}/${entities.bp_diastolic}` });
    seen.add('bp_systolic');
    seen.add('bp_diastolic');
  }

  // Blood sugar — try mmol then mgdl then approx
  const sugarKey = ['blood_sugar_mmol', 'blood_sugar_mgdl', 'blood_sugar_mmol_approx'].find(
    (k) => entities[k] != null,
  );
  if (sugarKey) {
    const unit = sugarKey.includes('mgdl') ? 'mg/dL' : 'mmol/L';
    rows.push({ key: 'Blood Sugar', value: `${entities[sugarKey]} ${unit}` });
    seen.add(sugarKey);
  }

  // Remaining keys
  for (const [k, v] of Object.entries(entities)) {
    if (!seen.has(k) && v != null && v !== '') {
      rows.push({ key: formatKey(k), value: String(v) });
    }
  }

  return rows;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HealthLogEntryScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<NeoSeniorAppStackParamList, 'HealthLogEntry'>>();
  const { logId } = route.params;

  const displayName = useAuthStore((s) => s.user?.displayName ?? '');

  const entryQ = useQuery({
    queryKey: ['healthLogEntry', logId],
    queryFn: () => getHealthLogEntry(logId),
  });
  const entry = entryQ.data;

  const initials = getInitials(displayName);
  const severityBg = entry ? (SEVERITY_BG[entry.escalationTier] ?? '#00BFA5') : '#00BFA5';
  const severityLabel = entry ? (SEVERITY_LABEL[entry.escalationTier] ?? 'Normal') : '';
  const entityRows = entry?.extractedEntities
    ? buildEntityRows(entry.extractedEntities)
    : [];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={Brand.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Log Entry</Text>
        </View>
        <View style={styles.userCluster}>
          {displayName ? (
            <Text style={styles.headerName} numberOfLines={1}>{displayName.trim()}</Text>
          ) : null}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials || '?'}</Text>
          </View>
        </View>
      </View>

      {entryQ.isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Brand.primary} />
        </View>
      ) : entryQ.isError || !entry ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{getApiErrorMessage(entryQ.error)}</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        >
          {/* Title row — type + timestamp + tier badge */}
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <View style={styles.typeIconBox}>
                <Ionicons
                  name={LOG_ICON[entry.logType] ?? 'document-outline'}
                  size={20}
                  color={Brand.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.logTypeLabel}>
                  {LOG_LABEL[entry.logType] ?? t(`logEntry.type_${entry.logType}`)}
                </Text>
                <Text style={styles.timestamp}>{formatDateTime(entry.loggedAt)}</Text>
              </View>
            </View>
            <View style={[styles.severityBadge, { backgroundColor: severityBg }]}>
              <Text style={styles.severityText}>{severityLabel}</Text>
            </View>
          </View>

          {/* Main record card — amber header + white body, same as monitoring log detail */}
          <View style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <Text style={styles.recordHeaderText}>AI Summary</Text>
            </View>
            <View style={styles.recordBody}>
              <Text style={styles.summaryText}>{entry.aiSummary}</Text>
            </View>
          </View>

          {/* Escalation block */}
          {entry.escalationReason && (
            <View style={styles.escalationCard}>
              <Ionicons name="warning" size={18} color="#a3261f" style={{ marginTop: 1 }} />
              <Text style={styles.escalationText}>{entry.escalationReason}</Text>
            </View>
          )}

          {/* Transcript section */}
          <Text style={styles.sectionLabel}>{t('logEntry.transcript')}</Text>
          {entry.rawTranscript ? (
            <View style={styles.transcriptCard}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={16}
                color={Brand.mutedTeal}
                style={styles.transcriptIcon}
              />
              <Text style={styles.transcriptText}>"{entry.rawTranscript}"</Text>
            </View>
          ) : (
            <View style={styles.noTranscriptCard}>
              <View style={styles.noTranscriptIconBox}>
                <Ionicons name="image-outline" size={26} color={Brand.mutedTeal} />
              </View>
              <Text style={styles.noTranscriptText}>{t('logEntry.noTranscript')}</Text>
            </View>
          )}

          {/* Extracted entities — formatted info rows */}
          {entityRows.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>{t('logEntry.details')}</Text>
              <View style={styles.entitiesCard}>
                {entityRows.map(({ key, value }, i) => (
                  <View
                    key={key}
                    style={[styles.entityRow, i < entityRows.length - 1 && styles.entityRowDivider]}
                  >
                    <Text style={styles.entityKey}>{key}</Text>
                    <Text style={styles.entityValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.bgCream },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    height: 64,
    backgroundColor: '#F5F1E5',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ROW_DIVIDER,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  headerTitle: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    fontWeight: '700',
    color: Brand.primary,
  },
  userCluster: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    color: Brand.primary,
    maxWidth: 100,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.accentPeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontFamily: Fonts.heading, fontSize: 13, color: Brand.primary },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  errorText: { fontFamily: Fonts.body, fontSize: FontSize.base, color: Colors.error, textAlign: 'center' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

  // Title row
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  titleLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  typeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF6E6',
    borderWidth: 1,
    borderColor: '#FFE6D5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logTypeLabel: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    fontWeight: '700',
    color: Brand.primary,
    marginBottom: 2,
  },
  timestamp: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Brand.mutedTeal,
  },
  severityBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    flexShrink: 0,
  },
  severityText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Main record card (amber header + white body — matches monitoring log detail)
  recordCard: {
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
  },
  recordHeader: {
    backgroundColor: '#FCE9B3',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  recordHeaderText: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Brand.primary,
  },
  recordBody: { backgroundColor: '#FFFFFF', padding: 16 },
  summaryText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Brand.primary,
  },

  // Escalation
  escalationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FBE7E7',
    borderWidth: 1,
    borderColor: 'rgba(163,38,31,0.2)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  escalationText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: '#a3261f',
    flex: 1,
  },

  // Section label
  sectionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Brand.mutedTeal,
    marginBottom: 10,
    marginTop: 6,
  },

  // Transcript card
  transcriptCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  transcriptIcon: { marginBottom: 8 },
  transcriptText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Brand.primary,
    fontStyle: 'italic',
  },
  noTranscriptCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  noTranscriptIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF6E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  noTranscriptText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Brand.mutedTeal,
    textAlign: 'center',
  },

  // Entities card — settings-style info rows
  entitiesCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  entityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 50,
    paddingVertical: 10,
    gap: 14,
  },
  entityRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: ROW_DIVIDER,
  },
  entityKey: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Brand.mutedTeal,
    flexShrink: 0,
  },
  entityValue: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    color: Brand.primary,
    textAlign: 'right',
    flexShrink: 1,
  },
});
