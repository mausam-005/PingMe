import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import Avatar from '../../components/Avatar';
import { useMyPings, useJoinedPings } from '../../hooks/usePings';
import { useFriendIds } from '../../hooks/useFriends';
import { confirmAction, showAlert } from '../../utils/alert';
import {
  getNotificationDiagnostics,
  sendLocalNotification,
} from '../../../backend/notificationService';

export default function ProfileScreen({ navigation }) {
  const { user, profile, logout } = useAuth();
  const myPings    = useMyPings();
  const joinedPings = useJoinedPings();
  const friendIds  = useFriendIds();
  const [notifInfo, setNotifInfo] = useState({ status: 'checking...', token: '...' });

  useEffect(() => {
    getNotificationDiagnostics().then(setNotifInfo);
  }, []);

  const handleTestNotification = async () => {
    if (Platform.OS === 'web') {
      showAlert('Mobile only', 'Local notifications appear on iOS/Android in Expo Go.');
      return;
    }
    try {
      await sendLocalNotification(
        'PingMe Live Alert',
        'Someone just joined your ping!',
        { pingId: myPings[0]?.id || 'demo-1' }
      );
    } catch (err) {
      showAlert('Notification Error', err.message);
    }
  };

  const handleLogout = () => {
    confirmAction('Sign Out', 'Are you sure you want to sign out?', 'Sign Out', logout);
  };

  const displayName = profile?.name || user?.displayName || 'User';
  const username    = profile?.username || 'user';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile Header */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.profileHead}>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
            <Avatar name={displayName} photoURL={profile?.photoURL} size={64} />
          </TouchableOpacity>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.username}>@{username}</Text>
        </Animated.View>

        {/* Minimal Stats */}
        <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{myPings.length}</Text>
            <Text style={styles.statLabel}>Created</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{friendIds.length}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{joinedPings.length}</Text>
            <Text style={styles.statLabel}>Joined</Text>
          </View>
        </Animated.View>

        {/* Action List */}
        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Device & Notification Status */}
        <Animated.View entering={FadeInDown.delay(210).springify()} style={styles.notifCard}>
          <View style={styles.notifTop}>
            <Text style={styles.notifTitle}>Notifications</Text>
            <Text style={styles.notifStatus}>{notifInfo.status}</Text>
          </View>
          <Text style={styles.notifToken} numberOfLines={2} selectable>
            Token: {notifInfo.token}
          </Text>
          <TouchableOpacity style={styles.testNotifBtn} onPress={handleTestNotification}>
            <Text style={styles.testNotifText}>Send Test Notification</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={[styles.menuText, { color: Colors.coral }]}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 40, width: '100%', maxWidth: 540, alignSelf: 'center' },
  profileHead: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  name: {
    fontFamily: Typography.sansBold,
    fontSize: Typography.xl,
    color: Colors.text,
    letterSpacing: -0.3,
    marginTop: 10,
    marginBottom: 2,
  },
  username: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    marginVertical: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontFamily: Typography.sansBold,
    fontSize: Typography.lg,
    color: Colors.text,
  },
  statLabel: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  menuGroup: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.text,
  },
  chevron: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  notifCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  notifTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.text,
  },
  notifStatus: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 11,
    color: Colors.accentLight,
  },
  notifToken: {
    fontFamily: Typography.sans,
    fontSize: 11,
    color: Colors.textMuted,
  },
  testNotifBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  testNotifText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 11,
    color: Colors.accentLight,
  },
});
