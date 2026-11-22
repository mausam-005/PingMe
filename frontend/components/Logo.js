import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Colors, Typography } from '../theme';

/**
 * PingMe Radar Beacon Mark with warm Sunset Coral-Amber gradient
 */
export function PingMeMark({ size = 40 }) {
  return (
    <View style={[styles.markWrap, { width: size, height: size, borderRadius: size * 0.3 }]}>
      <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Defs>
          <LinearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.accent} />
            <Stop offset="100%" stopColor={Colors.accentEnd} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="40" height="40" rx={12} fill="url(#logoGrad)" />
        {/* Outer expanding ripple */}
        <Path
          d="M 8 20 A 12 12 0 0 1 32 20"
          stroke={Colors.white}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />
        {/* Inner pulse wave */}
        <Path
          d="M 12.5 20 A 7.5 7.5 0 0 1 27.5 20"
          stroke={Colors.white}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />
        {/* Core transmitter + beam */}
        <Circle cx="20" cy="20" r="3.4" fill={Colors.white} />
        <Path
          d="M 20 23.5 L 20 30.5"
          stroke={Colors.white}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

export function PingMeLogo({ size = 'md', style }) {
  const isLarge = size === 'lg';

  return (
    <View style={[styles.logoContainer, style]}>
      <PingMeMark size={isLarge ? 44 : 32} />
      <Text style={[styles.brandName, isLarge && styles.brandLarge]}>
        Ping<Text style={styles.brandAccent}>Me</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  markWrap: {
    overflow: 'hidden',
  },
  brandName: {
    fontFamily: Typography.sansBold,
    fontWeight: '800',
    fontSize: 20,
    color: Colors.text,
    letterSpacing: -0.6,
  },
  brandAccent: {
    color: Colors.accentLight,
  },
  brandLarge: {
    fontSize: 28,
  },
});
