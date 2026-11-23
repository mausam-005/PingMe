import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';

import { useAuth } from '../../context/AuthContext';
import { createPing } from '../../../backend/pingService';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';
import { ClockIcon } from '../../components/Icons';
import { showAlert } from '../../utils/alert';

const QUICK_IDEAS = [
  { emoji: '☕', label: 'Coffee' },
  { emoji: '🏸', label: 'Sports' },
  { emoji: '📚', label: 'Study' },
  { emoji: '🚶', label: 'Walk' },
  { emoji: '🍕', label: 'Food' },
  { emoji: '🎮', label: 'Gaming' },
];

const SPOTS = [2, 3, 4, 6];

function format12h(date) {
  let h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function toHHMM(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function makeTimeDate(hours, minutes) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function NativeTimeField({ label, date, onChange }) {
  const [showPicker, setShowPicker] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.timeFieldWrap}>
        <Text style={styles.fieldMiniLabel}>{label}</Text>
        <input
          type="time"
          value={toHHMM(date)}
          onChange={(e) => {
            const [hh, mm] = (e.target.value || '').split(':').map(Number);
            if (!isNaN(hh) && !isNaN(mm)) onChange(makeTimeDate(hh, mm));
          }}
          style={{
            backgroundColor: Colors.surfaceElevated,
            color: Colors.text,
            border: `1px solid ${Colors.borderLight}`,
            borderRadius: 10,
            padding: '9px 12px',
            fontSize: 15,
            fontWeight: '600',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            outline: 'none',
            colorScheme: 'dark',
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.timeFieldWrap}>
      <Text style={styles.fieldMiniLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.nativeTimePill}
        onPress={() => setShowPicker((v) => !v)}
        activeOpacity={0.75}
      >
        <ClockIcon size={14} color={Colors.accentLight} />
        <Text style={styles.nativeTimeText}>{format12h(date)}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          themeVariant="dark"
          onChange={(event, selectedDate) => {
            if (Platform.OS === 'android') setShowPicker(false);
            if (event.type !== 'dismissed' && selectedDate) onChange(selectedDate);
          }}
        />
      )}
    </View>
  );
}

export default function CreatePingScreen({ navigation }) {
  const { user } = useAuth();
  const [activityName, setActivityName] = useState('');
  const [emoji, setEmoji] = useState('⚡');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [maxSpots, setMaxSpots] = useState(4);
  const [loading, setLoading] = useState(false);

  // Simple 2-way When: 'now' | 'pick'
  const [whenMode, setWhenMode] = useState('now');
  const [startTime, setStartTime] = useState(() => makeTimeDate(18, 0));
  const [useWindow, setUseWindow] = useState(false);
  const [endTime, setEndTime] = useState(() => makeTimeDate(22, 0));

  const timeSummary = useMemo(() => {
    const now = new Date();
    if (whenMode === 'now') {
      return {
        startDate: now,
        endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        label: 'Now',
      };
    }

    const start = new Date(now);
    start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    if (start < now) start.setDate(start.getDate() + 1);

    if (!useWindow) {
      return {
        startDate: start,
        endDate: new Date(start.getTime() + 24 * 60 * 60 * 1000),
        label: format12h(start),
      };
    }

    const end = new Date(start);
    end.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
    if (end <= start) end.setDate(end.getDate() + 1);

    return {
      startDate: start,
      endDate: end,
      label: `${format12h(start)} – ${format12h(end)}`,
    };
  }, [whenMode, startTime, useWindow, endTime]);

  const handleCreate = async () => {
    const cleanName = activityName.trim();
    if (!cleanName) {
      showAlert('Activity required', 'Enter what you want to do.');
      return;
    }

    setLoading(true);
    try {
      await createPing({
        ownerId: user?.uid || 'guest',
        activity: cleanName,
        emoji,
        description: description.trim(),
        scheduledAt: timeSummary.startDate,
        expiresAt: timeSummary.endDate,
        timeWindow: timeSummary.label,
        locationText: location.trim(),
        maxParticipants: maxSpots,
      });
      Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('Home');
    } catch (err) {
      showAlert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.inner}>
            <Text style={styles.headerTitle}>New Ping</Text>

            {/* Custom Activity Name + Quick Fill Chips */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>WHAT'S THE PLAN</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Late night coffee, Badminton, Study..."
                placeholderTextColor={Colors.textMuted}
                value={activityName}
                onChangeText={setActivityName}
                maxLength={40}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickRow}
                style={{ marginTop: 10 }}
              >
                {QUICK_IDEAS.map((idea) => {
                  const active = activityName.toLowerCase() === idea.label.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={idea.label}
                      style={[styles.ideaChip, active && styles.ideaChipActive]}
                      onPress={() => {
                        setActivityName(idea.label);
                        setEmoji(idea.emoji);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.ideaEmoji}>{idea.emoji}</Text>
                      <Text style={[styles.ideaText, active && styles.ideaTextActive]}>
                        {idea.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Note */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>NOTE (OPTIONAL)</Text>
              <TextInput
                style={styles.inputMultiline}
                placeholder="Quick details..."
                placeholderTextColor={Colors.textMuted}
                value={description}
                onChangeText={setDescription}
                maxLength={100}
                multiline
              />
            </View>

            {/* Simple 2-option When */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>WHEN</Text>
              <View style={styles.pillRow}>
                {[
                  ['now', 'Now'],
                  ['pick', 'Pick Time'],
                ].map(([key, label]) => {
                  const active = whenMode === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.optionPill, active && styles.optionPillActive]}
                      onPress={() => setWhenMode(key)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.optionPillText, active && styles.optionPillTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {whenMode === 'pick' && (
                <View style={styles.timeBox}>
                  <View style={styles.inlineFieldsRow}>
                    <NativeTimeField
                      label={useWindow ? 'From' : 'Time'}
                      date={startTime}
                      onChange={setStartTime}
                    />
                    {useWindow && (
                      <NativeTimeField
                        label="To"
                        date={endTime}
                        onChange={setEndTime}
                      />
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.windowToggle}
                    onPress={() => setUseWindow((v) => !v)}
                  >
                    <Text style={styles.windowToggleText}>
                      {useWindow ? '− Remove end time' : '+ Add end time (window)'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>LOCATION (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Canteen, Court 2, Library"
                placeholderTextColor={Colors.textMuted}
                value={location}
                onChangeText={setLocation}
                maxLength={50}
              />
            </View>

            {/* Max People */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MAX PEOPLE</Text>
              <View style={styles.pillRow}>
                {SPOTS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.optionPill, maxSpots === s && styles.optionPillActive]}
                    onPress={() => setMaxSpots(s)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionPillText, maxSpots === s && styles.optionPillTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <PrimaryButton
              title="Broadcast Ping"
              onPress={handleCreate}
              loading={loading}
              style={{ marginTop: 6 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 40 },
  inner: { width: '100%', maxWidth: 520, alignSelf: 'center' },
  headerTitle: {
    fontFamily: Typography.sansBold,
    fontWeight: '800',
    fontSize: 24,
    color: Colors.text,
    letterSpacing: -0.6,
    marginBottom: 20,
  },
  section: { marginBottom: 18 },
  sectionLabel: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  quickRow: { gap: 8, flexDirection: 'row' },
  ideaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ideaChipActive: { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  ideaEmoji: { fontSize: 13 },
  ideaText: { fontFamily: Typography.sansMedium, fontSize: 12, color: Colors.textSecondary },
  ideaTextActive: { color: Colors.accentLight, fontFamily: Typography.sansSemiBold },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.text,
  },
  inputMultiline: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.text,
    height: 64,
    textAlignVertical: 'top',
  },
  pillRow: { flexDirection: 'row', gap: 8 },
  optionPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionPillActive: { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  optionPillText: { fontFamily: Typography.sansMedium, fontSize: Typography.xs, color: Colors.textSecondary },
  optionPillTextActive: { color: Colors.accentLight, fontFamily: Typography.sansSemiBold },
  timeBox: {
    marginTop: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 10,
  },
  inlineFieldsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  timeFieldWrap: {
    flex: 1,
    gap: 5,
  },
  fieldMiniLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  nativeTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  nativeTimeText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.text,
  },
  windowToggle: {
    alignSelf: 'flex-start',
  },
  windowToggleText: {
    fontFamily: Typography.sansMedium,
    fontSize: 12,
    color: Colors.accentLight,
  },
});
