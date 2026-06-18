import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';

import Screen from '../../components/Screen';
import ClassificationSheet from '../../components/ClassificationSheet';
import ProfileNudgeBanner from '../../components/ProfileNudgeBanner';
import { useLogPipeline } from '../../hooks/useLogPipeline';
import { useProfileNudge } from '../../hooks/useProfileNudge';
import { getLatestHealthLogs } from '../../services/healthLogs.service';
import { useAuthStore } from '../../store/auth.store';
import { JobType } from '../../services/types';
import { Colors, Brand, Fonts, FontSize, Spacing, BorderRadius } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NeoSeniorAppStackParamList } from '../../navigation/types';

const MIC_SIZE = 168;

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function NeoSeniorHomeScreen() {
  const { t } = useTranslation();

  const userId = useAuthStore((s) => s.user?.id ?? '');
  const firstName = useAuthStore((s) => (s.user?.displayName ?? '').split(' ')[0]);
  const lang = useAuthStore((s) => s.user?.language ?? 'en');
  const neoSeniorId = useAuthStore((s) => s.user?.neoSeniorId);

  const nudge = useProfileNudge();
  const navigation = useNavigation<NativeStackNavigationProp<NeoSeniorAppStackParamList>>();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const recording = recorderState.isRecording;

  const latestQ = useQuery({
    queryKey: ['latestLogs', userId],
    queryFn: () => getLatestHealthLogs(userId),
    enabled: !!userId,
  });

  const pipeline = useLogPipeline(() => latestQ.refetch());
  const busy = pipeline.status === 'uploading' || pipeline.status === 'processing';

  const micGranted = useRef(false);
  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      micGranted.current = status.granted;
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    })();
  }, []);

  // Recording pulse rings
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (recording) {
      pulse.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    pulse.setValue(0);
  }, [recording, pulse]);

  // Idle rings + breathing animation
  const idlePulse1 = useRef(new Animated.Value(0)).current;
  const idlePulse2 = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const isIdle = !recording && !busy;

  useEffect(() => {
    if (!isIdle) {
      idlePulse1.setValue(0);
      idlePulse2.setValue(0);
      breathe.setValue(0);
      return;
    }
    idlePulse1.setValue(0);
    idlePulse2.setValue(0);

    const ring1Loop = Animated.loop(
      Animated.sequence([
        Animated.timing(idlePulse1, { toValue: 1, duration: 2800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(idlePulse1, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    const ring2Anim = Animated.sequence([
      Animated.delay(1400),
      Animated.loop(
        Animated.sequence([
          Animated.timing(idlePulse2, { toValue: 1, duration: 2800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(idlePulse2, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ),
    ]);
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );

    ring1Loop.start();
    ring2Anim.start();
    breatheLoop.start();
    return () => {
      ring1Loop.stop();
      ring2Anim.stop();
      breatheLoop.stop();
    };
  }, [isIdle, idlePulse1, idlePulse2, breathe]);

  const handleMicPress = async () => {
    if (busy) return;
    if (recording) {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        pipeline.start({ jobType: 'audio_transcribe', fileUri: uri, mimeType: 'audio/m4a', lang });
      }
      return;
    }
    let granted = micGranted.current;
    if (!granted) {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      granted = status.granted;
      micGranted.current = granted;
    }
    if (!granted) return;
    pipeline.reset();
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const runWithImage = (result: ImagePicker.ImagePickerResult, jobType: JobType) => {
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    pipeline.reset();
    pipeline.start({ jobType, fileUri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg', lang });
  };

  const captureImage = async (jobType: JobType) => {
    if (busy || recording) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('neoSeniorHome.cameraDenied'));
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    runWithImage(res, jobType);
  };

  const uploadImage = async (jobType: JobType) => {
    if (busy || recording) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    runWithImage(res, jobType);
  };

  const uploadFallback = () => {
    if (busy || recording) return;
    Alert.alert(t('neoSeniorHome.chooseUploadTitle'), undefined, [
      { text: t('neoSeniorHome.logPhoto'), onPress: () => uploadImage('photo_auto') },
      { text: t('neoSeniorHome.scanPrescription'), onPress: () => uploadImage('prescription_scan') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const latest = latestQ.data?.[0];
  const micCircleBg = recording ? '#E8442E' : Colors.neoSeniorMic;
  const breatheScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });

  const idleRingStyle = (val: Animated.Value) => ({
    opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
    transform: [{ scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
  });
  const recRingStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
  };

  return (
    <Screen contentContainerStyle={styles.content}>

      {/* Greeting row */}
      <View style={styles.greetingRow}>
        <View style={styles.logoSquare}>
          <Text style={styles.logoChar}>n</Text>
        </View>
        <View>
          <Text style={styles.greetingName}>
            {getGreeting()}{firstName ? `, ${firstName}` : ''}
          </Text>
          <Text style={styles.greetingDate}>{formatDate()}</Text>
        </View>
      </View>

      <ProfileNudgeBanner
        visible={nudge.visible}
        onDismiss={nudge.dismiss}
        onComplete={() => neoSeniorId && navigation.navigate('EditProfile', { nsrId: neoSeniorId })}
      />

      {/* Hero prompt */}
      <Text style={styles.heroTitle}>{t('neoSeniorHome.title')}</Text>
      <Text style={styles.heroSubtitle}>{t('neoSeniorHome.subtitle')}</Text>

      {/* Mic area */}
      <View style={styles.micArea}>

        {pipeline.status === 'done' && (
          <View style={[styles.statusBanner, styles.bannerOk]}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.bannerOkText}>{t('neoSeniorHome.logSaved')}</Text>
          </View>
        )}

        <Pressable
          onPress={handleMicPress}
          disabled={busy}
          accessibilityRole="button"
          accessibilityState={{ busy, selected: recording }}
          accessibilityLabel={recording ? t('neoSeniorHome.listening') : t('neoSeniorHome.tapToSpeak')}
          style={styles.micPressable}
        >
          {isIdle && (
            <>
              <Animated.View style={[styles.micRing, { borderColor: 'rgba(248,200,203,0.9)' }, idleRingStyle(idlePulse1)]} />
              <Animated.View style={[styles.micRing, { borderColor: 'rgba(248,200,203,0.7)' }, idleRingStyle(idlePulse2)]} />
            </>
          )}
          {recording && (
            <>
              <Animated.View style={[styles.micRing, { borderColor: 'rgba(232,68,46,0.45)' }, recRingStyle]} />
              <Animated.View style={[styles.micRing, { borderColor: 'rgba(232,68,46,0.35)' }, recRingStyle]} />
            </>
          )}
          <Animated.View
            style={[
              styles.micCircle,
              { backgroundColor: micCircleBg },
              isIdle ? { transform: [{ scale: breatheScale }] } : undefined,
            ]}
          >
            {busy ? (
              <ActivityIndicator size="large" color={Colors.neoSeniorMicIcon} />
            ) : recording ? (
              <Ionicons name="stop-circle" size={70} color="#fff" />
            ) : (
              <Ionicons name="mic" size={70} color={Colors.neoSeniorMicIcon} />
            )}
          </Animated.View>
        </Pressable>

        {busy ? (
          <>
            <Text style={styles.micLabel}>{t('neoSeniorHome.processing')}</Text>
            <Text style={styles.micHint}>This takes a moment</Text>
          </>
        ) : recording ? (
          <>
            <Text style={[styles.micLabel, { color: '#E8442E' }]}>
              {formatDuration(recorderState.durationMillis)} · Listening…
            </Text>
            <Text style={styles.micHint}>Tap to stop</Text>
          </>
        ) : (
          <Text style={styles.micLabel}>
            {pipeline.status === 'done' ? 'Tap to speak again' : t('neoSeniorHome.tapToSpeak')}
          </Text>
        )}

        {pipeline.status === 'error' && (
          <Pressable style={[styles.statusBanner, styles.bannerErr]} onPress={pipeline.reset}>
            <Ionicons name="alert-circle" size={20} color={Colors.error} />
            <Text style={styles.bannerErrText}>
              {pipeline.error || t('neoSeniorHome.logFailed')} · {t('neoSeniorHome.tryAgain')}
            </Text>
          </Pressable>
        )}
        {!micGranted.current && !recording && pipeline.status === 'idle' && (
          <Text style={styles.micHint}>{t('neoSeniorHome.micDenied')}</Text>
        )}
      </View>

      {/* Secondary actions */}
      <View style={styles.actionRow}>
        <ActionCard
          icon="camera-outline"
          label={t('neoSeniorHome.logPhoto')}
          onPress={() => captureImage('photo_auto')}
          disabled={busy || recording}
        />
        <ActionCard
          icon="document-text-outline"
          label={t('neoSeniorHome.scanPrescription')}
          onPress={() => captureImage('prescription_scan')}
          disabled={busy || recording}
        />
      </View>

      <Pressable
        onPress={uploadFallback}
        disabled={busy || recording}
        accessibilityRole="button"
        hitSlop={8}
        style={styles.uploadLinkWrap}
      >
        <Text style={styles.uploadLink}>{t('neoSeniorHome.uploadInstead')}</Text>
      </Pressable>

      {/* Latest update */}
      <Text style={styles.sectionLabel}>{t('neoSeniorHome.yesterdaySummary')}</Text>
      <View style={styles.summaryCard}>
        {latestQ.isLoading ? (
          <ActivityIndicator color={Brand.primary} />
        ) : latest ? (
          <>
            <View style={styles.summaryMeta}>
              <View style={styles.tierDot} />
              <Text style={styles.summaryTime}>
                {new Date(latest.loggedAt).toLocaleString()}
              </Text>
            </View>
            <Text style={styles.summaryText}>{latest.aiSummary}</Text>
          </>
        ) : (
          <Text style={styles.summaryEmpty}>{t('neoSeniorHome.noSummary')}</Text>
        )}
      </View>

      <ClassificationSheet
        visible={pipeline.status === 'needs_classification'}
        onSelect={(c) => pipeline.classify(c)}
        onCancel={pipeline.reset}
      />
    </Screen>
  );
}

function ActionCard({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.actionCard,
        disabled && styles.actionDisabled,
        pressed && styles.actionPressed,
      ]}
    >
      <View style={styles.actionIconTile}>
        <Ionicons name={icon} size={24} color={Brand.primary} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },

  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  logoSquare: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoChar: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    color: '#fff',
    lineHeight: 22,
  },
  greetingName: {
    fontFamily: Fonts.heading,
    fontSize: 19,
    color: Brand.primary,
    lineHeight: 22,
  },
  greetingDate: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.mutedTeal,
  },

  heroTitle: {
    fontFamily: Fonts.heading,
    fontSize: 27,
    lineHeight: 34,
    color: Brand.primary,
    marginTop: 18,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSize.lg,
    lineHeight: 26,
    color: Brand.mutedTeal,
  },

  micArea: {
    alignItems: 'center',
    marginVertical: Spacing['2xl'],
  },
  micPressable: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micRing: {
    position: 'absolute',
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    borderWidth: 2,
  },
  micCircle: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.neoSeniorMicIcon,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 8,
  },
  micLabel: {
    fontFamily: Fonts.heading,
    fontSize: 19,
    color: Brand.primary,
    marginTop: 20,
    textAlign: 'center',
  },
  micHint: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Brand.mutedTeal,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.base,
    maxWidth: '100%',
  },
  bannerOk: { backgroundColor: '#E7F4ED' },
  bannerOkText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.base,
    color: Colors.success,
    flexShrink: 1,
  },
  bannerErr: { backgroundColor: '#FBE9E7' },
  bannerErrText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.base,
    color: Colors.error,
    flexShrink: 1,
  },

  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    padding: Spacing.base,
    gap: 10,
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  actionDisabled: { opacity: 0.5 },
  actionPressed: { opacity: 0.7 },
  actionIconTile: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: Brand.accentPeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.lg,
    lineHeight: 22,
    color: Brand.primary,
  },

  uploadLinkWrap: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  uploadLink: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.base,
    color: Brand.mutedTeal,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },

  sectionLabel: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.lg,
    color: Brand.primaryForm,
    marginBottom: 10,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.borderWarm,
    padding: Spacing.lg,
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  summaryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tierDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: Colors.success,
  },
  summaryTime: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSize.sm,
    color: Brand.mutedTeal,
  },
  summaryText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.lg,
    lineHeight: 28,
    color: Brand.bodyText,
  },
  summaryEmpty: {
    fontFamily: Fonts.body,
    fontSize: FontSize.base,
    color: Colors.textMuted,
  },
});
