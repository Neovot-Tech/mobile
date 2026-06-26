/**
 * LoggingSheet — slides up over the NeoSenior dashboard during recording
 * and post-recording states.
 *
 * Two visual shells:
 *   - Small (recording): compact bottom sheet with live waveform + stop button.
 *   - Large (all post-recording states): tall sheet from ~top of content to bottom.
 *
 * Two modes:
 *   - 'audio': shows transcript + triage questions
 *   - 'photo': shows extracted vitals + AI feedback + triage questions
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getHealthLogEntry, HealthLogEntry } from '../services/healthLogs.service';
import { TriageFollowup, TriageAnswer } from '../services/types';
import { PipelineStatus } from '../hooks/useLogPipeline';
import { Brand, Fonts, FontSize } from '../theme';

// ─── Waveform constants ───────────────────────────────────────────────────────

const STATIC_BARS = [
  40, 55, 30, 70, 45, 20, 60, 40, 50, 75, 85, 35, 55, 30, 25,
  40, 35, 20, 42, 50, 55, 62, 70, 38, 65, 42, 68, 60, 45, 30,
  35, 28, 75, 48, 60, 52, 60,
];
const BAR_COUNT = STATIC_BARS.length; // 37

function dbToHeight(db: number): number {
  const clamped = Math.max(-60, Math.min(0, db));
  return Math.max(4, Math.round(((clamped + 60) / 60) * 110));
}

// ─── Waveform component ───────────────────────────────────────────────────────

function WaveformVisualizer({ heights }: { heights: readonly number[] }) {
  return (
    <View style={waveStyles.row}>
      {heights.map((h, i) => (
        <View key={i} style={[waveStyles.bar, { height: Math.max(4, h) }]} />
      ))}
    </View>
  );
}

const waveStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 110,
    marginVertical: 32,
  },
  bar: {
    width: 3,
    marginHorizontal: 2.5,
    backgroundColor: '#FCD19C',
    borderRadius: 1.5,
  },
});

// ─── Vitals metric row (photo mode) ──────────────────────────────────────────

interface VitalCard {
  label: string;
  value: string;
}

function extractVitalCards(entities?: Record<string, unknown>): VitalCard[] {
  if (!entities) return [];
  const cards: VitalCard[] = [];

  const sys = typeof entities.bp_systolic === 'number' ? entities.bp_systolic : null;
  const dia = typeof entities.bp_diastolic === 'number' ? entities.bp_diastolic : null;
  if (sys !== null || dia !== null) {
    const v =
      sys !== null && dia !== null
        ? `${sys}/${dia}`
        : sys !== null
          ? `${sys}/–`
          : `–/${dia}`;
    cards.push({ label: 'Blood Pressure:', value: v });
  }

  const hr = typeof entities.heart_rate_bpm === 'number' ? entities.heart_rate_bpm : null;
  if (hr !== null) cards.push({ label: 'Heart Rate:', value: `${hr} bpm` });

  const sugar = typeof entities.blood_sugar_mmol === 'number' ? entities.blood_sugar_mmol : null;
  if (sugar !== null) cards.push({ label: 'Blood Sugar:', value: `${(sugar as number).toFixed(1)} mmol` });

  const spo2 = typeof entities.spo2_pct === 'number' ? entities.spo2_pct : null;
  if (spo2 !== null) cards.push({ label: 'SpO₂:', value: `${spo2}%` });

  return cards.slice(0, 2);
}

function VitalsMetricRow({ entities }: { entities?: Record<string, unknown> }) {
  const cards = extractVitalCards(entities);
  if (cards.length === 0) return null;
  return (
    <View style={vitalsStyles.row}>
      {cards.map((card, i) => (
        <View
          key={card.label}
          style={[vitalsStyles.card, i < cards.length - 1 && vitalsStyles.cardGap]}
        >
          <Text style={vitalsStyles.label}>{card.label}</Text>
          <Text style={vitalsStyles.value}>{card.value}</Text>
        </View>
      ))}
    </View>
  );
}

const vitalsStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE6C2',
    borderRadius: 12,
    padding: 12,
  },
  cardGap: {
    marginRight: 12,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: '#708090',
    marginBottom: 4,
  },
  value: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    fontWeight: '700',
    color: '#053540',
  },
});

// ─── Answer chip ──────────────────────────────────────────────────────────────

function AnswerChip({
  label,
  selected,
  onPress,
  checkBadge = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  checkBadge?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[chipStyles.chip, selected && chipStyles.chipSelected]}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
    >
      <View style={[chipStyles.radio, selected && chipStyles.radioSelected]} />
      <Text style={chipStyles.label}>{label}</Text>
      {selected && (
        checkBadge ? (
          <View style={chipStyles.checkBadge}>
            <Text style={chipStyles.checkBadgeText}>✓</Text>
          </View>
        ) : (
          <View style={chipStyles.dotBadge} />
        )
      )}
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCE9B3',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  radio: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#053540',
    marginRight: 6,
    backgroundColor: 'transparent',
  },
  radioSelected: {
    backgroundColor: '#053540',
    borderColor: '#053540',
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.primary,
  },
  dotBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#FCE9B3',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#000000',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 14,
    alignItems: 'center',
  },
  checkBadgeText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

// ─── Props ────────────────────────────────────────────────────────────────────

export interface LoggingSheetPipelineHandle {
  status: PipelineStatus;
  error?: string;
  resultLogId?: string;
  triageFollowup?: TriageFollowup;
  answerTriage: (answers: TriageAnswer[]) => Promise<void>;
  skipTriage: () => void;
  reset: () => void;
}

interface LoggingSheetProps {
  visible: boolean;
  recording: boolean;
  mode: 'audio' | 'photo';
  /** Current metering level in dBFS from the audio recorder. Updated ~80ms. */
  meteringLevel?: number;
  pipeline: LoggingSheetPipelineHandle;
  onStopRecording: () => Promise<void>;
  onClose: () => void;
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

export default function LoggingSheet({
  visible,
  recording,
  mode,
  meteringLevel,
  pipeline,
  onStopRecording,
  onClose,
}: LoggingSheetProps) {
  const insets = useSafeAreaInsets();

  // ── Live waveform buffer ───────────────────────────────────────────────────
  const [liveBarHeights, setLiveBarHeights] = useState<number[]>(
    () => new Array(BAR_COUNT).fill(8),
  );

  useEffect(() => {
    if (!recording) {
      setLiveBarHeights(new Array(BAR_COUNT).fill(8));
      return;
    }
    if (meteringLevel === undefined) return;
    const h = dbToHeight(meteringLevel);
    setLiveBarHeights((prev) => [...prev.slice(1), h]);
  }, [meteringLevel, recording]);

  // ── Health log entry fetch ─────────────────────────────────────────────────
  // Fetched whenever we have a resultLogId (triage_pending or done).
  // Provides rawTranscript (audio) and extractedEntities + aiSummary (photo).
  const [logEntry, setLogEntry] = useState<HealthLogEntry | undefined>();
  const [logEntryLoading, setLogEntryLoading] = useState(false);
  const fetchedLogId = useRef<string | null>(null);

  useEffect(() => {
    const logId = pipeline.resultLogId;
    if (!logId || logId === fetchedLogId.current) return;
    if (pipeline.status !== 'triage_pending' && pipeline.status !== 'done') return;

    fetchedLogId.current = logId;
    setLogEntryLoading(true);
    getHealthLogEntry(logId)
      .then((entry) => setLogEntry(entry))
      .catch(() => setLogEntry(undefined))
      .finally(() => setLogEntryLoading(false));
  }, [pipeline.status, pipeline.resultLogId]);

  // ── Triage answers ─────────────────────────────────────────────────────────
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSelect = useCallback((question: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [question]: option }));
  }, []);

  const handleNext = useCallback(async () => {
    const questions = pipeline.triageFollowup?.questions ?? [];
    const formatted: TriageAnswer[] = questions.map((q) => ({
      question: q.question,
      answer: answers[q.question] ?? q.options[0] ?? '',
    }));
    await pipeline.answerTriage(formatted);
  }, [pipeline, answers]);

  const handleCancel = useCallback(() => {
    if (
      pipeline.status === 'triage_pending' ||
      pipeline.status === 'triage_check'
    ) {
      pipeline.skipTriage();
    } else {
      onClose();
    }
  }, [pipeline, onClose]);

  // ── Reset on close ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) {
      setAnswers({});
      setLogEntry(undefined);
      fetchedLogId.current = null;
    }
  }, [visible]);

  if (!visible) return null;

  const { status } = pipeline;
  const isLargeSheet = !recording;

  const isProcessing =
    status === 'uploading' ||
    status === 'processing' ||
    status === 'triage_check' ||
    status === 'needs_classification';
  const isTriage = status === 'triage_pending';
  const isDone = status === 'done';
  const isError = status === 'error';

  const bottomPad = Math.max(insets.bottom, 24);

  // Derived log data
  const transcript = logEntry?.rawTranscript ?? logEntry?.aiSummary;
  const aiSummary = logEntry?.aiSummary;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Pressable
        style={styles.backdrop}
        onPress={isDone || isError ? () => pipeline.reset() : undefined}
        accessible={false}
      />

      {/* ── Small shell: recording ──────────────────────────────────────────── */}
      {!isLargeSheet && (
        <View style={[styles.sheetSmall, { paddingBottom: bottomPad }]}>
          <View style={styles.handle} />
          <Text style={styles.recordingTitle}>How are you feeling today?</Text>
          <Text style={styles.recordingHint}>Tap stop when you're done speaking</Text>
          <WaveformVisualizer heights={liveBarHeights} />
          <Pressable
            style={styles.stopBtn}
            onPress={onStopRecording}
            accessibilityRole="button"
            accessibilityLabel="Stop recording"
          >
            <Ionicons name="stop-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.stopBtnText}>Stop Recording</Text>
          </Pressable>
        </View>
      )}

      {/* ── Large shell: post-recording ─────────────────────────────────────── */}
      {isLargeSheet && (
        <View style={[styles.sheetLarge, { paddingBottom: bottomPad }]}>
          <View style={styles.handle} />

          {/* Processing ───────────────────────────────────────────────────── */}
          {isProcessing && (
            <View style={styles.processingBox}>
              <Text style={styles.sheetTitle}>
                {status === 'uploading'
                  ? mode === 'photo'
                    ? 'Saving your image…'
                    : 'Saving your recording…'
                  : mode === 'photo'
                    ? 'Analysing your reading…'
                    : 'Understanding what you said…'}
              </Text>
              <WaveformVisualizer heights={STATIC_BARS} />
              <ActivityIndicator size="large" color={Brand.primary} />
            </View>
          )}

          {/* ── Audio triage ────────────────────────────────────────────────── */}
          {isTriage && mode === 'audio' && pipeline.triageFollowup && (
            <>
              <Text style={styles.contextTitle}>You said :</Text>

              <ScrollView
                style={styles.questionnaireScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                <View style={styles.transcriptCard}>
                  {logEntryLoading ? (
                    <ActivityIndicator size="small" color={Brand.primary} />
                  ) : transcript ? (
                    <Text style={[styles.transcriptText, { paddingBottom: 16 }]}>
                      {transcript}
                    </Text>
                  ) : null}

                  {pipeline.triageFollowup.questions.map((q, qi) => (
                    <View key={qi}>
                      <View style={styles.divider} />
                      <Text style={styles.questionLabel}>{q.question}</Text>
                      <View style={styles.chipsRow}>
                        {q.options.map((opt) => (
                          <AnswerChip
                            key={opt}
                            label={opt}
                            selected={answers[q.question] === opt}
                            onPress={() => handleSelect(q.question, opt)}
                          />
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <WaveformVisualizer heights={STATIC_BARS} />

              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.actionBtn, styles.actionBtnOutline]}
                  onPress={handleCancel}
                  accessibilityRole="button"
                  accessibilityLabel="Skip follow-up questions"
                >
                  <Text style={[styles.actionBtnText, styles.actionBtnTextOutline]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.actionBtnFilled]}
                  onPress={handleNext}
                  accessibilityRole="button"
                  accessibilityLabel="Submit answers"
                >
                  <Text style={[styles.actionBtnText, styles.actionBtnTextFilled]}>
                    Next
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {/* ── Photo triage ────────────────────────────────────────────────── */}
          {isTriage && mode === 'photo' && pipeline.triageFollowup && (
            <>
              <Text style={styles.contextTitle}>You Captured this :</Text>

              <ScrollView
                style={styles.questionnaireScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {logEntryLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={Brand.primary}
                    style={{ marginBottom: 16 }}
                  />
                ) : (
                  <VitalsMetricRow entities={logEntry?.extractedEntities} />
                )}

                <View style={styles.transcriptCard}>
                  {aiSummary ? (
                    <>
                      <Text style={[styles.transcriptText, { paddingBottom: 16 }]}>
                        {aiSummary}
                      </Text>
                      <View style={styles.divider} />
                    </>
                  ) : null}

                  {pipeline.triageFollowup.questions.map((q, qi) => (
                    <View key={qi}>
                      {qi > 0 && <View style={styles.divider} />}
                      <Text style={styles.questionLabel}>{q.question}</Text>
                      <View style={styles.chipsRow}>
                        {q.options.map((opt) => (
                          <AnswerChip
                            key={opt}
                            label={opt}
                            selected={answers[q.question] === opt}
                            onPress={() => handleSelect(q.question, opt)}
                            checkBadge
                          />
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <WaveformVisualizer heights={STATIC_BARS} />

              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.actionBtn, styles.actionBtnOutline]}
                  onPress={handleCancel}
                  accessibilityRole="button"
                  accessibilityLabel="Skip follow-up questions"
                >
                  <Text style={[styles.actionBtnText, styles.actionBtnTextOutline]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.actionBtnFilled]}
                  onPress={handleNext}
                  accessibilityRole="button"
                  accessibilityLabel="Submit answers"
                >
                  <Text style={[styles.actionBtnText, styles.actionBtnTextFilled]}>
                    Next
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {/* ── Audio result ────────────────────────────────────────────────── */}
          {isDone && mode === 'audio' && (
            <>
              <Text style={styles.contextTitle}>You said :</Text>

              <ScrollView
                style={styles.questionnaireScroll}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.transcriptCard}>
                  {logEntryLoading ? (
                    <ActivityIndicator size="small" color={Brand.primary} />
                  ) : transcript ? (
                    <Text style={styles.transcriptText}>{transcript}</Text>
                  ) : (
                    <Text style={[styles.transcriptText, styles.transcriptMuted]}>
                      Your update has been saved.
                    </Text>
                  )}
                </View>

                <View style={styles.savedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#2E7D52" />
                  <Text style={styles.savedBadgeText}>Your update is saved.</Text>
                </View>
              </ScrollView>

              <WaveformVisualizer heights={STATIC_BARS} />

              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.actionBtn, styles.actionBtnFilled, { flex: 1 }]}
                  onPress={() => pipeline.reset()}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Text style={[styles.actionBtnText, styles.actionBtnTextFilled]}>
                    Close
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {/* ── Photo result ────────────────────────────────────────────────── */}
          {isDone && mode === 'photo' && (
            <>
              <Text style={styles.contextTitle}>You Captured this :</Text>

              <ScrollView
                style={styles.questionnaireScroll}
                showsVerticalScrollIndicator={false}
              >
                {logEntryLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={Brand.primary}
                    style={{ marginBottom: 16 }}
                  />
                ) : (
                  <VitalsMetricRow entities={logEntry?.extractedEntities} />
                )}

                {aiSummary ? (
                  <View style={[styles.transcriptCard, { marginTop: 4 }]}>
                    <Text style={styles.transcriptText}>{aiSummary}</Text>
                  </View>
                ) : null}

                <View style={styles.savedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#2E7D52" />
                  <Text style={styles.savedBadgeText}>Your reading is saved.</Text>
                </View>
              </ScrollView>

              <WaveformVisualizer heights={STATIC_BARS} />

              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.actionBtn, styles.actionBtnFilled, { flex: 1 }]}
                  onPress={() => pipeline.reset()}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Text style={[styles.actionBtnText, styles.actionBtnTextFilled]}>
                    Close
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {/* ── Error ───────────────────────────────────────────────────────── */}
          {isError && (
            <View style={styles.errorBox}>
              <Ionicons name="warning-outline" size={36} color="#E8442E" />
              <Text style={styles.errorText}>
                {pipeline.error ?? 'Something went wrong. Please try again.'}
              </Text>
              <View style={[styles.actionRow, { marginTop: 16 }]}>
                <Pressable
                  style={[styles.actionBtn, styles.actionBtnFilled, { flex: 1 }]}
                  onPress={onClose}
                  accessibilityRole="button"
                >
                  <Text style={[styles.actionBtnText, styles.actionBtnTextFilled]}>
                    Close
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 53, 64, 0.58)',
  },

  sheetSmall: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAF9F5',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 16,
    shadowColor: '#003B46',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 20,
  },

  sheetLarge: {
    position: 'absolute',
    top: 72,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAF9F5',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 16,
    shadowColor: '#003B46',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 20,
  },

  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DEDED8',
    marginBottom: 20,
  },

  // ── Recording shell ───────────────────────────────────────────────────────
  recordingTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Brand.primary,
    marginBottom: 6,
  },
  recordingHint: {
    fontFamily: Fonts.body,
    fontSize: FontSize.base,
    color: Brand.mutedTeal,
    lineHeight: 22,
    marginBottom: 4,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E31C25',
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 8,
    minHeight: 56,
  },
  stopBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ── Processing shell ──────────────────────────────────────────────────────
  processingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32,
  },
  sheetTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Brand.primary,
    textAlign: 'center',
    marginBottom: 8,
  },

  // ── Triage / Result shell ─────────────────────────────────────────────────
  contextTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.base,
    fontWeight: '700',
    color: '#053540',
    marginBottom: 12,
  },
  questionnaireScroll: {
    flex: 1,
  },
  transcriptCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE6C2',
    borderRadius: 12,
    padding: 16,
  },
  transcriptText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: '#053540',
    lineHeight: 22,
  },
  transcriptMuted: {
    color: Brand.mutedTeal,
  },
  divider: {
    height: 1,
    backgroundColor: '#FDF0DD',
    marginVertical: 14,
  },
  questionLabel: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    color: '#053540',
    marginTop: 16,
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // ── Saved badge ───────────────────────────────────────────────────────────
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  savedBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.base,
    color: '#2E7D52',
  },

  // ── Action buttons ────────────────────────────────────────────────────────
  actionRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  actionBtnOutline: {
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#7A9894',
  },
  actionBtnFilled: {
    backgroundColor: '#053540',
  },
  actionBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    fontWeight: '600',
  },
  actionBtnTextOutline: { color: '#053540' },
  actionBtnTextFilled: { color: '#FFFFFF' },

  // ── Error ─────────────────────────────────────────────────────────────────
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.base,
    color: Brand.primary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
