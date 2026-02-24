import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, RADIUS, FONT_SIZE } from '../constants/theme';

interface Props {
  progress: number; // 0-100
  height?: number;
  showLabel?: boolean;
}

export default function ProgressBar({ progress, height = 10, showLabel = false }: Props) {
  const { theme, isDark } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: progress,
      useNativeDriver: false,
      tension: 40,
      friction: 8,
    }).start();
  }, [progress]);

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const color = progress >= 100
    ? COLORS.success
    : progress >= 60
    ? COLORS.accent
    : COLORS.info;

  return (
    <View>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Progress</Text>
          <Text style={[styles.pct, { color: color }]}>{Math.round(progress)}%</Text>
        </View>
      )}
      <View style={[styles.track, { height, backgroundColor: isDark ? '#243460' : '#E8EDF8', borderRadius: height / 2 }]}>
        <Animated.View
          style={[
            styles.fill,
            { width, height, borderRadius: height / 2, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden', width: '100%' },
  fill: {},
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: FONT_SIZE.sm },
  pct: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
});
