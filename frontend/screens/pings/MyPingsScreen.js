import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMyPings, useJoinedPings } from '../../hooks/usePings';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { EmptyState } from '../../components/UI';

export default function MyPingsScreen({ navigation }) {
  const myPings = useMyPings();
  const joinedPings = useJoinedPings();
  const [tab, setTab] = useState('created');

  const data = tab === 'created' ? myPings : joinedPings;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.header}>
        <Text style={styles.heading}>My Pings</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {[['created', 'Created'], ['joined', 'Joined']].map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabBtnText, tab === key && styles.tabBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title={tab === 'created' ? 'No created pings' : 'No joined pings'}
            subtitle={tab === 'created' ? 'Broadcast an activity to get started.' : 'Browse the feed to join activities.'}
            action={tab === 'created' ? '+ Create Ping' : undefined}
            onAction={() => navigation.navigate('Create')}
          />
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
            <TouchableOpacity
              style={styles.pingCard}
              onPress={() => navigation.navigate('PingDetails', { ping: item })}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={styles.activityLabel}>
                  <Text style={styles.emoji}>{item.emoji || '⚡'}</Text>
                  <Text style={styles.title}>{item.activity}</Text>
                </View>
                <View style={[styles.statusBadge, item.status === 'full' && styles.statusBadgeFull]}>
                  <Text style={[styles.statusText, item.status === 'full' && styles.statusTextFull]}>
                    {item.status || 'Active'}
                  </Text>
                </View>
              </View>

              {item.description ? (
                <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
              ) : null}

              <View style={styles.cardFooter}>
                <Text style={styles.footerMeta}>
                  {item.participantCount || 1}/{item.maxParticipants || 4} spots
                  {(item.timeWindow || item.time) ? ` · ${item.timeWindow || item.time}` : ''}
                  {item.locationText ? ` · ${item.locationText}` : ''}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  heading: {
    fontFamily: Typography.sansBold,
    fontSize: 22,
    color: Colors.text,
    letterSpacing: -0.4,
  },
  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginVertical: 10,
    gap: 6,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.surfaceElevated,
  },
  tabBtnText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  tabBtnTextActive: {
    color: Colors.accent,
    fontFamily: Typography.sansSemiBold,
  },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 40, width: '100%', maxWidth: 540, alignSelf: 'center' },
  pingCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emoji: { fontSize: 14 },
  title: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.text,
  },
  statusBadge: {
    backgroundColor: Colors.accentDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusBadgeFull: {
    backgroundColor: Colors.coralDim,
  },
  statusText: {
    fontFamily: Typography.sansMedium,
    fontSize: 10,
    color: Colors.accent,
  },
  statusTextFull: {
    color: Colors.coral,
  },
  description: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  footerMeta: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
});
