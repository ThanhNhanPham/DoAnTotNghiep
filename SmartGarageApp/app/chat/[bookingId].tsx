import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import chatService, { ChatMessage, ChatRoom } from '@/services/chatService';
import chatSocketService, { ChatSocketEvent } from '@/services/socket/chatSocketService';

const TYPING_THROTTLE_MS = 1200;
const TYPING_VISIBLE_MS = 2500;
const CHAT_POLL_INTERVAL_MS = 5000;

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

const sortMessages = (items: ChatMessage[]) =>
  [...items].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

const upsertMessage = (items: ChatMessage[], nextMessage: ChatMessage) => {
  const exists = items.some((item) => item.id === nextMessage.id);
  return sortMessages(exists ? items.map((item) => (item.id === nextMessage.id ? nextMessage : item)) : [...items, nextMessage]);
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentAtRef = useRef(0);
  const currentUserRoleRef = useRef<string | null>(null);
  const isLoadingRoomRef = useRef(false);

  const loadRoomAndMessages = useCallback(async (refreshing = false, silent = false) => {
    if (isLoadingRoomRef.current) {
      return;
    }

    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      setIsLoading(false);
      if (!silent) {
        Alert.alert('Lỗi', 'Không tìm thấy booking để mở chat.');
      }
      return;
    }

    try {
      isLoadingRoomRef.current = true;
      if (refreshing) {
        setIsRefreshing(true);
      }

      const roomData = await chatService.createOrGetRoom(bookingId);
      setRoom(roomData);

      const messageData = await chatService.getMessages(roomData.id);
      setMessages(Array.isArray(messageData) ? sortMessages(messageData) : []);

      void chatService.markRoomAsRead(roomData.id).catch((readError) => {
        console.warn('Mark booking chat as read failed:', readError);
      });
    } catch (error: any) {
      console.error('Load booking chat failed:', error);
      if (silent) {
        return;
      }

      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Không thể tải cuộc trò chuyện lúc này.';
      Alert.alert('Lỗi', String(serverMessage));
    } finally {
      isLoadingRoomRef.current = false;
      setIsLoading(false);
      if (refreshing) {
        setIsRefreshing(false);
      }
    }
  }, [bookingId]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const initialize = async () => {
        currentUserRoleRef.current = await AsyncStorage.getItem('userRole');
        if (isActive) {
          loadRoomAndMessages();
        }
      };

      initialize();
      const intervalId = setInterval(() => {
        if (isActive) {
          loadRoomAndMessages(false, true);
        }
      }, CHAT_POLL_INTERVAL_MS);

      return () => {
        isActive = false;
        clearInterval(intervalId);
      };
    }, [loadRoomAndMessages])
  );

  useEffect(() => {
    if (!room?.id) {
      return undefined;
    }

    let isActive = true;
    let roomSubscriptionId: string | null = null;

    const subscribe = async () => {
      try {
        await chatSocketService.connect();
        roomSubscriptionId = await chatSocketService.subscribeToRoom(room.id, async (event: ChatSocketEvent) => {
          if (!isActive) {
            return;
          }

          if (event.type === 'MESSAGE_CREATED' && event.message) {
            setMessages((prev) => upsertMessage(prev, event.message!));

            if (event.message.senderRole !== currentUserRoleRef.current) {
              try {
                await chatService.markRoomAsRead(room.id);
                await chatSocketService.markRoomAsRead(room.id);
              } catch (markError) {
                console.warn('Realtime mark room as read failed:', markError);
              }
            }
            return;
          }

          if (event.type === 'TYPING' && event.actorRole !== currentUserRoleRef.current) {
            setIsOtherTyping(true);
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
              setIsOtherTyping(false);
            }, TYPING_VISIBLE_MS);
            return;
          }

          if (event.type === 'ROOM_READ' && event.actorRole !== currentUserRoleRef.current) {
            setLastReadAt(event.readAt || new Date().toISOString());
            setIsOtherTyping(false);
          }
        });
      } catch (error) {
        console.warn('Subscribe booking chat socket failed:', error);
      }
    };

    subscribe();

    return () => {
      isActive = false;
      if (roomSubscriptionId) {
        chatSocketService.unsubscribe(roomSubscriptionId);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [room?.id]);

  const handleSendMessage = async () => {
    const trimmed = draft.trim();
    if (!room?.id || !trimmed) return;

    try {
      setIsSending(true);
      setDraft('');
      setIsOtherTyping(false);
      setLastReadAt(null);

      try {
        await chatSocketService.sendMessage(room.id, trimmed);
      } catch (socketError) {
        console.warn('Send booking chat message via socket failed, fallback REST:', socketError);
        const sentMessage = await chatService.sendMessage(room.id, trimmed);
        setMessages((prev) => upsertMessage(prev, sentMessage));
      }
    } catch (error: any) {
      console.error('Send booking chat message failed:', error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Không thể gửi tin nhắn lúc này.';
      Alert.alert('Lỗi', String(serverMessage));
      setDraft(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteRoom = useCallback(() => {
    if (!room?.id || isDeleting) {
      return;
    }

    Alert.alert(
      'Ẩn cuộc trò chuyện',
      'Cuộc trò chuyện này sẽ chỉ bị ẩn khỏi tài khoản hiện tại.',
      [
        {
          text: 'Huỷ',
          style: 'cancel',
        },
        {
          text: 'Ẩn',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await chatService.deleteRoom(room.id);
              router.replace('/(tabs)/chat' as any);
            } catch (error: any) {
              console.error('Hide booking chat failed:', error);
              const serverMessage =
                error?.response?.data?.message ||
                error?.response?.data ||
                'Không thể ẩn cuộc trò chuyện lúc này.';
              Alert.alert('Lỗi', String(serverMessage));
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [isDeleting, room?.id, router]);

  useEffect(() => {
    if (!room?.id || !draft.trim()) {
      return undefined;
    }

    const now = Date.now();
    if (now - lastTypingSentAtRef.current < TYPING_THROTTLE_MS) {
      return undefined;
    }

    lastTypingSentAtRef.current = now;
    chatSocketService.sendTyping(room.id).catch((error) => {
      console.warn('Send typing event failed:', error);
    });

    return undefined;
  }, [draft, room?.id]);

  const sortedMessages = useMemo(() => sortMessages(messages), [messages]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.hideButton, isDeleting && styles.hideButtonDisabled]}
          onPress={handleDeleteRoom}
          activeOpacity={0.85}
          disabled={!room?.id || isDeleting}>
          {isDeleting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="archive-outline" size={16} color="#FFFFFF" />
              <Text style={styles.hideButtonText}>Ẩn chat</Text>
            </>
          )}
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
                  const isMine = item.senderRole === currentUserRoleRef.current;

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

            {(isOtherTyping || lastReadAt) && (
              <View style={styles.activityBar}>
                {isOtherTyping ? (
                  <Text style={styles.activityText}>Gara đang nhập tin nhắn...</Text>
                ) : (
                  <Text style={styles.activityText}>Gara đã xem lúc {formatDateTime(lastReadAt)}</Text>
                )}
              </View>
            )}

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  hideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#B91C1C',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  hideButtonDisabled: {
    opacity: 0.7,
  },
  hideButtonText: {
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
  activityBar: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  activityText: {
    color: '#475569',
    fontSize: 12,
    fontStyle: 'italic',
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
