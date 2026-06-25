import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../../navigation/types';
import { Fonts } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'UserType'>;

const TEAL = '#003B46';
const BG = '#FCFBF5';
const CARD_H = 180;

// Ellipse colours from Figma spec (Ellipse 2 / 3 / 4)
const AVATAR_COLORS = ['#D9D9D9', '#FF0000', '#FFD1BB'] as const;

function AvatarCluster() {
  return (
    <View style={styles.avatarRow}>
      {AVATAR_COLORS.map((color, i) => (
        <View
          key={i}
          style={[styles.avatar, { backgroundColor: color }, i > 0 && styles.avatarOverlap]}
        />
      ))}
    </View>
  );
}

export default function UserTypeScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const mode = route.params?.mode ?? 'signup';
  const isSignIn = mode === 'signin';

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Topographic 1 — fills the open area between header and cards */}
      <Image
        source={require('../../../assets/Topographic1.png')}
        style={styles.topographic}
        resizeMode="cover"
        accessible={false}
      />

      {/* Header: logo + back pill */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Pressable
          style={styles.backPill}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="chevron-back" size={10} color={TEAL} />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </Pressable>
      </View>

      {/* Title + subtitle */}
      <View style={styles.titleBlock}>
        <Text style={styles.title}>{t('userType.title')}</Text>
        <Text style={styles.subtitle}>{t('userType.subtitle')}</Text>
      </View>

      {/* Two role cards — absolutely pinned to bottom */}
      <View style={[styles.cards, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
        {/* NeoCare — dark teal card */}
        <Pressable
          style={styles.cardDark}
          onPress={() => navigation.navigate(isSignIn ? 'SignIn' : 'SignUp', { role: 'neo_care' })}
          accessibilityRole="button"
          accessibilityLabel={t('userType.neoCare')}
        >
          <Text style={styles.cardDarkTitle}>{t('userType.neoCare')}</Text>
          <Text style={styles.cardDarkBody}>{t('userType.neoCareDesc')}</Text>
          <View style={styles.cardFooter}>
            <AvatarCluster />
            <Text style={styles.cardDarkCount}>{t('userType.neoCareCount')}</Text>
          </View>
        </Pressable>

        {/* NeoSenior — white card */}
        <Pressable
          style={styles.cardLight}
          onPress={() => navigation.navigate(isSignIn ? 'SignIn' : 'SignUp', { role: 'neo_senior' })}
          accessibilityRole="button"
          accessibilityLabel={t('userType.neoSenior')}
        >
          <Text style={styles.cardLightTitle}>{t('userType.neoSenior')}</Text>
          <Text style={styles.cardLightBody}>{t('userType.neoSeniorDesc')}</Text>
          <View style={styles.cardFooter}>
            <AvatarCluster />
            <Text style={styles.cardLightCount}>{t('userType.neoSeniorCount')}</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // Flat right edge of the PNG aligns with the screen's right edge (global rule).
  topographic: {
    position: 'absolute',
    top: 120,
    right: 0,
    width: 460,
    height: 570,
    opacity: 0.8,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: { width: 89, height: 19 },

  // 81×32 pill — identical spec to splash Login pill but with icon+text
  backPill: {
    width: 81,
    height: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TEAL,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  backText: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: TEAL },

  titleBlock: { paddingHorizontal: 24, marginTop: 32 },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    color: TEAL,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: TEAL,
    maxWidth: 331,
  },

  cards: {
    position: 'absolute',
    bottom: 0,
    left: 24,
    right: 24,
    gap: 12,
  },

  // NeoCare card: fill #003B46, r10, stroke #F3F3F3, shadow 0/0/5 rgba(EEE,0.4)
  cardDark: {
    height: CARD_H,
    backgroundColor: TEAL,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3F3F3',
    padding: 24,
    justifyContent: 'center',
    shadowColor: '#EEEEEE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 2,
  },
  // NeoSenior card: fill #FFFFFF, r10, stroke #FCDEA7
  cardLight: {
    height: CARD_H,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCDEA7',
    padding: 24,
    justifyContent: 'center',
    shadowColor: '#EEEEEE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 2,
  },

  cardDarkTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    lineHeight: 20,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardDarkBody: {
    fontFamily: Fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    maxWidth: 283,
    marginBottom: 12,
  },
  cardLightTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    lineHeight: 20,
    color: '#000000',
    marginBottom: 8,
  },
  cardLightBody: {
    fontFamily: Fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: TEAL,
    maxWidth: 283,
    marginBottom: 12,
  },

  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Avatar cluster: 3 circles, gap: −8 (overlap via negative marginLeft)
  avatarRow: { flexDirection: 'row' },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  avatarOverlap: { marginLeft: -8 },

  // Montserrat Medium 10px, lh 26px (Figma spec)
  cardDarkCount: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    lineHeight: 26,
    color: '#FFFFFF',
  },
  cardLightCount: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    lineHeight: 26,
    color: '#000000',
  },
});
