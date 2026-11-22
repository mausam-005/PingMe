import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme';

/**
 * Native cross-platform linear gradient surface using expo-linear-gradient.
 */
export default function GradientSurface({
  colors = [Colors.accent, Colors.accentEnd],
  style,
  children,
}) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
