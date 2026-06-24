import React, { useRef } from 'react';
import {
  View, Text, Image, Pressable, StyleSheet, StatusBar,
  Animated, PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../../navigation/types';
import { Fonts } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

const TEAL = '#003B46';
const CARD_FILL = '#FDF5E6';
const CARD_STROKE = '#F2DCAE';
const ARROW_GOLD = '#BE9F67';

const CARD_W = 345;
const FRONT_H = 215;

const TRACK_H = 70;
const CIRCLE_SIZE = 54;
const TRACK_PAD = 8;

export default function SplashScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const slideX = useRef(new Animated.Value(0)).current;
  const trackWidthRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { slideX.stopAnimation(); },
      onPanResponderMove: (_, g) => {
        const max = trackWidthRef.current - CIRCLE_SIZE - TRACK_PAD * 2;
        slideX.setValue(Math.max(0, Math.min(g.dx, max)));
      },
      onPanResponderRelease: (_, g) => {
        const max = trackWidthRef.current - CIRCLE_SIZE - TRACK_PAD * 2;
        if (g.dx >= max * 0.7) {
          Animated.timing(slideX, {
            toValue: max,
            duration: 150,
            useNativeDriver: true,
          }).start(() => navigation.navigate('UserType'));
        } else {
          Animated.spring(slideX, {
            toValue: 0,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const textOpacity = slideX.interpolate({
    inputRange: [0, 90],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <LinearGradient
      colors={['#FFFEFC', '#FDF2DE', '#F8DBA7', '#D9BA82', '#BA9B63']}
      locations={[0, 0.18, 0.5, 0.78, 1]}
      style={styles.root}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <Image
        source={require('../../../assets/Topographic1.png')}
        style={styles.topographic}
        resizeMode="cover"
        accessible={false}
      />

      {/* Header: logo left, log-in pill right */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Pressable
          style={styles.loginPill}
          onPress={() => navigation.navigate('SignIn', { role: 'neo_care' })}
          accessibilityRole="button"
          accessibilityLabel={t('splash.logIn')}
        >
          <Text style={styles.loginText}>{t('splash.logIn')}</Text>
        </Pressable>
      </View>

      {/* Two-card rotated stack */}
      <View style={styles.cardStack}>
        {/* Back card — rotated clockwise so TR peeks upper-right, BL peeks lower-left */}
        <View style={[styles.card, styles.cardBack]} />
        {/* Front card with full content */}
        <View style={[styles.card, styles.cardFront]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {t('splash.cardTitle')}
            </Text>
            <View style={styles.ageBlock}>
              <Text style={styles.ageLabel}>{t('splash.cardAgeLabel')}</Text>
              <Text style={styles.ageValue}>{t('splash.cardAgeValue')}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <Text style={styles.cardTimestamp}>{t('splash.cardLogged')}</Text>
          <Text style={styles.cardQuote} numberOfLines={0}>
            {t('splash.cardQuote')}
          </Text>

          <Pressable style={styles.cardNextWrapper} onPress={() => {}}>
            <Text style={styles.cardNext}>{t('splash.cardNext')}</Text>
          </Pressable>
        </View>
      </View>

      {/* Bottom pinned section */}
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom + 24, 48) }]}>
        <Text style={styles.tagline}>{t('splash.tagline1')}</Text>
        <Text style={[styles.tagline, styles.tagline2]}>{t('splash.tagline2')}</Text>
        <Text style={styles.subtitle}>{t('splash.subtitle')}</Text>

        {/* Slide-to-get-started track */}
        <View
          style={styles.sliderTrack}
          onLayout={(e) => { trackWidthRef.current = e.nativeEvent.layout.width; }}
        >
          {/* Draggable circle — gesture attaches here */}
          <Animated.View
            style={[styles.sliderCircle, { transform: [{ translateX: slideX }] }]}
            {...panResponder.panHandlers}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t('splash.getStarted')}
          >
            <Ionicons name="chevron-forward" size={26} color={ARROW_GOLD} />
          </Animated.View>

          {/* Label fades as circle slides over it */}
          <Animated.Text style={[styles.sliderLabel, { opacity: textOpacity }]}>
            {t('splash.getStarted')}
          </Animated.Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  topographic: {
    position: 'absolute',
    bottom: 244,
    right: 0,
    width: 460,
    height: 570,
    opacity: 0.65,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: { width: 89, height: 19 },
  loginPill: {
    width: 81,
    height: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: { fontFamily: Fonts.body, fontSize: 13, color: TEAL },

  // Back card sits above-right of the front card so its top-right corner (age area)
  // peeks out. Clockwise rotation swings the right edge upward, reinforcing the peek.
  cardStack: {
    marginTop: 36,
    alignSelf: 'center',
    width: CARD_W,
    height: FRONT_H + 35,
    overflow: 'visible',
  },

  card: {
    position: 'absolute',
    width: CARD_W,
    height: FRONT_H,
    backgroundColor: CARD_FILL,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_STROKE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  // Same anchor as the front card so the rotation spreads equally: TR peeks to the
  // upper-right and BL peeks to the lower-left, keeping the composition centered.
  cardBack: {
    top: 20,
    left: 0,
    zIndex: 1,
    transform: [{ rotate: '10deg' }],
  },
  cardFront: {
    top: 20,
    left: 0,
    zIndex: 2,
    padding: 20,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: Fonts.headingBold,
    fontSize: 18,
    lineHeight: 24,
    color: TEAL,
    flex: 1,
    marginRight: 12,
  },
  ageBlock: { alignItems: 'flex-end' },
  ageLabel: {
    fontFamily: Fonts.headingBook,
    fontSize: 12,
    color: TEAL,
    opacity: 0.7,
  },
  ageValue: {
    fontFamily: Fonts.headingBold,
    fontSize: 16,
    color: TEAL,
  },

  cardDivider: {
    height: 1,
    backgroundColor: TEAL,
    opacity: 0.15,
    marginVertical: 12,
  },

  cardTimestamp: {
    fontFamily: Fonts.headingBook,
    fontSize: 15,
    color: TEAL,
    marginBottom: 8,
  },
  cardQuote: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: TEAL,
  },
  cardNextWrapper: {
    position: 'absolute',
    right: 20,
    bottom: 16,
  },
  cardNext: {
    fontFamily: Fonts.headingBold,
    fontSize: 13,
    color: TEAL,
    textDecorationLine: 'underline',
  },

  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  tagline: {
    fontFamily: Fonts.headingBold,
    fontSize: 22,
    lineHeight: 28,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tagline2: { marginBottom: 16 },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 18,
    lineHeight: 26,
    color: '#FFFFFF',
    maxWidth: 331,
    marginBottom: 24,
  },

  // Slide-to-start
  sliderTrack: {
    height: TRACK_H,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: TRACK_PAD,
  },
  sliderCircle: {
    position: 'absolute',
    left: TRACK_PAD,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  sliderLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
});
