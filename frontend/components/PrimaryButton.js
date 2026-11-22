import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Typography, Radius } from '../theme';
import GradientSurface from './GradientSurface';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function PrimaryButton({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger'
  size = 'md',          // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  icon = null,
  style,
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 18, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 18, stiffness: 400 });
  };

  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: Radius.md },
    md: { paddingVertical: 14, paddingHorizontal: 22, borderRadius: Radius.lg },
    lg: { paddingVertical: 16, paddingHorizontal: 28, borderRadius: Radius.lg },
  };

  const fontSize = { sm: Typography.sm, md: Typography.base, lg: Typography.md };
  const ss = sizeStyles[size] || sizeStyles.md;

  const isPrimary = variant === 'primary';
  const textColor =
    variant === 'secondary'
      ? Colors.text
      : variant === 'ghost'
        ? Colors.textSecondary
        : variant === 'danger'
          ? Colors.coral
          : Colors.white;

  const content = loading ? (
    <ActivityIndicator color={textColor} size="small" />
  ) : (
    <View style={styles.row}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={[styles.text, { color: textColor, fontSize: fontSize[size] }]}>{title}</Text>
    </View>
  );

  const nonPrimaryStyle =
    variant === 'secondary'
      ? styles.secondary
      : variant === 'danger'
        ? styles.danger
        : styles.ghost;

  return (
    <AnimatedTouchable
      style={[styles.base, disabled && styles.disabled, animatedStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.88}
      disabled={disabled || loading}
    >
      {isPrimary ? (
        <GradientSurface style={[styles.inner, ss]}>{content}</GradientSurface>
      ) : (
        <View style={[styles.inner, ss, nonPrimaryStyle]}>{content}</View>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'stretch',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  secondary: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.coralDim,
    borderWidth: 1,
    borderColor: Colors.coral + '44',
  },
  disabled: {
    opacity: 0.35,
  },
  text: {
    fontFamily: Typography.sansBold,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    marginRight: 8,
  },
});
