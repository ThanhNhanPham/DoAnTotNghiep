import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import chatService, { ChatMessage, ChatRoom } from '@/services/chatService';

const POLL_INTERVAL_MS = 5000;

const formatDateTime = (value?: string | null) => {
  if (!value) return '';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  return parsed.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
};

export default function BookingChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingId = Number(params.bookingId);

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const loadRoomAndMessages = useCallback(async (refreshing = false) => {
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      setIsLoading(false);
      Alert.alert('Lỗi', 'Không tìm thấy booking để mở chat.');
      return;
    }

    try {
      if (refreshing) {
        setIsRefreshing(true);
      }

      const roomData = await chatService.createOrGetRoom(bookingId);
      setRoom(roomData);

      const messageData = await chatService.getMessages(roomData.id);
      setMessages(Array.isArray(messageData) ? messageData : []);
      await chatService.markRoomAsRead(roomData.id);
    } catch (error: any) {
      console.error('Load booking chat failed:', error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Không thể tải cuộc trò chuyện lúc này.';
      Alert.alert('Lỗi', String(serverMessage));
    } finally {
      setIsLoading(false);
      if (refreshing) {
        setIsRefreshing(false);
      }
    }
  }, [bookingId]);

  useFocusEffect(
    useCallback(() => {
      loadRoomAndMessages();
    }, [loadRoomAndMessages])
  );

  useEffect(() => {
    if (!room?.id) return undefined;

    const intervalId = setInterval(() => {
      loadRoomAndMessages(false);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [loadRoomAndMessages, room?.id]);

  const handleSendMessage = async () => {
    const trimmed = draft.trim();
    if (!room?.id || !trimmed) return;

    try {
      setIsSending(true);
      const sentMessage = await chatService.sendMessage(room.id, trimmed);
      setMessages((prev) => [...prev, sentMessage]);
      setDraft('');
    } catch (error: any) {
      console.error('Send booking chat message failed:', error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Không thể gửi tin nhắn lúc này.';
      Alert.alert('Lỗi', String(serverMessage));
    } finally {
      setIsSending(false);
    }
  };

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      ),
    [messages]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}>
        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color="#0F766E" />
            <Text style={styles.loadingText}>Đang tải cuộc trò chuyện...</Text>
          </View>
        ) : (
          <>
            <View style={styles.headerCard}>
              <Text style={styles.headerTitle}>{room?.branchName || 'Chat với gara'}</Text>
              <Text style={styles.headerMeta}>
                Booking #{room?.bookingId} {room?.licensePlate ? `· ${room.licensePlate}` : ''}
              </Text>
            </View>

            <ScrollView
              contentContainerStyle={styles.threadContent}
              style={styles.thread}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => loadRoomAndMessages(true)}
                  tintColor="#0F766E"
                />
              }>
              {sortedMessages.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubble-ellipses-outline" size={28} color="#0F766E" />
                  <Text style={styles.emptyTitle}>Chưa có tin nhắn</Text>
                  <Text style={styles.emptyText}>Bạn có thể bắt đầu trao đổi với admin chi nhánh từ đây.</Text>
                </View>
              ) : (
                sortedMessages.map((item) => {
                  const isMine = item.senderRole === 'CUSTOMER';

                  return (
                    <View
                      key={item.id}
                      style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowTheirs]}>
                      <View
                        style={[
                          styles.messageBubble,
                          isMine ? styles.messageBubbleMine : styles.messageBubbleTheirs,
                        ]}>
                        <Text
                          style={[
                            styles.messageAuthor,
                            isMine ? styles.messageAuthorMine : styles.messageAuthorTheirs,
                          ]}>
                          {item.senderName || (isMine ? 'Bạn' : 'Gara')}
                        </Text>
                        <Text style={[styles.messageText, isMine ? styles.messageTextMine : styles.messageTextTheirs]}>
                          {item.content}
                        </Text>
                        <Text style={[styles.messageTime, isMine ? styles.messageTimeMine : styles.messageTimeTheirs]}>
                          {formatDateTime(item.createdAt)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.composer}>
              <TextInput
                style={styles.composerInput}
                multiline
                placeholder="Nhập tin nhắn cho gara..."
                placeholderTextColor="#94A3B8"
                value={draft}
                onChangeText={setDraft}
                maxLength={2000}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!draft.trim() || isSending) && styles.sendButtonDisabled]}
                activeOpacity={0.85}
                disabled={!draft.trim() || isSending}
                onPress={handleSendMessage}>
                {isSending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardWrap: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F766E',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#475569',
    fontSize: 14,
  },
  headerCard: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  headerMeta: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 13,
  },
  thread: {
    flex: 1,
  },
  threadContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    gap: 10,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowTheirs: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '84%',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageBubbleMine: {
    backgroundColor: '#0F766E',
  },
  messageBubbleTheirs: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageAuthor: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  messageAuthorMine: {
    color: '#CCFBF1',
  },
  messageAuthorTheirs: {
    color: '#0F766E',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMine: {
    color: '#FFFFFF',
  },
  messageTextTheirs: {
    color: '#0F172A',
  },
  messageTime: {
    marginTop: 6,
    fontSize: 11,
  },
  messageTimeMine: {
    color: '#CCFBF1',
  },
  messageTimeTheirs: {
    color: '#94A3B8',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  composerInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
});
