import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Rect, Line } from 'react-native-svg';
import { Brand, Fonts } from '../theme';

// ─── Custom SVG Icons ─────────────────────────────────────────────────────────

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
  const ecgColor = focused ? '#FFFFFF' : color;

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
        stroke={ecgColor}
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
  const detailColor = focused ? '#FFFFFF' : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Book body */}
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
      {/* Spine separator */}
      <Line x1={8} y1={2} x2={8} y2={22} stroke={detailColor} strokeWidth={1.5} />
      {/* Text indicator 1 */}
      <Line
        x1={11}
        y1={9.5}
        x2={19}
        y2={9.5}
        stroke={detailColor}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Text indicator 2 */}
      <Line
        x1={11}
        y1={14.5}
        x2={19}
        y2={14.5}
        stroke={detailColor}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Tab Config ───────────────────────────────────────────────────────────────

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  label: string;
  renderIcon: (focused: boolean, color: string) => React.ReactNode;
}

const TAB_CONFIG: Record<string, TabConfig> = {
  Dashboard: {
    label: 'Home',
    renderIcon: (focused, color) => (
      <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
    ),
  },
  Health: {
    label: 'History',
    renderIcon: (focused, color) => <HeartPulseIcon focused={focused} color={color} />,
  },
  Summary: {
    label: 'Summary',
    renderIcon: (focused, color) => <JournalIcon focused={focused} color={color} />,
  },
  Settings: {
    label: 'Settings',
    renderIcon: (focused, color) => (
      <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
    ),
  },
};

const ACTIVE_COLOR = Brand.primary;   // #003B46
const INACTIVE_COLOR = '#9FB0B2';

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

export default function NeoCareTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.topAccent} />
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const color = focused ? ACTIVE_COLOR : INACTIVE_COLOR;
          const config = TAB_CONFIG[route.name] ?? {
            label: route.name,
            renderIcon: (f: boolean, c: string) => (
              <Ionicons name={f ? 'ellipse' : ('ellipse-outline' as IconName)} size={24} color={c} />
            ),
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={config.label}
            >
              {config.renderIcon(focused, color)}
              <Text style={[styles.label, { color }]}>{config.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  topAccent: {
    height: 3,
    backgroundColor: '#EFA84E',
  },
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
