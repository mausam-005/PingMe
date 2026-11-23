import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';
import { PingMeMark } from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';

export default function WelcomeScreen({ navigation }) {
  const { loginAsDemo } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={styles.container}>
        {/* Top Spacer */}
        <View style={styles.topSection}>
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.brandHero}>
            <PingMeMark size={52} />
            <Text style={styles.brandTitle}>PingMe</Text>
            <Text style={styles.tagline}>See who's up for what.</Text>
          </Animated.View>
        </View>

        {/* Action Controls */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.bottomSection}>
          <PrimaryButton
            title="Get Started"
            onPress={() => navigation.navigate('Register')}
            size="lg"
          />

          <PrimaryButton
            title="Sign In"
            onPress={() => navigation.navigate('Login')}
            variant="secondary"
            size="lg"
          />

          <TouchableOpacity
            style={styles.guestLink}
            onPress={loginAsDemo}
            activeOpacity={0.7}
          >
            <Text style={styles.guestText}>Continue as guest →</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
    paddingVertical: Spacing.xxl,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandHero: {
    alignItems: 'center',
  },
  brandTitle: {
    fontFamily: Typography.sansBold,
    fontWeight: '800',
    fontSize: 34,
    color: Colors.text,
    letterSpacing: -0.9,
    marginTop: 18,
    marginBottom: 6,
  },
  tagline: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    letterSpacing: -0.1,
  },
  bottomSection: {
    gap: 12,
  },
  guestLink: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  guestText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
});
