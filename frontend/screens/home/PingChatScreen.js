import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, StatusBar, Image, Share, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';

import { useAuth } from '../../context/AuthContext';
import { subscribePingChat, sendChatMessage } from '../../../backend/chatService';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import GradientSurface from '../../components/GradientSurface';
import { ImageIcon, PaperclipIcon, SendIcon } from '../../components/Icons';
import { showAlert } from '../../utils/alert';

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PingChatScreen({ route, navigation }) {
  const { user, profile } = useAuth();
  const ping = route.params?.ping || { id: 'demo-1', activity: 'Activity Chat', emoji: '⚡', participantCount: 1 };
  const currentUserId = user?.uid || 'guest';
  const senderName = profile?.name || user?.displayName || 'You';

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    const unsub = subscribePingChat(ping.id, (msgs) => {
      setMessages(msgs);
    });
    return unsub;
  }, [ping.id]);

  const handleSendText = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    await sendChatMessage(ping.id, {
      senderId: currentUserId,
      senderName,
      type: 'text',
      text: trimmed,
    });
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
  };

  const launchGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission needed', 'Allow photo access to share images.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.75,
      });
      if (!res.canceled && res.assets?.[0]) {
        await sendChatMessage(ping.id, {
          senderId: currentUserId,
          senderName,
          type: 'image',
          mediaUri: res.assets[0].uri,
        });
      }
    } catch (err) {
      showAlert('Error', err.message);
    }
  };

  const launchCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission needed', 'Allow camera access to take photos.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({ quality: 0.75 });
      if (!res.canceled && res.assets?.[0]) {
        await sendChatMessage(ping.id, {
          senderId: currentUserId,
          senderName,
          type: 'image',
          mediaUri: res.assets[0].uri,
        });
      }
    } catch (err) {
      showAlert('Error', err.message);
    }
  };

  const handlePickImage = () => {
    if (Platform.OS === 'web') {
      launchGallery();
      return;
    }
    Alert.alert('Share Photo', 'Choose a source', [
      { text: 'Camera', onPress: launchCamera },
      { text: 'Gallery', onPress: launchGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handlePickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (!res.canceled && res.assets?.[0]) {
        const asset = res.assets[0];
        await sendChatMessage(ping.id, {
          senderId: currentUserId,
          senderName,
          type: 'file',
          fileName: asset.name || 'Shared file',
          fileSize: asset.size,
          mediaUri: asset.uri,
        });
      }
    } catch (err) {
      showAlert('Error', err.message);
    }
  };

  const handleShareFile = async (item) => {
    try {
      await Share.share({
        title: item.fileName || 'Shared file',
        message: item.fileName ? `${item.fileName}` : 'Shared from PingMe',
        url: item.mediaUri,
      });
    } catch (e) {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {ping.emoji || '⚡'} {ping.activity}
          </Text>
          <Text style={styles.headerSub}>
            {ping.participantCount || 1} in group
          </Text>
        </View>

        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No messages yet. Say hi to the group.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMine = item.senderId === currentUserId;
            return (
              <View style={[styles.msgWrap, isMine ? styles.msgRight : styles.msgLeft]}>
                {!isMine && <Text style={styles.senderName}>{item.senderName}</Text>}

                {item.type === 'image' && item.mediaUri ? (
                  <View style={[styles.mediaBubble, isMine ? styles.bubbleMineBorder : styles.bubbleOther]}>
                    <Image source={{ uri: item.mediaUri }} style={styles.msgImage} />
                    {item.timeLabel ? <Text style={styles.timeMeta}>{item.timeLabel}</Text> : null}
                  </View>
                ) : item.type === 'file' ? (
                  <TouchableOpacity
                    style={[styles.fileBubble, isMine ? styles.bubbleMineBorder : styles.bubbleOther]}
                    onPress={() => handleShareFile(item)}
                    activeOpacity={0.8}
                  >
                    <PaperclipIcon size={15} color={Colors.accentLight} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.fileName} numberOfLines={1}>{item.fileName}</Text>
                      {item.fileSize ? (
                        <Text style={styles.fileSize}>{formatBytes(item.fileSize)}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ) : isMine ? (
                  <GradientSurface style={styles.bubbleMine}>
                    <Text style={styles.msgTextMine}>{item.text}</Text>
                    {item.timeLabel ? <Text style={styles.timeMetaMine}>{item.timeLabel}</Text> : null}
                  </GradientSurface>
                ) : (
                  <View style={styles.bubbleOther}>
                    <Text style={styles.msgTextOther}>{item.text}</Text>
                    {item.timeLabel ? <Text style={styles.timeMeta}>{item.timeLabel}</Text> : null}
                  </View>
                )}
              </View>
            );
          }}
        />

        {/* Composer */}
        <View style={styles.composerWrap}>
          <View style={styles.composerInner}>
            <TouchableOpacity style={styles.attachBtn} onPress={handlePickImage}>
              <ImageIcon size={19} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachBtn} onPress={handlePickFile}>
              <PaperclipIcon size={19} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Message group..."
              placeholderTextColor={Colors.textMuted}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
            />

            <TouchableOpacity onPress={handleSendText} activeOpacity={0.8}>
              <GradientSurface style={styles.sendBtn}>
                <SendIcon size={15} color={Colors.white} />
              </GradientSurface>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  backBtn: { fontFamily: Typography.sansMedium, fontSize: Typography.sm, color: Colors.textSecondary },
  headerCenter: { alignItems: 'center', flex: 1, paddingHorizontal: 10 },
  headerTitle: {
    fontFamily: Typography.sansBold,
    fontWeight: '700',
    fontSize: Typography.base,
    color: Colors.text,
  },
  headerSub: { fontFamily: Typography.sans, fontSize: 11, color: Colors.textMuted },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 16,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    flexGrow: 1,
  },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { fontFamily: Typography.sans, fontSize: Typography.sm, color: Colors.textMuted },
  msgWrap: { marginBottom: 12, maxWidth: '80%' },
  msgLeft: { alignSelf: 'flex-start' },
  msgRight: { alignSelf: 'flex-end' },
  senderName: { fontFamily: Typography.sansMedium, fontSize: 11, color: Colors.textMuted, marginBottom: 3 },
  bubbleMine: {
    borderRadius: Radius.lg,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOther: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMineBorder: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.lg,
    padding: 8,
  },
  msgTextMine: { fontFamily: Typography.sans, fontSize: Typography.base, color: Colors.white, lineHeight: 20 },
  msgTextOther: { fontFamily: Typography.sans, fontSize: Typography.base, color: Colors.text, lineHeight: 20 },
  timeMeta: { fontFamily: Typography.sans, fontSize: 10, color: Colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  timeMetaMine: { fontFamily: Typography.sans, fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 4, alignSelf: 'flex-end' },
  mediaBubble: { overflow: 'hidden', borderRadius: Radius.lg },
  msgImage: { width: 210, height: 160, borderRadius: Radius.md, resizeMode: 'cover' },
  fileBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 180,
  },
  fileName: { fontFamily: Typography.sansSemiBold, fontSize: 13, color: Colors.text },
  fileSize: { fontFamily: Typography.sans, fontSize: 11, color: Colors.textMuted },
  composerWrap: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  composerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  attachBtn: {
    padding: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.text,
    maxHeight: 90,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
