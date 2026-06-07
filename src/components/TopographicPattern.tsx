import React, { useMemo } from 'react';
import { ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Figma "Topographic 1": 22 concentric organic contour rings, 564x545,
// stroke hsla(189, 100%, 14%, 0.50), innermost ring 128x125 scaling up to 564x545.
const GROUP_W = 564;
const GROUP_H = 545;
const RING_COUNT = 22;
const INNER_W = 128;

// Irregular radius multipliers at 8 anchor angles — organic contour-map shape.
const RADII = [1.0, 0.95, 1.05, 0.97, 1.07, 0.93, 1.03, 0.96];
// Cubic-bezier handle factor for 8 segments of a closed curve (4/3 * tan(45deg/4)).
const KAPPA = 0.2652;
const ASPECT = GROUP_H / GROUP_W;

function ringPath(radius: number): string {
  const cx = GROUP_W / 2;
  const cy = GROUP_H / 2;
  const pts = RADII.map((m, i) => {
    const a = (i / RADII.length) * Math.PI * 2;
    const r = radius * m;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * ASPECT, a, r };
  });

  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % pts.length];
    // Handles tangent to the ring at each anchor.
    const c1x = p0.x - Math.sin(p0.a) * KAPPA * p0.r;
    const c1y = p0.y + Math.cos(p0.a) * KAPPA * p0.r * ASPECT;
    const c2x = p1.x + Math.sin(p1.a) * KAPPA * p1.r;
    const c2y = p1.y - Math.cos(p1.a) * KAPPA * p1.r * ASPECT;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }
  return `${d} Z`;
}

interface TopographicPatternProps {
  style?: ViewStyle;
}

export default function TopographicPattern({ style }: TopographicPatternProps) {
  const paths = useMemo(
    () =>
      Array.from({ length: RING_COUNT }, (_, i) =>
        // Ring widths step evenly from 128 to 564 (per Figma vector sizes).
        ringPath((INNER_W + ((GROUP_W - INNER_W) * i) / (RING_COUNT - 1)) / 2),
      ),
    [],
  );

  return (
    <Svg
      width={GROUP_W}
      height={GROUP_H}
      viewBox={`0 0 ${GROUP_W} ${GROUP_H}`}
      style={style}
      pointerEvents="none"
    >
      {paths.map((d, i) => (
        <Path key={i} d={d} stroke="rgba(0, 61, 71, 0.22)" strokeWidth={0.6} fill="none" />
      ))}
    </Svg>
  );
}
