import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../../navigation/types';
import { Fonts } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

const TEAL = '#003B46';
const CARD_FILL = '#FFFDF9';
const CARD_STROKE = '#F2DCAE';
const ARROW_GOLD = '#BE9F67';

// Three-card deck constants
const CARD_W = 345;
const FRONT_H = 215;
const PEEK = 50;
const BACK1_W = Math.round(CARD_W * 0.95); // 328
const BACK2_W = Math.round(CARD_W * 0.89); // 307
const BACK1_LEFT = Math.round((CARD_W - BACK1_W) / 2); // 8
const BACK2_LEFT = Math.round((CARD_W - BACK2_W) / 2); // 19
const BACK1_TOP = Math.round(PEEK * 0.4); // 20

export default function SplashScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#FFFEFC', '#FDF2DE', '#F8DBA7', '#D9BA82', '#BA9B63']}
      locations={[0, 0.18, 0.5, 0.78, 1]}
      style={styles.root}
    >
      {/* Translucent — gradient fills behind the status bar */}
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Topographic contour asset — absolute, lower half of screen */}
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

      {/* Three-card vertical deck — back cards peek above the front card */}
      <View style={styles.cardStack}>
        {/* Back card 2: furthest back, narrowest */}
        <View style={[styles.card, styles.cardBack2]} />
        {/* Back card 1: middle layer */}
        <View style={[styles.card, styles.cardBack1]} />
        {/* Front card: full content */}
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
          <Text style={styles.cardQuote}>{t('splash.cardQuote')}</Text>

          <Text style={styles.cardNext}>{t('splash.cardNext')}</Text>
        </View>
      </View>

      {/* Bottom: absolutely pinned — top edge lands at same y as topographic bottom */}
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom + 24, 48) }]}>
        <Text style={styles.tagline}>{t('splash.tagline1')}</Text>
        <Text style={[styles.tagline, styles.tagline2]}>{t('splash.tagline2')}</Text>
        <Text style={styles.subtitle}>{t('splash.subtitle')}</Text>
        <Pressable
          style={styles.getStarted}
          onPress={() => navigation.navigate('UserType')}
          accessibilityRole="button"
          accessibilityLabel={t('splash.getStarted')}
        >
          <View style={styles.getStartedCircle}>
            <Ionicons name="chevron-forward" size={26} color={ARROW_GOLD} />
          </View>
          <Text style={styles.getStartedText}>{t('splash.getStarted')}</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  topographic: {
    position: 'absolute',
    bottom: 244,
    right: 0,    // flush to right screen edge; image overflows left (460px > 393px)
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

  // Container sized to front card height + the peek amount above it
  cardStack: {
    marginTop: 36,
    alignSelf: 'center',
    width: CARD_W,
    height: FRONT_H + PEEK,
  },

  card: {
    backgroundColor: CARD_FILL,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_STROKE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },

  cardBack2: {
    position: 'absolute',
    top: 0,
    left: BACK2_LEFT,
    width: BACK2_W,
    height: FRONT_H,
  },
  cardBack1: {
    position: 'absolute',
    top: BACK1_TOP,
    left: BACK1_LEFT,
    width: BACK1_W,
    height: FRONT_H,
  },
  cardFront: {
    position: 'absolute',
    top: PEEK,
    left: 0,
    width: CARD_W,
    height: FRONT_H,
    padding: 24,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontFamily: Fonts.headingBold,
    fontSize: 18,
    lineHeight: 24,
    color: TEAL,
    flex: 1,
    marginRight: 12,
  },
  ageBlock: { alignItems: 'center' },
  ageLabel: {
    fontFamily: Fonts.headingBook,
    fontSize: 11,
    color: TEAL,
    lineHeight: 16,
    opacity: 0.7,
  },
  ageValue: {
    fontFamily: Fonts.headingBold,
    fontSize: 18,
    color: TEAL,
    lineHeight: 22,
  },

  cardDivider: {
    height: 1,
    backgroundColor: CARD_STROKE,
    marginVertical: 16,
    opacity: 0.8,
  },

  cardTimestamp: {
    fontFamily: Fonts.headingBook,
    fontSize: 14,
    color: TEAL,
    marginBottom: 10,
  },
  cardQuote: {
    fontFamily: Fonts.headingBook,
    fontSize: 16,
    lineHeight: 24,
    color: TEAL,
  },
  cardNext: {
    position: 'absolute',
    right: 24,
    bottom: 16,
    fontFamily: Fonts.heading,
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
  getStarted: {
    height: 70,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedCircle: {
    position: 'absolute',
    left: 8,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedText: { fontFamily: Fonts.bodyBold, fontSize: 17, color: '#FFFFFF' },
});
