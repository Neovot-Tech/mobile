import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { Brand } from '../theme';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

/** Minimal trend line for a series of vital readings (oldest → newest). */
export default function Sparkline({
  data,
  width = 96,
  height = 36,
  color = Brand.primary,
}: SparklineProps) {
  if (data.length < 2) return <View style={{ width, height }} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 3;
  const stepX = (width - pad * 2) / (data.length - 1);

  const points = data
    .map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + (1 - (v - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const lastX = pad + (data.length - 1) * stepX;
  const lastY = pad + (1 - (data[data.length - 1] - min) / range) * (height - pad * 2);

  return (
    <Svg width={width} height={height}>
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Circle cx={lastX} cy={lastY} r={2.5} fill={color} />
    </Svg>
  );
}
