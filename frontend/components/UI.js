import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme';

export function StyledInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  error,
  multiline,
  numberOfLines,
  maxLength,
  style,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.inputGroup, style]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error && styles.inputError,
          multiline && styles.inputMultiline,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

export function EmptyState({ title, subtitle, action, onAction }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>{title || 'No active pings'}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
      {action && (
        <TouchableOpacity style={styles.emptyAction} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.emptyActionText}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.skeleton}>
      <View style={styles.skeletonBar1} />
      <View style={styles.skeletonBar2} />
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.text,
  },
  inputFocused: {
    borderColor: Colors.accent,
  },
  inputError: {
    borderColor: Colors.coral,
  },
  inputMultiline: {
    height: 84,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  errorText: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.coral,
    marginTop: 4,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.md,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyAction: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.full,
  },
  emptyActionText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.accent,
  },
  skeleton: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    gap: 8,
  },
  skeletonBar1: {
    height: 14,
    width: '40%',
    backgroundColor: Colors.border,
    borderRadius: 4,
  },
  skeletonBar2: {
    height: 10,
    width: '75%',
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
  },
});
