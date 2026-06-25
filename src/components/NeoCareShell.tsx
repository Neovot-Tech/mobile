import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Rect, Line } from 'react-native-svg';

import { useAuthStore } from '../store/auth.store';
import { NeoCareAppStackParamList, NeoCareTabParamList } from '../navigation/types';
import { Brand, Fonts, FontSize, Spacing } from '../theme';
import Logo from './Logo';

type TabName = keyof NeoCareTabParamList;

const ACTIVE_COLOR = Brand.primary;
const INACTIVE_COLOR = '#9FB0B2';

// ─── Tab icons (same visuals as NeoCareTabBar) ────────────────────────────────

function HeartPulseIcon({
  color,
  focused,
  size = 24,
}: {
  color: string;
  focused: boolean;
  size?: number;
}) {
  const HEART =
    'M12 20.5C6.5 16 1 11.5 1 7.5C1 4 3.5 2 7 2C9 2 11 3 12 4.5C13 3 15 2 17 2C20.5 2 23 4 23 7.5C23 11.5 17.5 16 12 20.5Z';
  const ECG =
    'M3.5 11 L6 11 L7 9.5 L8 11 L9.5 14 L11.5 6 L13.5 11 L14.5 11 L20.5 11';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={HEART}
        fill={focused ? color : 'none'}
        stroke={focused ? undefined : color}
        strokeWidth={focused ? undefined : 1.5}
        strokeLinejoin="round"
      />
      <Path
        d={ECG}
        stroke={focused ? '#FFFFFF' : color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function JournalIcon({
  color,
  focused,
  size = 24,
}: {
  color: string;
  focused: boolean;
  size?: number;
}) {
  const d = focused ? '#FFFFFF' : color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect
        x={3}
        y={2}
        width={18}
        height={20}
        rx={2}
        fill={focused ? color : 'none'}
        stroke={focused ? undefined : color}
        strokeWidth={focused ? undefined : 1.5}
      />
      <Line x1={8} y1={2} x2={8} y2={22} stroke={d} strokeWidth={1.5} />
      <Line x1={11} y1={9.5} x2={19} y2={9.5} stroke={d} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={11} y1={14.5} x2={19} y2={14.5} stroke={d} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

const TAB_CONFIG: Record<TabName, { label: string; renderIcon: (f: boolean, c: string) => React.ReactNode }> = {
  Dashboard: {
    label: 'Home',
    renderIcon: (f, c) => <Ionicons name={f ? 'home' : 'home-outline'} size={24} color={c} />,
  },
  Health: {
    label: 'History',
    renderIcon: (f, c) => <HeartPulseIcon focused={f} color={c} />,
  },
  Summary: {
    label: 'Summary',
    renderIcon: (f, c) => <JournalIcon focused={f} color={c} />,
  },
  Settings: {
    label: 'Settings',
    renderIcon: (f, c) => <Ionicons name={f ? 'settings' : 'settings-outline'} size={24} color={c} />,
  },
};

// ─── Shell Tab Bar ────────────────────────────────────────────────────────────

function ShellTabBar({ activeTab }: { activeTab: TabName }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<NeoCareAppStackParamList>>();

  return (
    <View style={[tabStyles.container, { paddingBottom: insets.bottom }]}>
      <View style={tabStyles.topAccent} />
      <View style={tabStyles.tabRow}>
        {(Object.keys(TAB_CONFIG) as TabName[]).map((name) => {
          const focused = name === activeTab;
          const color = focused ? ACTIVE_COLOR : INACTIVE_COLOR;
          const config = TAB_CONFIG[name];

          return (
            <Pressable
              key={name}
              onPress={() => navigation.navigate('Tabs', { screen: name })}
              style={({ pressed }) => [tabStyles.tab, pressed && { opacity: 0.7 }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={config.label}
            >
              {config.renderIcon(focused, color)}
              <Text style={[tabStyles.label, { color }]}>{config.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

interface NeoCareShellProps {
  children: React.ReactNode;
  /** Tab to show as active. Defaults to 'Dashboard'. */
  activeTab?: TabName;
  /** Wrap content in a ScrollView. Defaults to false. */
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export default function NeoCareShell({
  children,
  activeTab = 'Dashboard',
  scroll = false,
  contentContainerStyle,
}: NeoCareShellProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const firstName = (user?.displayName ?? '').split(' ')[0];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={styles.header}>
        <Logo />
        {firstName ? <Text style={styles.greeting}>Hello, {firstName}</Text> : null}
      </View>

      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.staticContent, contentContainerStyle]}>
          {children}
        </View>
      )}

      <ShellTabBar activeTab={activeTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.bgCream },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    height: 64,
    backgroundColor: '#F5F1E5',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EFEBE4',
  },
  greeting: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSize.sm,
    color: Brand.primary,
  },
  staticContent: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
});

const tabStyles = StyleSheet.create({
  container: { backgroundColor: '#FFFFFF' },
  topAccent: { height: 3, backgroundColor: '#EFA84E' },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 72,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    marginTop: 4,
  },
});
