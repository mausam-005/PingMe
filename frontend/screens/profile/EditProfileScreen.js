import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../../backend/profileService';
import { Colors, Typography, Spacing } from '../../theme';
import Avatar from '../../components/Avatar';
import PrimaryButton from '../../components/PrimaryButton';
import { StyledInput } from '../../components/UI';
import { showAlert } from '../../utils/alert';

export default function EditProfileScreen({ navigation }) {
  const { user, profile, updateLocalProfile } = useAuth();
  const [name, setName] = useState(profile?.name || user?.displayName || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || null);
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      pickAvatar();
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission needed', 'Grant camera access to take a profile photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoURL(result.assets[0].uri);
      Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission needed', 'Grant photo access to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });
    if (!result.canceled) {
      setPhotoURL(result.assets[0].uri);
      Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { showAlert('Name is required'); return; }
    setLoading(true);
    try {
      const updates = {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        photoURL,
      };
      await updateUserProfile(user?.uid || 'guest', updates);
      updateLocalProfile?.(updates);
      Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (err) {
      showAlert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.navCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.navSave}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarWrap}>
            <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8}>
              <Avatar name={name || 'U'} photoURL={photoURL} size={72} />
            </TouchableOpacity>
            <View style={styles.photoActionsRow}>
              <TouchableOpacity onPress={takePhoto}>
                <Text style={styles.photoActionText}>Take photo</Text>
              </TouchableOpacity>
              <Text style={styles.photoSep}>·</Text>
              <TouchableOpacity onPress={pickAvatar}>
                <Text style={styles.photoActionText}>Choose from gallery</Text>
              </TouchableOpacity>
            </View>
          </View>

          <StyledInput label="Display Name" value={name} onChangeText={setName} placeholder="Name" />
          <StyledInput label="Username" value={username} onChangeText={setUsername} placeholder="username" />
          <StyledInput label="Bio" value={bio} onChangeText={setBio} placeholder="Short bio..." multiline numberOfLines={2} maxLength={80} />

          <PrimaryButton title="Save Changes" onPress={handleSave} loading={loading} style={{ marginTop: 12 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navCancel: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.textMuted },
  navTitle: { fontFamily: Typography.sansSemiBold, fontSize: Typography.base, color: Colors.text },
  navSave: { fontFamily: Typography.sansSemiBold, fontSize: Typography.sm, color: Colors.accent },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  avatarWrap: { alignItems: 'center', paddingVertical: Spacing.lg },
  photoActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  photoActionText: { fontFamily: Typography.sansMedium, fontSize: Typography.xs, color: Colors.accentLight },
  photoSep: { color: Colors.textMuted, fontSize: Typography.xs },
});
