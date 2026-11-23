import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useAuth } from '../../context/AuthContext';
import { joinPing } from '../../../backend/pingService';
import { useFriendIds } from '../../hooks/useFriends';
import { useFriendsFeed } from '../../hooks/usePings';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import PingCard from '../../components/PingCard';
import Avatar from '../../components/Avatar';
import { EmptyState, SkeletonCard } from '../../components/UI';
import { PlusIcon } from '../../components/Icons';
import { PingMeLogo } from '../../components/Logo';
import GradientSurface from '../../components/GradientSurface';
import { showAlert } from '../../utils/alert';

const CATEGORIES = ['All', 'Coffee', 'Sports', 'Study', 'Food', 'Walk', 'Gaming'];

const CATEGORY_KEYWORDS = {
  Sports: ['sports', 'badminton', 'tennis', 'football', 'cricket', 'basketball', 'gym'],
};

export default function FeedScreen({ navigation }) {
  const { user, profile } = useAuth();
  const friendIds = useFriendIds();
  const feedIds = [...new Set([...friendIds, user?.uid])];
  const { pings, loading } = useFriendsFeed(feedIds);
  const [filter, setFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const filtered = filter === 'All'
    ? pings
    : pings.filter((p) => {
        const act = (p.activity || '').toLowerCase();
        const kws = CATEGORY_KEYWORDS[filter];
        return kws ? kws.some((k) => act.includes(k)) : act.includes(filter.toLowerCase());
      });

  const handleJoin = useCallback(
    async (ping) => {
      try {
        await joinPing(ping.id, user?.uid || 'guest');
        Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
      } catch (err) {
        Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Error);
        showAlert('Cannot join', err.message);
      }
    },
    [user?.uid]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Top Header: Logo + Avatar */}
      <View style={styles.header}>
        <PingMeLogo size="md" />
        <Avatar
          name={profile?.name || user?.displayName || 'User'}
          photoURL={profile?.photoURL}
          size={34}
          onPress={() => navigation.navigate('Profile')}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Action Bar & Filter Row */}
            <View style={styles.topControlRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
                contentContainerStyle={styles.chipRow}
              >
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.filterChip, filter === cat && styles.filterChipActive]}
                    onPress={() => setFilter(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, filter === cat && styles.filterChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                onPress={() => navigation.navigate('Create')}
                activeOpacity={0.85}
                style={{ flexShrink: 0 }}
              >
                <GradientSurface style={styles.newPingBtn}>
                  <PlusIcon size={14} color={Colors.white} />
                  <Text style={styles.newPingBtnText}>New</Text>
                </GradientSurface>
              </TouchableOpacity>
            </View>

            {/* Section Counter */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Happening now</Text>
              <View style={styles.countPill}>
                <Text style={styles.sectionCount}>{filtered.length}</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: 8 }}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : (
            <EmptyState
              title="No active pings"
              subtitle="Start a ping or check back later."
              action="+ Create Ping"
              onAction={() => navigation.navigate('Create')}
            />
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
            <PingCard
              ping={item}
              currentUserId={user?.uid || 'guest'}
              onJoin={handleJoin}
              onChat={(p) => navigation.navigate('PingChat', { ping: p })}
              onPress={() => navigation.navigate('PingDetails', { ping: item })}
            />
          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  listHeader: {
    paddingTop: Spacing.md,
    marginBottom: 8,
  },
  topControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  chipScroll: {
    flex: 1,
    minWidth: 0,
  },
  chipRow: {
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 4,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accent,
  },
  filterChipText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.accentLight,
    fontFamily: Typography.sansSemiBold,
    fontWeight: '600',
  },
  newPingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
  },
  newPingBtnText: {
    fontFamily: Typography.sansBold,
    fontWeight: '700',
    fontSize: Typography.xs,
    color: Colors.white,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Typography.sansBold,
    fontWeight: '700',
    fontSize: 15,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  countPill: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionCount: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
