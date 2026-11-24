import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, StatusBar, ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../context/AuthContext';
import {
  searchUsersByUsername,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getUserProfile,
} from '../../../backend/friendService';
import { useFriends, useIncomingRequests, useOutgoingRequests } from '../../hooks/useFriends';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import Avatar from '../../components/Avatar';
import { EmptyState } from '../../components/UI';
import { SearchIcon } from '../../components/Icons';
import { showAlert } from '../../utils/alert';

export default function FriendsScreen() {
  const { user } = useAuth();
  const { friends, loading: friendsLoading } = useFriends();
  const incomingRequests = useIncomingRequests();
  const outgoingRequests = useOutgoingRequests();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState('friends');

  const [enrichedRequests, setEnrichedRequests] = useState([]);
  useEffect(() => {
    Promise.all(
      incomingRequests.map(async (r) => ({
        ...r,
        senderProfile: await getUserProfile(r.senderId),
      }))
    ).then(setEnrichedRequests);
  }, [incomingRequests]);

  const sentIds = outgoingRequests.map((r) => r.receiverId);
  const friendIds = friends.map((f) => f.uid);

  const handleSearch = async (text) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      if (text.trim().length === 0) setTab('friends');
      return;
    }
    setTab('search');
    setSearching(true);
    try {
      const res = await searchUsersByUsername(text.trim());
      setResults(res.filter((u) => u.uid !== user?.uid));
    } catch (e) {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSend = async (person) => {
    try {
      await sendFriendRequest(user?.uid || 'guest', person.uid);
      showAlert('Sent', `Request sent to ${person.name}.`);
    } catch (err) {
      showAlert('Error', err.message);
    }
  };

  const handleAccept = async (request, sender) => {
    try {
      await acceptFriendRequest(request.id, sender.uid, user?.uid || 'guest');
    } catch (err) {
      showAlert('Error', err.message);
    }
  };

  const handleReject = async (request) => {
    await rejectFriendRequest(request.id);
  };

  const handleRemove = async (person) => {
    await removeFriend(user?.uid || 'guest', person.uid);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Friends</Text>
        {incomingRequests.length > 0 && (
          <TouchableOpacity
            style={styles.badge}
            onPress={() => setTab('requests')}
          >
            <Text style={styles.badgeText}>{incomingRequests.length} new</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <SearchIcon size={14} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setTab('friends'); }}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      {query.length === 0 && (
        <View style={styles.tabsRow}>
          {[
            ['friends', 'Friends'],
            ['requests', `Requests${incomingRequests.length > 0 ? ` (${incomingRequests.length})` : ''}`],
          ].map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
              onPress={() => setTab(key)}
            >
              <Text style={[styles.tabBtnText, tab === key && styles.tabBtnTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Search Results */}
      {tab === 'search' && (
        <FlatList
          data={results}
          keyExtractor={(i) => i.uid}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            searching ? (
              <ActivityIndicator color={Colors.accent} style={{ marginTop: 30 }} />
            ) : (
              <EmptyState
                title="No users found"
                subtitle={query.length < 2 ? 'Type at least 2 characters to search.' : `No matches for "${query}"`}
              />
            )
          }
          renderItem={({ item, index }) => {
            const isFriend = friendIds.includes(item.uid);
            const isSent = sentIds.includes(item.uid);
            return (
              <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
                <View style={styles.friendRow}>
                  <Avatar name={item.name} photoURL={item.photoURL} size={38} />
                  <View style={styles.infoCol}>
                    <Text style={styles.nameText}>{item.name}</Text>
                    <Text style={styles.userText}>@{item.username}</Text>
                  </View>
                  {isFriend ? (
                    <Text style={styles.statusLabel}>Friends</Text>
                  ) : isSent ? (
                    <Text style={styles.statusLabel}>Sent</Text>
                  ) : (
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleSend(item)}>
                      <Text style={styles.acceptBtnText}>Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            );
          }}
        />
      )}

      {/* Friends list */}
      {tab === 'friends' && (
        <FlatList
          data={friends}
          keyExtractor={(i) => i.uid}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            friendsLoading ? (
              <ActivityIndicator color={Colors.accent} style={{ marginTop: 30 }} />
            ) : (
              <EmptyState
                title="No friends added"
                subtitle="Search users by handle to connect."
              />
            )
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
              <View style={styles.friendRow}>
                <Avatar name={item.name} photoURL={item.photoURL} size={38} />
                <View style={styles.infoCol}>
                  <Text style={styles.nameText}>{item.name}</Text>
                  <Text style={styles.userText}>@{item.username}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemove(item)}
                >
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        />
      )}

      {/* Requests */}
      {tab === 'requests' && (
        <FlatList
          data={enrichedRequests}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="No pending requests" />}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
              <View style={styles.friendRow}>
                <Avatar name={item.senderProfile?.name} photoURL={item.senderProfile?.photoURL} size={38} />
                <View style={styles.infoCol}>
                  <Text style={styles.nameText}>{item.senderProfile?.name}</Text>
                  <Text style={styles.userText}>@{item.senderProfile?.username}</Text>
                </View>
                <View style={styles.actionsGroup}>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item, item.senderProfile)}>
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)}>
                    <Text style={styles.rejectBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  badge: {
    backgroundColor: Colors.accentDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 10,
    color: Colors.accentLight,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.lg,
    paddingHorizontal: 12,
    marginVertical: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.text,
  },
  clearText: {
    fontSize: 12,
    color: Colors.textMuted,
    padding: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: 10,
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
    color: Colors.accentLight,
    fontFamily: Typography.sansSemiBold,
  },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 40, width: '100%', maxWidth: 540, alignSelf: 'center' },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoCol: { flex: 1, marginLeft: 12 },
  nameText: { fontFamily: Typography.sansSemiBold, fontSize: Typography.base, color: Colors.text },
  userText: { fontFamily: Typography.sans, fontSize: Typography.xs, color: Colors.textMuted },
  statusLabel: { fontFamily: Typography.sansMedium, fontSize: 11, color: Colors.textMuted },
  removeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  removeBtnText: { fontFamily: Typography.sansMedium, fontSize: 11, color: Colors.textSecondary },
  actionsGroup: { flexDirection: 'row', gap: 6 },
  acceptBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  acceptBtnText: { fontFamily: Typography.sansBold, fontSize: 11, color: Colors.white },
  rejectBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
  },
  rejectBtnText: { fontFamily: Typography.sans, fontSize: 11, color: Colors.textMuted },
});
