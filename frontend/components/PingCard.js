import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Typography, Radius } from '../theme';
import { PinIcon, UsersIcon, ClockIcon, ChatIcon } from './Icons';
import GradientSurface from './GradientSurface';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function PingCard({ ping, onJoin, onChat, onPress, currentUserId }) {
  const scale = useSharedValue(1);
  const isOwner = ping.ownerId === currentUserId;
  const joined = ping.participantIds?.includes(currentUserId) || ping.participants?.includes(currentUserId);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.985, { damping: 20, stiffness: 400 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
  };

  const spotsFilled = ping.participantCount || ping.participants?.length || 1;
  const spotsTotal  = ping.maxParticipants || 4;
  const isFull      = spotsFilled >= spotsTotal;
  const isActive    = ping.status === 'active';
  const statusLabel = isActive && !isFull ? 'Live' : isFull ? 'Full' : 'Closed';
  const fillPct     = Math.min(100, (spotsFilled / spotsTotal) * 100);

  return (
    <AnimatedTouchable
      style={[styles.card, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.92}
    >
      {/* Top row: Title + concise Status */}
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.emoji}>{ping.emoji || '⚡'}</Text>
          <Text style={styles.activityTitle} numberOfLines={1} ellipsizeMode="tail">
            {ping.activity}
          </Text>
        </View>

        <View style={[styles.statusBadge, isFull && styles.statusBadgeFull]}>
          <View style={[styles.statusDot, isFull && styles.statusDotFull]} />
          <Text style={[styles.statusText, isFull && styles.statusTextFull]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Description */}
      {ping.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {ping.description}
        </Text>
      ) : null}

      {/* Responsive Meta tags (wraps cleanly on narrow phones) */}
      <View style={styles.metaRow}>
        {(ping.timeWindow || ping.time) ? (
          <View style={styles.metaItem}>
            <ClockIcon size={12} color={Colors.accentLight} />
            <Text style={[styles.metaText, { color: Colors.accentLight }]} numberOfLines={1}>
              {ping.timeWindow || ping.time}
            </Text>
          </View>
        ) : null}

        {ping.locationText ? (
          <View style={styles.metaItem}>
            <PinIcon size={12} color={Colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>{ping.locationText}</Text>
          </View>
        ) : null}

        <View style={styles.metaItem}>
          <UsersIcon size={12} color={Colors.textMuted} />
          <Text style={styles.metaText}>
            {spotsFilled}/{spotsTotal} spots
          </Text>
        </View>
      </View>

      {/* Capacity bar */}
      <View style={styles.progressTrack}>
        {isFull ? (
          <View style={[styles.progressFill, { width: `${fillPct}%`, backgroundColor: Colors.coral }]} />
        ) : (
          <GradientSurface style={[styles.progressFill, { width: `${fillPct}%` }]} />
        )}
      </View>

      {/* Bottom action row */}
      <View style={styles.actionRow}>
        <View style={styles.avatarsPreview}>
          {(ping.participantNames || []).slice(0, 3).map((name, i) => (
            <View key={i} style={[styles.miniAvatar, { marginLeft: i === 0 ? 0 : -6 }]}>
              <Text style={styles.miniAvatarLetter}>{name?.[0]?.toUpperCase()}</Text>
            </View>
          ))}
          {spotsFilled > 3 && (
            <Text style={styles.moreCount}>+{spotsFilled - 3}</Text>
          )}
        </View>

        {!joined && !isOwner && !isFull && isActive && (
          <TouchableOpacity onPress={() => onJoin?.(ping)} activeOpacity={0.8}>
            <GradientSurface style={styles.joinBtn}>
              <Text style={styles.joinBtnText}>Join</Text>
            </GradientSurface>
          </TouchableOpacity>
        )}

        {(joined || isOwner) && (
          <View style={styles.joinedActions}>
            <View style={styles.joinedTag}>
              <Text style={styles.joinedTagText}>{isOwner ? 'Host' : 'Joined'}</Text>
            </View>
            {onChat && (
              <TouchableOpacity
                style={styles.chatPill}
                onPress={() => onChat(ping)}
                activeOpacity={0.8}
              >
                <ChatIcon size={13} color={Colors.accentLight} />
                <Text style={styles.chatPillText}>Chat</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isFull && !joined && !isOwner && (
          <Text style={styles.fullLabel}>Full</Text>
        )}
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  emoji: {
    fontSize: 17,
  },
  activityTitle: {
    fontFamily: Typography.sansBold,
    fontWeight: '700',
    fontSize: 16,
    color: Colors.text,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.accentDim,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  statusBadgeFull: {
    backgroundColor: Colors.coralDim,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  statusDotFull: {
    backgroundColor: Colors.coral,
  },
  statusText: {
    fontFamily: Typography.sansSemiBold,
    fontWeight: '600',
    fontSize: 11,
    color: Colors.accentLight,
  },
  statusTextFull: {
    color: Colors.coral,
  },
  description: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 14,
    rowGap: 6,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '100%',
  },
  metaText: {
    fontFamily: Typography.sansMedium,
    fontSize: 12,
    color: Colors.textMuted,
    flexShrink: 1,
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarLetter: {
    fontFamily: Typography.sansBold,
    fontWeight: '700',
    fontSize: 10,
    color: Colors.textSecondary,
  },
  moreCount: {
    fontFamily: Typography.sans,
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 6,
  },
  joinBtn: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: Radius.full,
  },
  joinBtnText: {
    fontFamily: Typography.sansBold,
    fontWeight: '700',
    fontSize: 12,
    color: Colors.white,
  },
  joinedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.full,
  },
  chatPillText: {
    fontFamily: Typography.sansSemiBold,
    fontWeight: '600',
    fontSize: 12,
    color: Colors.accentLight,
  },
  joinedTag: {
    paddingVertical: 6,
    paddingHorizontal: 13,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.full,
  },
  joinedTagText: {
    fontFamily: Typography.sansSemiBold,
    fontWeight: '600',
    fontSize: 12,
    color: Colors.accentLight,
  },
  fullLabel: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 12,
    color: Colors.coral,
  },
});
