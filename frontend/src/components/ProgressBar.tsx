/**
 * ProgressBar.tsx
 *
 * Animated horizontal progress bar with dynamic colour based on budget utilisation.
 *
 * Props:
 *   percent   — raw percentage value (0–100+). Visual fill is clamped to 100%.
 *   color     — hex fill colour from getProgressColor(). Dynamic per threshold.
 *   animated  — default true. Animates fill width from 0 → final on mount (600ms).
 *
 * Dimensions (DESIGN_SYSTEM.md §6):
 *   Height: 20px, BorderRadius: 10px, Track: #e5e7eb, fills parent width.
 *
 * Animation (DESIGN_SYSTEM.md §8):
 *   Animated.timing, 600ms, Easing.out(Easing.quad), useNativeDriver: false.
 *   Uses Animated.Value interpolated to '0%'–'100%' for width.
 *
 * Usage:
 *   const pct   = (totalSpent / budget) * 100;
 *   const color = getProgressColor(pct);
 *   <ProgressBar percent={pct} color={color} />
 */

import React, { useRef, useEffect } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';

interface ProgressBarProps {
  percent: number;
  color: string;
  animated?: boolean;
}

export default function ProgressBar({
  percent,
  color,
  animated = true,
}: ProgressBarProps): React.ReactElement {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const clampedPercent = Math.min(Math.max(percent, 0), 100);

  useEffect(() => {
    if (animated) {
      animatedWidth.setValue(0);
      Animated.timing(animatedWidth, {
        toValue: clampedPercent,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(clampedPercent);
    }
  }, [clampedPercent, animated]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.track}>
      <Animated.View
        style={[
          styles.fill,
          { width: widthInterpolated, backgroundColor: color },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: 10,
  },
});
