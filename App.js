import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider } from './frontend/context/AuthContext';
import RootNavigator from './frontend/navigation/RootNavigator';
import {
  registerForPushNotifications,
  addNotificationResponseListener,
  addForegroundNotificationListener,
} from './backend/notificationService';
import { Colors } from './frontend/theme';

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        registerForPushNotifications(null);

        const cleanupTap = addNotificationResponseListener((response) => {
          const data = response?.notification?.request?.content?.data;
          if (data?.pingId && navigationRef.current) {
            navigationRef.current.navigate('PingDetails', { pingId: data.pingId });
          }
        });

        const cleanupForeground = addForegroundNotificationListener((notification) => {
          console.log('Notification received:', notification?.request?.content?.title);
        });

        return () => {
          cleanupTap?.();
          cleanupForeground?.();
        };
      } catch (e) {}
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigator navigationRef={navigationRef} />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
