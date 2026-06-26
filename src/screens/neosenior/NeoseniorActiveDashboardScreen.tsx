import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from 'expo-audio';
import { BlurView } from 'expo-blur';

import { useAuthStore } from '../../store/auth.store';
import {
  getHealthLogs,
  HealthLogSummary,
  LogType,
} from '../../services/healthLogs.service';
import { getVitals, VitalReading } from '../../services/vitals.service';
import { VitalType } from '../../services/types';
import { useLogPipeline } from '../../hooks/useLogPipeline';
import { NeoSeniorAppStackParamList } from '../../navigation/types';
import { Brand, Fonts, FontSize } from '../../theme';
import Logo from '../../components/Logo';
import BrandAlert from '../../components/BrandAlert';
import ClassificationSheet from '../../components/ClassificationSheet';
import LoggingSheet from '../../components/LoggingSheet';

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

function computeStreaks(logs: HealthLogSummary[]): { current: number; longest: number } {
  if (!logs.length) return { current: 0, longest: 0 };

  const dateSet = new Set(
    logs.map((l) => new Date(l.loggedAt).toISOString().split('T')[0]),
  );
  const dates = Array.from(dateSet).sort();

  let maxRun = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    const diffDays =
      (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86_400_000;
    if (Math.round(diffDays) === 1) {
      run++;
      if (run > maxRun) maxRun = run;
    } else {
      run = 1;
    }
  }

  let current = 0;
  const d = new Date();
  while (true) {
    const ds = d.toISOString().split('T')[0];
    if (dateSet.has(ds)) {
      current++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return { current, longest: Math.max(maxRun, current) };
}

function latestOf(vitals: VitalReading[], type: VitalType): VitalReading | undefined {
  return vitals
    .filter((v) => v.vitalType === type)
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())[0];
}

interface VitalCard {
  label: string;
  value: string;
}

function deriveVitalsGrid(vitals: VitalReading[]): VitalCard[] {
  const sys = latestOf(vitals, 'bp_systolic');
  const dia = latestOf(vitals, 'bp_diastolic');
  const bpValue =
    sys && dia
      ? `${Math.round(sys.value)}/${Math.round(dia.value)}`
      : sys
      ? `${Math.round(sys.value)}/–`
      : '–';

  const sugar = latestOf(vitals, 'blood_sugar_mmol');
  const sugarValue = sugar ? `${sugar.value.toFixed(1)} mmol` : '–';

  const hr = latestOf(vitals, 'heart_rate_bpm') ?? latestOf(vitals, 'pulse_rate');
  const hrValue = hr ? `${Math.round(hr.value)} bpm` : '–';

  const spo2 = latestOf(vitals, 'spo2_pct');
  const spo2Value = spo2 ? `${Math.round(spo2.value)}%` : '–';

  return [
    { label: 'Blood Pressure:', value: bpValue },
    { label: 'Blood Sugar:', value: sugarValue },
    { label: 'Heart Rate:', value: hrValue },
    { label: 'SpO₂:', value: spo2Value },
  ];
}

// ─── Log row ──────────────────────────────────────────────────────────────────

const LOG_ICON: Record<LogType, React.ComponentProps<typeof Ionicons>['name']> = {
  symptom: 'create-outline',
  vitals: 'heart-circle-outline',
  medication: 'medkit-outline',
  prescription: 'document-text-outline',
};

function LogRow({
  log,
  isLast,
  onViewPress,
}: {
  log: HealthLogSummary;
  isLast: boolean;
  onViewPress: () => void;
}) {
  const icon = LOG_ICON[log.logType] ?? 'ellipse-outline';
  return (
    <View style={[logStyles.row, isLast && logStyles.rowLast]}>
      <View style={logStyles.rowLeft}>
        <View style={logStyles.iconBox}>
          <Ionicons name={icon} size={16} color="#FF2D2D" />
        </View>
        <Text style={logStyles.desc} numberOfLines={1}>
          {log.aiSummary}
        </Text>
      </View>
      <Pressable
        onPress={onViewPress}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel={`View: ${log.aiSummary}`}
      >
        <Text style={logStyles.viewLink}>view</Text>
      </Pressable>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NeoseniorActiveDashboardScreen() {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const lang = useAuthStore((s) => s.user?.language ?? 'en');
  const displayName = useAuthStore((s) => s.user?.displayName ?? '');
  const navigation = useNavigation<NativeStackNavigationProp<NeoSeniorAppStackParamList>>();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [fabOpen, setFabOpen] = useState(false);
  const [cameraDeniedVisible, setCameraDeniedVisible] = useState(false);
  const [sheetMode, setSheetMode] = useState<'audio' | 'photo' | null>(null);

  // ── Audio recording ───────────────────────────────────────────────────────
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  // 80 ms tick — fast enough for a smooth waveform without thrashing the thread
  const recorderState = useAudioRecorderState(recorder, 80);
  const micGranted = useRef(false);
  const recording = recorderState.isRecording;

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      micGranted.current = status.granted;
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    })();
  }, []);

  // ── Data queries ──────────────────────────────────────────────────────────
  const logsQ = useQuery({
    queryKey: ['healthLogs', userId],
    queryFn: () => getHealthLogs(userId, { limit: 50 }),
    enabled: !!userId,
  });

  const vitalsQ = useQuery({
    queryKey: ['vitals', userId],
    queryFn: () => getVitals(userId, { limit: 20 }),
    enabled: !!userId,
  });

  // ── Pipeline ──────────────────────────────────────────────────────────────
  const pipeline = useLogPipeline(() => {
    logsQ.refetch();
    vitalsQ.refetch();
  });
  const sheetVisible = recording || pipeline.status !== 'idle';

  // ── Recording sheet handlers ───────────────────────────────────────────────
  const handleMicCardPress = async () => {
    setFabOpen(false);
    if (sheetVisible) return;
    let granted = micGranted.current;
    if (!granted) {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      granted = status.granted;
      micGranted.current = granted;
    }
    if (!granted) return;
    setSheetMode('audio');
    pipeline.reset();
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const handleCameraCardPress = async () => {
    setFabOpen(false);
    if (sheetVisible) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { setCameraDeniedVisible(true); return; }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled && res.assets?.length) {
      const asset = res.assets[0];
      setSheetMode('photo');
      pipeline.reset();
      pipeline.start({
        jobType: 'photo_auto',
        fileUri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        lang,
      });
    }
  };

  const handleStopRecording = useCallback(async () => {
    await recorder.stop();
    const uri = recorder.uri;
    if (uri) {
      pipeline.start({ jobType: 'audio_transcribe', fileUri: uri, mimeType: 'audio/m4a', lang });
    }
  }, [recorder, pipeline, lang]);

  const handleSheetClose = useCallback(async () => {
    if (recording) {
      try { await recorder.stop(); } catch {}
    }
    pipeline.reset();
    setSheetMode(null);
  }, [recording, recorder, pipeline]);

  // Reset sheetMode when pipeline goes idle (after done auto-dismiss).
  useEffect(() => {
    if (pipeline.status === 'idle') setSheetMode(null);
  }, [pipeline.status]);

  // FAB: opens action menu — not available while sheet is up.
  const handleFabPress = () => {
    if (sheetVisible) return;
    setFabOpen((o) => !o);
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const logs = logsQ.data?.logs ?? [];
  const vitals = vitalsQ.data?.vitals ?? [];
  const { current: streakDays, longest: longestDays } = useMemo(() => computeStreaks(logs), [logs]);
  const vitalsGrid = useMemo(() => deriveVitalsGrid(vitals), [vitals]);
  const recentLogs = logs.slice(0, 8);

  const displayLabel = displayName.trim();
  const initials = getInitials(displayName);
  const isLoading = logsQ.isLoading && vitalsQ.isLoading;
  const isRefreshing = logsQ.isRefetching || vitalsQ.isRefetching;

  // FAB icon / color — FAB is only shown when sheet is not visible
  const fabIcon: React.ComponentProps<typeof Ionicons>['name'] = fabOpen ? 'close' : 'add';
  const fabInnerBg = Brand.primary;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* A. Header */}
      <View style={styles.header}>
        <Logo />
        <View style={styles.userCluster}>
          {displayLabel ? (
            <Text style={styles.userName} numberOfLines={1}>{displayLabel}</Text>
          ) : null}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials || '?'}</Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Brand.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => { logsQ.refetch(); vitalsQ.refetch(); }}
              tintColor={Brand.primary}
            />
          }
        >
          {/* B. Streak card */}
          <View style={styles.streakCard}>
            <View style={styles.ringWrapper}>
              <View style={styles.streakRing}>
                <Text style={styles.streakNum}>{streakDays}</Text>
                <Text style={styles.streakDayWord}>Days</Text>
              </View>
              <View style={styles.flameBadge}>
                <Ionicons name="flame" size={13} color="#FF2D2D" />
              </View>
            </View>
            <View style={styles.streakInfo}>
              <Text style={styles.streakTitle}>You've been monitoring</Text>
              <Text style={styles.streakSubtitle}>
                You've added a new entry every day of the week for the past week
              </Text>
              <View style={styles.badgeRow}>
                <View style={styles.badgePink}>
                  <Text style={styles.badgePinkText}>Longest Streak</Text>
                </View>
                <View style={styles.badgeDark}>
                  <Text style={styles.badgeDarkText}>{longestDays} days</Text>
                </View>
              </View>
            </View>
          </View>

          {/* C. Core vitals */}
          <View style={styles.vitalsSection}>
            <Text style={styles.sectionTitle}>Core Vitals :</Text>
            <View style={styles.vitalsGrid}>
              {vitalsGrid.map((item) => (
                <View key={item.label} style={styles.vitalCard}>
                  <Text style={styles.vitalLabel} numberOfLines={1}>{item.label}</Text>
                  <Text style={styles.vitalValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* D. Symptom & activity records */}
          <View style={styles.logSection}>
            <Text style={styles.sectionTitle}>Symptom & Activity Records</Text>
            {recentLogs.length > 0 ? (
              <View style={styles.logCard}>
                {recentLogs.map((log, idx) => (
                  <LogRow
                    key={log.id}
                    log={log}
                    isLast={idx === recentLogs.length - 1}
                    onViewPress={() =>
                      navigation.navigate('HealthLogEntry', { logId: log.id })
                    }
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.emptyLogs}>No activity recorded yet.</Text>
            )}
          </View>
        </ScrollView>
      )}

      {/* FAB overlay — hidden while logging sheet is up ─────────────── */}
      {!sheetVisible && fabOpen && (
        <>
          <Pressable
            style={[StyleSheet.absoluteFill, styles.backdrop]}
            onPress={() => setFabOpen(false)}
            accessible={false}
          >
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          </Pressable>

          <View style={styles.fabMenu} pointerEvents="box-none">
            <Pressable
              style={({ pressed }) => [styles.fabMenuCard, pressed && { opacity: 0.8 }]}
              onPress={handleCameraCardPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Take a picture of your vitals or prescription"
            >
              <View style={styles.fabMenuIconCircle}>
                <Ionicons name="camera-outline" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.fabMenuText}>
                Tap to take a picture of your vitals or prescription
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.fabMenuCard, pressed && { opacity: 0.8 }]}
              onPress={handleMicCardPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Record your symptoms"
            >
              <View style={styles.fabMenuIconCircle}>
                <Ionicons name="mic-outline" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.fabMenuText}>
                How are you feeling today? Record your symptoms
              </Text>
            </Pressable>
          </View>
        </>
      )}

      {/* FAB button — hidden while logging sheet is up ──────────────────── */}
      {!sheetVisible && (
        <Pressable
          style={({ pressed }) => [styles.fabOuter, pressed && { opacity: 0.85 }]}
          onPress={handleFabPress}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={fabOpen ? 'Close menu' : 'Add new health log'}
        >
          <View style={[styles.fabInner, { backgroundColor: fabInnerBg }]}>
            <Ionicons name={fabIcon} size={28} color="#FFFFFF" />
          </View>
        </Pressable>
      )}

      <BrandAlert
        visible={cameraDeniedVisible}
        title="Camera access denied"
        message="Please enable camera access in your device settings to capture vitals."
        onDismiss={() => setCameraDeniedVisible(false)}
      />
      <ClassificationSheet
        visible={pipeline.status === 'needs_classification'}
        onSelect={(c) => pipeline.classify(c)}
        onCancel={pipeline.reset}
      />
      <LoggingSheet
        visible={sheetVisible}
        recording={recording}
        mode={sheetMode ?? 'audio'}
        meteringLevel={recorderState.metering}
        pipeline={pipeline}
        onStopRecording={handleStopRecording}
        onClose={handleSheetClose}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.bgCream },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 64,
    backgroundColor: '#F5F1E5',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EFEBE4',
  },
  userCluster: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  userName: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Brand.primary,
    maxWidth: 120,
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
  scrollContent: { paddingBottom: 100 },

  // B. Streak card
  streakCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Brand.mutedTeal,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  ringWrapper: { alignItems: 'center' },
  streakRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: Brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakNum: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    fontWeight: '700',
    color: Brand.primary,
    lineHeight: 24,
  },
  streakDayWord: { fontFamily: Fonts.heading, fontSize: 11, fontWeight: '600', color: Brand.primary },
  flameBadge: {
    marginTop: -11,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F7EFE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakInfo: { flex: 1, marginLeft: 16 },
  streakTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Brand.primary,
  },
  streakSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Brand.mutedTeal,
    lineHeight: 16,
    marginTop: 2,
  },
  badgeRow: { flexDirection: 'row', marginTop: 8, gap: 6 },
  badgePink: { backgroundColor: '#FFC1C1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgePinkText: { fontFamily: Fonts.bodySemiBold, fontSize: 11, fontWeight: '600', color: '#FF2D2D' },
  badgeDark: { backgroundColor: Brand.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeDarkText: { fontFamily: Fonts.bodySemiBold, fontSize: 11, fontWeight: '600', color: '#FFFFFF' },

  // C. Vitals
  vitalsSection: { marginHorizontal: 20 },
  sectionTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Brand.primary,
    marginBottom: 12,
  },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  vitalCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE6D5',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 54,
  },
  vitalLabel: { fontFamily: Fonts.body, fontSize: FontSize.sm, color: Brand.mutedTeal, flex: 1 },
  vitalValue: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Brand.primary,
    marginLeft: 4,
  },

  // D. Log section
  logSection: { marginHorizontal: 20, marginTop: 24 },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE6D5',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  emptyLogs: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.mutedTeal,
    textAlign: 'center',
    marginTop: 8,
  },

  // Blur backdrop
  backdrop: { zIndex: 50 },

  // FAB overlay cards
  fabMenu: {
    position: 'absolute',
    // 96 (FAB bottom offset) + 76 (FAB outer height) + 16 (gap) = 188
    bottom: 188,
    left: 20,
    right: 20,
    gap: 12,
    zIndex: 51,
  },
  fabMenuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE6D5',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  fabMenuIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.accentPeach,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabMenuText: {
    flex: 1,
    marginLeft: 16,
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    color: Brand.primary,
    lineHeight: 18,
  },

  // FAB button
  fabOuter: {
    position: 'absolute',
    bottom: 96,
    right: 20,
    zIndex: 99,
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F7EFE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const logStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 54,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEBE4',
  },
  rowLast: { borderBottomWidth: 0 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  desc: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.primary,
    marginLeft: 12,
    flex: 1,
  },
  viewLink: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#FF2D2D',
    textDecorationLine: 'underline',
  },
});
