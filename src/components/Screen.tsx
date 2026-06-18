import React from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StatusBarStyle,
  StyleSheet,
  StyleProp,
  ViewStyle,
  RefreshControlProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand, Spacing } from '../theme';

interface ScreenProps {
  children: React.ReactNode;
  /** Wrap content in a vertical ScrollView (default true). */
  scroll?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** Extra style for the scroll content container (or the static body). */
  contentContainerStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  /** Status bar icon style; defaults to dark (our backgrounds are light). */
  barStyle?: StatusBarStyle;
}

/**
 * Standard app screen shell: a full-bleed, edge-to-edge background that paints
 * behind a TRANSPARENT status bar (battery/time overlaid on content), with
 * content kept clear of the top inset and the bottom home indicator.
 *
 * Uses React Native's translucent `StatusBar` — the same approach as
 * `ScreenShell` and the splash, which are confirmed edge-to-edge in Expo Go.
 * (expo-status-bar in SDK 56 can't set translucency, which is why screens using
 * it showed an opaque bar above the notch.)
 */
export default function Screen({
  children,
  scroll = true,
  refreshControl,
  contentContainerStyle,
  backgroundColor = Brand.bgCream,
  barStyle = 'dark-content',
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor, paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={barStyle} />
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          contentContainerStyle={[
            styles.content,
            contentContainerStyle,
            { paddingBottom: insets.bottom + Spacing['3xl'] },
          ]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentContainerStyle, { flex: 1, paddingBottom: insets.bottom }]}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
});
