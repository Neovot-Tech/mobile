import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from 'expo-audio';
import { useQuery } from '@tanstack/react-query';
import Svg, { Path, Line } from 'react-native-svg';

import { useAuthStore } from '../../store/auth.store';
import { useLogPipeline } from '../../hooks/useLogPipeline';
import { getLatestHealthLogs } from '../../services/healthLogs.service';
import { JobType } from '../../services/types';
import { Brand, Fonts, FontSize } from '../../theme';
import Logo from '../../components/Logo';
import BrandAlert from '../../components/BrandAlert';
import ClassificationSheet from '../../components/ClassificationSheet';
import LoggingSheet from '../../components/LoggingSheet';
import NeoseniorActiveDashboardScreen from './NeoseniorActiveDashboardScreen';

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

// ─── Empty state SVG graphic ──────────────────────────────────────────────────

function EmptyStateGraphic() {
  return (
    <Svg width={36} height={40} viewBox="0 0 36 40" fill="none">
      <Path
        d="M4 2H22L34 14V38C34 39.1 33.1 40 32 40H4C2.9 40 2 39.1 2 38V4C2 2.9 2.9 2 4 2Z"
        stroke="white"
        strokeWidth={2}
        fill="none"
      />
      <Path d="M22 2L34 14H22V2Z" stroke="white" strokeWidth={2} fill="none" />
      <Line x1={8} y1={21} x2={28} y2={21} stroke="white" strokeWidth={1.5} strokeDasharray="3 2" strokeLinecap="round" />
      <Line x1={8} y1={27} x2={28} y2={27} stroke="white" strokeWidth={1.5} strokeDasharray="3 2" strokeLinecap="round" />
      <Line x1={8} y1={33} x2={22} y2={33} stroke="white" strokeWidth={1.5} strokeDasharray="3 2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Health tips ──────────────────────────────────────────────────────────────

const HEALTH_TIPS = [
  'Your health can be properly managed, ensure to keep recording your vitals & health records',
  'Taking your medications at the same time daily helps your caregiver monitor your adherence and flag any concerns early',
  'A quick voice recording of how you feel today gives your care team valuable insight — even a few sentences helps',
  'Consistent blood pressure readings help your caregiver spot trends before they become problems',
  'After any doctor visit, snap a photo of your prescription so your records are always up to date',
] as const;

// ─── Empty state content ──────────────────────────────────────────────────────
// Rendered only when the senior has no health logs yet. `onLogSuccess` is called
// once the pipeline confirms a new log was created, which triggers the switcher
// to re-check and transition to the active dashboard.

function EmptyDashboard({ onLogSuccess }: { onLogSuccess: () => void }) {
  const insets = useSafeAreaInsets();
  const displayName = useAuthStore((s) => s.user?.displayName ?? '');
  const lang = useAuthStore((s) => s.user?.language ?? 'en');

  const [tipIndex, setTipIndex] = useState(0);
  const [cameraDeniedVisible, setCameraDeniedVisible] = useState(false);
  const [sheetMode, setSheetMode] = useState<'audio' | 'photo' | null>(null);

  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recorderState = useAudioRecorderState(recorder, 80);
  const micGranted = useRef(false);

  const pipeline = useLogPipeline(onLogSuccess);
  const recording = recorderState.isRecording;
  const sheetVisible = recording || pipeline.status !== 'idle';

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      micGranted.current = status.granted;
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    })();
  }, []);

  useEffect(() => {
    if (pipeline.status === 'idle') setSheetMode(null);
  }, [pipeline.status]);

  const handleMicPress = async () => {
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

  const handleCameraPress = async () => {
    if (sheetVisible) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { setCameraDeniedVisible(true); return; }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled && res.assets?.length) {
      const asset = res.assets[0];
      setSheetMode('photo');
      pipeline.reset();
      pipeline.start({
        jobType: 'photo_auto' as JobType,
        fileUri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        lang,
      });
    }
  };

  const handleStopRecording = async () => {
    await recorder.stop();
    const uri = recorder.uri;
    if (uri) {
      pipeline.start({ jobType: 'audio_transcribe', fileUri: uri, mimeType: 'audio/m4a', lang });
    }
  };

  const handleSheetClose = async () => {
    if (recording) {
      try { await recorder.stop(); } catch {}
    }
    pipeline.reset();
    setSheetMode(null);
  };

  const displayLabel = displayName.trim();
  const initials = getInitials(displayName);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Header */}
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Alert banner */}
        <View style={styles.alertCard}>
          <Text style={styles.alertText}>{HEALTH_TIPS[tipIndex]}</Text>
          <Pressable
            onPress={() => setTipIndex((i) => (i + 1) % HEALTH_TIPS.length)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Next tip"
          >
            <Text style={styles.alertLink}>next ..</Text>
          </Pressable>
        </View>

        {/* Empty state module */}
        <View style={styles.emptyModule}>
          <View style={styles.haloRing}>
            <View style={styles.innerCircle}>
              <EmptyStateGraphic />
            </View>
          </View>
          <Text style={styles.emptyTitle}>no records found</Text>
          <View style={styles.dashedDivider} />
          <Text style={styles.emptySubtitle}>
            Start adding your vitals or record your symptoms below
          </Text>
        </View>

        {/* Action cards */}
        <View style={styles.actionCards}>
          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
            onPress={handleCameraPress}
            disabled={sheetVisible}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Take a picture of your vitals or prescription"
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="camera-outline" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>
              Tap to take a picture of your vitals or prescription
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
            onPress={handleMicPress}
            disabled={sheetVisible}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="How are you feeling today? Record your symptoms"
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="mic-outline" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>
              How are you feeling today? Record your symptoms
            </Text>
          </Pressable>
        </View>
      </ScrollView>

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

// ─── Switcher (the registered tab screen) ─────────────────────────────────────
// Calls GET /health-logs/{userId}/latest (§5 of handover — no consent gate for
// the senior's own data). If at least one log exists → active dashboard.
// Otherwise → empty/onboarding state. Re-checks whenever a new log is created.

export default function NeoseniorDashboardScreen() {
  const userId = useAuthStore((s) => s.user?.id ?? '');

  const checkQ = useQuery({
    queryKey: ['latestLogs', userId],
    queryFn: () => getLatestHealthLogs(userId),
    enabled: !!userId,
  });

  if (checkQ.isLoading) {
    return (
      <View style={styles.loadingRoot}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  const hasLogs = (checkQ.data?.length ?? 0) > 0;

  if (hasLogs) {
    return <NeoseniorActiveDashboardScreen />;
  }

  return <EmptyDashboard onLogSuccess={() => checkQ.refetch()} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Brand.bgCream,
  },

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
  userCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
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
  avatarInitials: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    color: Brand.primary,
  },

  scrollContent: { paddingBottom: 120 },

  alertCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Brand.mutedTeal,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFF6E6',
  },
  alertText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.primary,
    lineHeight: 20,
    paddingRight: 24,
  },
  alertLink: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    color: Brand.primary,
    textDecorationLine: 'underline',
    alignSelf: 'flex-end',
    marginTop: 8,
  },

  emptyModule: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginVertical: 40,
  },
  haloRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F7EFE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 24,
    fontFamily: Fonts.heading,
    fontSize: FontSize.xl,
    color: Brand.primary,
    textAlign: 'center',
  },
  dashedDivider: {
    marginVertical: 14,
    width: 140,
    height: 0,
    borderTopWidth: 1,
    borderTopColor: Brand.mutedTeal,
    borderStyle: 'dashed',
  },
  emptySubtitle: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Brand.mutedTeal,
    textAlign: 'center',
    lineHeight: 22,
  },

  actionCards: {
    marginHorizontal: 20,
    gap: 16,
    marginBottom: 100,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE6D5',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  actionCardPressed: { opacity: 0.75 },
  actionCardRecording: { borderColor: '#E8442E' },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.accentPeach,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconRecording: { backgroundColor: '#E8442E' },
  actionText: {
    flex: 1,
    marginLeft: 16,
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    color: Brand.primary,
    lineHeight: 18,
  },
});
