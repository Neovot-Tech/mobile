import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Logo from './Logo';
import { Colors, Fonts, FontSize, Spacing } from '../theme';

const AUTH_BG = '#FCFBF5';

interface ScreenShellProps {
  headerRight?: React.ReactNode;
  title?: string;
  greeting?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  /** Auth screens: adds full-bleed background + topographic asset */
  showTopographic?: boolean;
}

export default function ScreenShell({
  headerRight,
  title,
  greeting,
  subtitle,
  children,
  showTopographic = false,
}: ScreenShellProps) {
  const insets = useSafeAreaInsets();

  const content = (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        showTopographic && {
          paddingTop: insets.top + 14,
          paddingBottom: Math.max(insets.bottom + 24, 24),
        },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Logo />
        {headerRight}
      </View>

      {title ? <Text style={styles.title}>{title}</Text> : null}
      {greeting}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.body}>{children}</View>
    </ScrollView>
  );

  if (showTopographic) {
    return (
      <View style={styles.fullBleedRoot}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <Image
          source={require('../../assets/Topographic1.png')}
          style={styles.topographic}
          resizeMode="cover"
          accessible={false}
        />
        {content}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background, overflow: 'hidden' },
  fullBleedRoot: { flex: 1, backgroundColor: AUTH_BG, overflow: 'hidden' },

  // Standard topographic rule: 460×570, cover, right: 0
  topographic: {
    position: 'absolute',
    top: 120,
    right: 0,
    width: 460,
    height: 570,
    opacity: 0.8,
  },

  scroll: { flexGrow: 1, padding: Spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },

  // Circular Std Medium 20 → Fonts.heading 20, #003B46
  title: {
    fontFamily: Fonts.heading,
    fontSize: FontSize.xl,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: Fonts.body,
    color: Colors.primary,
    fontSize: FontSize.base,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  body: { flex: 1, justifyContent: 'flex-end' },
});
