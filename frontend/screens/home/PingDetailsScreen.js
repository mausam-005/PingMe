import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, StatusBar
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { doc, getDoc } from 'firebase/firestore';

import { useAuth } from '../../context/AuthContext';
import { db } from '../../../backend/firebase';
import { joinPing, leavePing, closePing, SAMPLE_PINGS } from '../../../backend/pingService';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';
import Avatar from '../../components/Avatar';
import { PinIcon, UsersIcon, ClockIcon } from '../../components/Icons';
import { showAlert, confirmAction } from '../../utils/alert';

export default function PingDetailsScreen({ route, navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchedPing, setFetchedPing] = useState(null);

  const paramPing = route.params?.ping;
  const paramPingId = route.params?.pingId;

  useEffect(() => {
    if (!paramPing && paramPingId) {
      const local = SAMPLE_PINGS.find((p) => p.id === paramPingId);
      if (local) {
        setFetchedPing(local);
      } else {
        getDoc(doc(db, 'pings', paramPingId))
          .then((snap) => {
            if (snap.exists()) setFetchedPing({ id: snap.id, ...snap.data() });
          })
          .catch(() => {});
      }
    }
  }, [paramPing, paramPingId]);

  const ping = paramPing || fetchedPing || SAMPLE_PINGS[0];

  const isOwner = ping.ownerId === (user?.uid || 'guest');
  const hasJoined = ping.participantIds?.includes(user?.uid || 'guest');
  const isFull = (ping.participantCount || 1) >= (ping.maxParticipants || 4);

  const handleJoin = async () => {
    setLoading(true);
    try {
      await joinPing(ping.id, user?.uid || 'guest');
      Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (err) {
      showAlert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = () => {
    confirmAction('Leave Ping', 'Are you sure you want to leave?', 'Leave', async () => {
      try {
        await leavePing(ping.id, user?.uid || 'guest');
        navigation.goBack();
      } catch (err) {
        showAlert('Error', err.message);
      }
    });
  };

  const handleClose = () => {
    confirmAction('Close Ping', 'End this activity for everyone?', 'Close', async () => {
      await closePing(ping.id, user?.uid || 'guest');
      navigation.goBack();
    });
  };

  const handleShare = async () => {
    await Share.share({
      message: `Anyone up for ${ping.activity}? Join on PingMe.`,
      title: `PingMe — ${ping.activity}`,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare}>
          <Text style={styles.shareBtn}>Share ↗</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(40).springify()}>
          <View style={styles.titleRow}>
            <Text style={styles.emoji}>{ping.emoji || '⚡'}</Text>
            <Text style={styles.title}>{ping.activity}</Text>
          </View>

          {ping.description ? (
            <Text style={styles.description}>{ping.description}</Text>
          ) : null}

          {/* Details pills */}
          <View style={styles.pillsRow}>
            {(ping.timeWindow || ping.time) ? (
              <View style={styles.pill}>
                <ClockIcon size={13} color={Colors.accentLight} />
                <Text style={[styles.pillText, { color: Colors.accentLight }]}>
                  {ping.timeWindow || ping.time}
                </Text>
              </View>
            ) : null}
            {ping.locationText ? (
              <View style={styles.pill}>
                <PinIcon size={13} color={Colors.textMuted} />
                <Text style={styles.pillText}>{ping.locationText}</Text>
              </View>
            ) : null}
            <View style={styles.pill}>
              <UsersIcon size={13} color={Colors.textMuted} />
              <Text style={styles.pillText}>{ping.participantCount || 1}/{ping.maxParticipants || 4} spots</Text>
            </View>
          </View>
        </Animated.View>

        {/* Participants */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.participantsSection}>
          <Text style={styles.sectionTitle}>PARTICIPANTS</Text>
          {(ping.participantNames || ['Member']).map((name, i) => (
            <View key={i} style={styles.participantRow}>
              <Avatar name={name} size={32} />
              <Text style={styles.participantName}>{name}</Text>
              {i === 0 && <Text style={styles.ownerTag}>Host</Text>}
            </View>
          ))}
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.ctaArea}>
          {(hasJoined || isOwner) && (
            <PrimaryButton
              title="Open Group Chat"
              onPress={() => navigation.navigate('PingChat', { ping })}
              size="lg"
              style={{ marginBottom: 10 }}
            />
          )}
          {!isOwner && !hasJoined && !isFull && (
            <PrimaryButton title="I'm in" onPress={handleJoin} loading={loading} size="lg" />
          )}
          {hasJoined && !isOwner && (
            <PrimaryButton title="Leave Ping" onPress={handleLeave} variant="secondary" />
          )}
          {isOwner && ping.status === 'active' && (
            <PrimaryButton title="Close Ping" onPress={handleClose} variant="danger" />
          )}
          {isFull && !hasJoined && (
            <Text style={styles.fullNotice}>This activity is currently full.</Text>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { fontFamily: Typography.sansMedium, fontSize: Typography.sm, color: Colors.textMuted },
  shareBtn: { fontFamily: Typography.sansSemiBold, fontSize: Typography.sm, color: Colors.accent },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 40, paddingTop: 16, width: '100%', maxWidth: 540, alignSelf: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  emoji: { fontSize: 22 },
  title: {
    fontFamily: Typography.sansBold,
    fontSize: 24,
    color: Colors.text,
    letterSpacing: -0.4,
  },
  description: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
  },
  pillText: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  participantsSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  participantName: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.text,
    flex: 1,
  },
  ownerTag: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 10,
    color: Colors.accent,
    backgroundColor: Colors.accentDim,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  ctaArea: {
    marginTop: 8,
  },
  fullNotice: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.coral,
    textAlign: 'center',
    marginTop: 8,
  },
});
