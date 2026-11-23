import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';

// Auth screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main screens
import FeedScreen from '../screens/home/FeedScreen';
import PingDetailsScreen from '../screens/home/PingDetailsScreen';
import PingChatScreen from '../screens/home/PingChatScreen';
import FriendsScreen from '../screens/friends/FriendsScreen';
import CreatePingScreen from '../screens/create/CreatePingScreen';
import MyPingsScreen from '../screens/pings/MyPingsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';

import { useAuth } from '../context/AuthContext';
import { Colors, Typography } from '../theme';
import { HomeIcon, FriendsIcon, MyPingsIcon, ProfileIcon, PlusIcon } from '../components/Icons';
import GradientSurface from '../components/GradientSurface';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function TabIcon({ name, focused }) {
  const activeColor   = Colors.accent;
  const inactiveColor = Colors.textMuted;
  const color = focused ? activeColor : inactiveColor;

  if (name === 'Create') {
    return (
      <GradientSurface style={tabStyles.createBtn}>
        <PlusIcon size={18} color={Colors.white} strokeWidth={2.4} />
      </GradientSurface>
    );
  }

  if (name === 'Home')    return <HomeIcon size={20} color={color} strokeWidth={focused ? 2.2 : 1.7} />;
  if (name === 'Friends') return <FriendsIcon size={20} color={color} strokeWidth={focused ? 2.2 : 1.7} />;
  if (name === 'MyPings') return <MyPingsIcon size={20} color={color} strokeWidth={focused ? 2.2 : 1.7} />;
  if (name === 'Profile') return <ProfileIcon size={20} color={color} strokeWidth={focused ? 2.2 : 1.7} />;

  return null;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: tabStyles.tabBar,
        tabBarLabelStyle: tabStyles.tabLabel,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home"    component={FeedScreen}      options={{ tabBarLabel: 'Feed' }} />
      <Tab.Screen name="Friends" component={FriendsScreen}   options={{ tabBarLabel: 'Friends' }} />
      <Tab.Screen
        name="Create"
        component={CreatePingScreen}
        options={{ tabBarLabel: '', tabBarIcon: () => <TabIcon name="Create" /> }}
      />
      <Tab.Screen name="MyPings" component={MyPingsScreen}   options={{ tabBarLabel: 'My Pings' }} />
      <Tab.Screen name="Profile" component={ProfileScreen}   options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator({ navigationRef }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="PingDetails"
              component={PingDetailsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="PingChat"
              component={PingChatScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome"  component={WelcomeScreen}  options={{ animation: 'fade' }} />
            <Stack.Screen name="Login"    component={LoginScreen}    options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ animation: 'slide_from_right' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const tabStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: Platform.OS === 'ios' ? 84 : 60,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
  },
  tabLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: 10,
    marginTop: 2,
  },
  createBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});
