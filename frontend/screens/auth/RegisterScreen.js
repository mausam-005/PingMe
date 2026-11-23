import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';
import { StyledInput } from '../../components/UI';
import { showAlert } from '../../utils/alert';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Name required';
    if (username.length < 3) e.username = 'Min 3 chars';
    if (!email.includes('@')) e.email = 'Valid email required';
    if (password.length < 6) e.password = 'Min 6 chars';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register(email.trim(), password, name.trim(), username.trim());
    } catch (err) {
      showAlert('Sign up failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>

          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <Text style={styles.title}>Create Account</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.form}>
            <StyledInput label="Name" value={name} onChangeText={setName}
              placeholder="Your name" autoCapitalize="words" error={errors.name} />
            <StyledInput label="Username" value={username} onChangeText={setUsername}
              placeholder="username" error={errors.username} />
            <StyledInput label="Email" value={email} onChangeText={setEmail}
              placeholder="name@example.com" keyboardType="email-address" error={errors.email} />
            <StyledInput label="Password" value={password} onChangeText={setPassword}
              placeholder="••••••••" secureTextEntry error={errors.password} />

            <PrimaryButton title="Continue" onPress={handleRegister} loading={loading} style={{ marginTop: 10 }} />

            <TouchableOpacity style={styles.switchLink} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.switchText}>Already have an account?{' '}
                <Text style={styles.switchHighlight}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 40, width: '100%', maxWidth: 460, alignSelf: 'center' },
  backBtn: { marginBottom: Spacing.xl },
  backBtnText: { fontFamily: Typography.sansMedium, fontSize: Typography.sm, color: Colors.textMuted },
  title: { fontFamily: Typography.sansBold, fontSize: 28, color: Colors.text, letterSpacing: -0.5, marginBottom: 28 },
  form: { flex: 1 },
  switchLink: { alignItems: 'center', marginTop: 20 },
  switchText: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.textMuted },
  switchHighlight: { fontFamily: Typography.sansSemiBold, color: Colors.accent },
});
