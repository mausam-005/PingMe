// src/services/notificationService.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// Configure how notifications appear when app is foregrounded
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// ─── Request permission and get Expo push token ───────────────────────────────
export async function registerForPushNotifications(userId) {
  if (Platform.OS === 'web') return null;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#9C6644',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    if (userId) {
      await updateDoc(doc(db, 'users', userId), { expoPushToken: token });
    }
    return token;
  } catch (err) {
    console.warn('Push token skipped:', err.message);
    return null;
  }
}

// ─── Get permission status & token for diagnostics / viva demo ───────────────
export async function getNotificationDiagnostics() {
  if (Platform.OS === 'web') {
    return { status: 'web-unsupported', token: 'Expo Go mobile only' };
  }
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return { status: finalStatus, token: 'Permission denied' };
    }
    try {
      const tokenObj = await Notifications.getExpoPushTokenAsync();
      return { status: finalStatus, token: tokenObj.data };
    } catch (e) {
      const deviceToken = await Notifications.getDevicePushTokenAsync().catch(() => null);
      return {
        status: finalStatus,
        token: deviceToken?.data ? String(deviceToken.data) : 'Local ready (no EAS projectId)',
      };
    }
  } catch (err) {
    return { status: 'error', token: err?.message || 'Unavailable' };
  }
}

// ─── Schedule a local notification ──────────────────────────────────────────
export async function sendLocalNotification(title, body, data = {}) {
  if (Platform.OS === 'web') return null;
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: null,
  });
}

// ─── Listen to notification tap ──────────────────────────────────────────────
export function addNotificationResponseListener(handler) {
  if (Platform.OS === 'web') return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener(handler);
  return () => sub.remove();
}

// ─── Listen to foreground notifications ──────────────────────────────────────
export function addForegroundNotificationListener(handler) {
  if (Platform.OS === 'web') return () => {};
  const sub = Notifications.addNotificationReceivedListener(handler);
  return () => sub.remove();
}
