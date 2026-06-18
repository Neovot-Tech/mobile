import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { Colors } from '../theme';

/**
 * Animated launch splash. Plays once on cold start before any auth/role navigation.
 * Sequence + timings follow SPLASH_BRIEF.md.
 *
 * Assets are the trimmed copies in assets/splash/ (the originals have ~60% transparent
 * padding, which made them render tiny under resizeMode:contain). Sizing is derived from
 * the trimmed content so the marks are legible.
 *
 * Colours follow the canonical brand palette (theme/colors.ts), overriding the SPLASH_BRIEF
 * estimates: teal = Colors.primary #003B46, white = #FFFFFF; red is baked into the assets.
 */

const WHITE_ICON = require('../../assets/splash/icon-white.png');
const RED_ICON = require('../../assets/splash/icon-red.png');
const WORDMARK = require('../../assets/splash/wordmark.png'); // wordmark + "HEALTH UNRESTRICTED"

// Image.resolveAssetSource is not implemented in react-native-web; fall back to
// the known design-time aspect ratios so the splash still plays on web.
const iconSrc = Platform.OS !== 'web' ? Image.resolveAssetSource(RED_ICON) : null;
const ICON_AR = iconSrc?.height ? iconSrc.width / iconSrc.height : 440 / 500;
const wordSrc = Platform.OS !== 'web' ? Image.resolveAssetSource(WORDMARK) : null;
const WORDMARK_AR = wordSrc?.height ? wordSrc.width / wordSrc.height : 780 / 248;

const ICON_HEIGHT = 104; // display height of the dot+cross mark
const ICON_TOP_PCT = 0.4; // icon top at 40% of screen height
const WORDMARK_WIDTH_PCT = 0.78; // wordmark width as a fraction of screen width
const STACK_GAP = 28; // gap between icon bottom and wordmark top

// Schedule (ms from the moment the native splash actually clears) — SPLASH_BRIEF table,
// with a longer settle so the final lockup holds before handoff.
const T_ENTER = 350;
const T_PULSE_1 = 1100;
const T_PULSE_2 = 1520;
const T_SWEEP = 2050;
const T_WHITE_FADE = 2730;
const T_COMPLETE = 4900;

const SWEEP_DURATION = 1400;
const NATIVE_SPLASH_FALLBACK = 1500; // start anyway if hideAsync stalls

interface BootSplashScreenProps {
  onFinish: () => void;
}

export default function BootSplashScreen({ onFinish }: BootSplashScreenProps) {
  const { width: screenW, height: screenH } = useWindowDimensions();

  const iconScale = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current; // enter 0→1, then fade 1→0
  const sweep = useRef(new Animated.Value(0)).current; // white layer width, 0 → screenW

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finished = useRef(false);
  const started = useRef(false);

  const iconH = ICON_HEIGHT;
  const iconW = iconH * ICON_AR;
  const iconLeft = screenW / 2 - iconW / 2;
  const iconTop = screenH * ICON_TOP_PCT;

  const wordmarkW = screenW * WORDMARK_WIDTH_PCT;
  const wordmarkH = wordmarkW / WORDMARK_AR;
  const wordmarkLeft = screenW / 2 - wordmarkW / 2;
  const wordmarkTop = iconTop + iconH + STACK_GAP;

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onFinish();
  };

  const at = (delay: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, delay));
  };

  const pulse = () =>
    Animated.sequence([
      Animated.timing(iconScale, {
        toValue: 1.24,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: 1,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

  const runTimeline = () => {
    // Phase 1 — icon springs in (overshoot) + opacity fade-in
    at(T_ENTER, () => {
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Phase 2 — two heartbeat pulses (~72 BPM)
    at(T_PULSE_1, () => pulse().start());
    at(T_PULSE_2, () => pulse().start());

    // Phase 3 — white sweep wipes left → right, revealing the red icon + wordmark
    at(T_SWEEP, () => {
      Animated.timing(sweep, {
        toValue: screenW,
        duration: SWEEP_DURATION,
        easing: Easing.bezier(0.6, 0, 0.38, 1),
        useNativeDriver: false, // width cannot use the native driver
      }).start();
    });

    // White icon dissolves exactly as the sweep covers it
    at(T_WHITE_FADE, () => {
      Animated.timing(iconOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    });

    // Phase 4 — settle, then hand off to navigation
    at(T_COMPLETE, finish);
  };

  const start = () => {
    if (started.current) return;
    started.current = true;
    runTimeline();
  };

  const skip = () => {
    if (finished.current) return;
    timers.current.forEach(clearTimeout);
    iconScale.stopAnimation();
    iconOpacity.stopAnimation();
    sweep.stopAnimation();
    // Jump straight to the settled end state
    iconScale.setValue(1);
    iconOpacity.setValue(0); // white icon fully dissolved
    sweep.setValue(screenW); // sweep fully revealed
    finish();
  };

  useEffect(() => {
    // Start the timeline ONLY after the native splash has actually been dismissed,
    // otherwise the native teal frame covers Phases 1–2 and only the sweep is seen.
    SplashScreen.hideAsync()
      .catch(() => {})
      .finally(start);
    // Safety net: start regardless if hideAsync never resolves.
    at(NATIVE_SPLASH_FALLBACK, start);

    return () => {
      timers.current.forEach(clearTimeout);
    };
    // Run once on mount. eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TouchableWithoutFeedback onPress={skip} accessibilityRole="button">
      <View style={styles.root}>
        {/* White (phase 1/2) icon on the teal base */}
        <Animated.Image
          source={WHITE_ICON}
          resizeMode="contain"
          fadeDuration={0}
          accessible={false}
          onError={(e) => console.warn('[splash] icon-white failed:', e.nativeEvent)}
          style={{
            position: 'absolute',
            left: iconLeft,
            top: iconTop,
            width: iconW,
            height: iconH,
            opacity: iconOpacity,
            transform: [{ scale: iconScale }],
          }}
        />

        {/* White sweep layer — its growing right edge clips & reveals the children */}
        <View style={styles.sweepClip} pointerEvents="none">
          <Animated.View style={[styles.sweepFill, { width: sweep }]}>
            <Image
              source={RED_ICON}
              resizeMode="contain"
              fadeDuration={0}
              accessible={false}
              onError={(e) => console.warn('[splash] icon-red failed:', e.nativeEvent)}
              style={{
                position: 'absolute',
                left: iconLeft,
                top: iconTop,
                width: iconW,
                height: iconH,
              }}
            />
            <Image
              source={WORDMARK}
              resizeMode="contain"
              fadeDuration={0}
              accessible={false}
              onError={(e) => console.warn('[splash] wordmark failed:', e.nativeEvent)}
              style={{
                position: 'absolute',
                left: wordmarkLeft,
                top: wordmarkTop,
                width: wordmarkW,
                height: wordmarkH,
              }}
            />
          </Animated.View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const fill = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

const styles = StyleSheet.create({
  root: { ...fill, backgroundColor: Colors.primary }, // teal #003B46
  sweepClip: { ...fill },
  // overflow:hidden on the FILL is what creates the wipe — its growing right edge
  // clips each logo, revealing them left-edge-first as the white expands.
  sweepFill: { height: '100%', backgroundColor: Colors.white, overflow: 'hidden' },
});
