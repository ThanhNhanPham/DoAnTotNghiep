import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { useThemePreference } from '@/contexts/theme-preference';
import chatService, { ChatRoom } from '@/services/chatService';
import chatSocketService, { ChatSocketEvent } from '@/services/socket/chatSocketService';

const CHAT_POLL_INTERVAL_MS = 5000;

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  ARRIVED: 'Đã tiếp nhận',
  IN_PROGRESS: 'Đang sửa',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

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

const sortRooms = (items: ChatRoom[]) =>
  [...items].sort((a, b) => {
    const timeA = new Date(a.lastMessageAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.lastMessageAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

const upsertRoom = (rooms: ChatRoom[], nextRoom?: ChatRoom) => {
  if (!nextRoom?.id) {
    return rooms;
  }

  const index = rooms.findIndex((room) => room.id === nextRoom.id);
  if (index < 0) {
    return sortRooms([nextRoom, ...rooms]);
  }

  const nextRooms = [...rooms];
  nextRooms[index] = { ...nextRooms[index], ...nextRoom };
  return sortRooms(nextRooms);
};

const removeRoom = (rooms: ChatRoom[], roomId?: number) => {
  if (!roomId) {
    return rooms;
  }

  return rooms.filter((room) => room.id !== roomId);
};

const applyRoomEvent = (currentRooms: ChatRoom[], event: ChatSocketEvent) => {
  if (event.type === 'ROOM_UPSERT') {
    return upsertRoom(currentRooms, event.room);
  }

  if (event.type === 'ROOM_DELETED') {
    return removeRoom(currentRooms, event.roomId);
  }

  const index = currentRooms.findIndex((room) => room.id === event.roomId);
  if (index < 0) {
    return currentRooms;
  }

  const nextRooms = [...currentRooms];
  const targetRoom = { ...nextRooms[index] };

  if (event.type === 'MESSAGE_CREATED' && event.message) {
    targetRoom.lastMessagePreview = event.message.content;
    targetRoom.lastMessageAt = event.message.createdAt || new Date().toISOString();

    if (event.message.senderRole !== 'CUSTOMER') {
      targetRoom.unreadCount = Math.max((targetRoom.unreadCount ?? 0) + 1, 0);
    }
  }

  if (event.type === 'ROOM_READ' && event.actorRole === 'CUSTOMER') {
    targetRoom.unreadCount = 0;
  }

  nextRooms[index] = targetRoom;
  return sortRooms(nextRooms);
};

export default function ChatTabScreen() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isLoadingRoomsRef = useRef(false);

  const isDark = colorScheme === 'dark';
  const palette = useMemo(
    () => ({
      screen: isDark ? '#020617' : '#F0FDFA',
      heroStart: isDark ? '#0F172A' : '#0F766E',
      heroEnd: isDark ? '#134E4A' : '#115E59',
      card: isDark ? '#0F172A' : '#FFFFFF',
      border: isDark ? '#1E293B' : '#CCFBF1',
      text: isDark ? '#E2E8F0' : '#0F172A',
      subtext: isDark ? '#94A3B8' : '#475569',
      soft: isDark ? '#111827' : '#ECFDF5',
      accent: isDark ? '#14B8A6' : '#0F766E',
      badge: '#DC2626',
      badgeText: '#FFFFFF',
    }),
    [isDark]
  );

  const loadRooms = useCallback(async (refreshing = false) => {
    if (isLoadingRoomsRef.current) {
      return;
    }

    try {
      isLoadingRoomsRef.current = true;
      if (refreshing) {
        setIsRefreshing(true);
      }

      const data = await chatService.getRooms();
      setRooms(Array.isArray(data) ? sortRooms(data) : []);
    } catch (error: any) {
      const status = error?.response?.status;

      if (status !== 401 && status !== 403) {
        console.warn('Load chat rooms failed:', error);
      }
      setRooms([]);
    } finally {
      isLoadingRoomsRef.current = false;
      setIsLoading(false);
      if (refreshing) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRooms();

      const intervalId = setInterval(() => {
        loadRooms();
      }, CHAT_POLL_INTERVAL_MS);

      return () => {
        clearInterval(intervalId);
      };
    }, [loadRooms])
  );

  useEffect(() => {
    let isActive = true;
    let queueSubscriptionId: string | null = null;

    const subscribe = async () => {
      try {
        await chatSocketService.connect();
        queueSubscriptionId = await chatSocketService.subscribeToUserRoomQueue((event) => {
          if (!isActive) {
            return;
          }

          setRooms((prev) => applyRoomEvent(prev, event));
        });
      } catch (error) {
        console.warn('Subscribe chat room queue failed:', error);
      }
    };

    subscribe();

    return () => {
      isActive = false;
      if (queueSubscriptionId) {
        chatSocketService.unsubscribe(queueSubscriptionId);
      }
    };
  }, []);

  const roomIds = useMemo(() => rooms.map((room) => room.id), [rooms]);
  const roomIdsKey = useMemo(() => [...roomIds].sort((a, b) => a - b).join(','), [roomIds]);

  useEffect(() => {
    if (!roomIdsKey) {
      return undefined;
    }

    let isActive = true;
    const subscriptionIds: string[] = [];

    const subscribe = async () => {
      try {
        await chatSocketService.connect();
        for (const roomId of roomIds) {
          const subscriptionId = await chatSocketService.subscribeToRoom(roomId, (event) => {
            if (!isActive) {
              return;
            }
            setRooms((prev) => applyRoomEvent(prev, event));
          });
          subscriptionIds.push(subscriptionId);
        }
      } catch (error) {
        console.warn('Subscribe chat room events failed:', error);
      }
    };

    subscribe();

    return () => {
      isActive = false;
      for (const subscriptionId of subscriptionIds) {
        chatSocketService.unsubscribe(subscriptionId);
      }
    };
  }, [roomIds, roomIdsKey]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.screen }]}> 
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadRooms(true)}
            tintColor={palette.accent}
          />
        }>
        <LinearGradient colors={[palette.heroStart, palette.heroEnd]} style={styles.heroCard}>
          <Text style={styles.heroTitle}>Chat với gara</Text>
          <Text style={styles.heroText}>
            Theo dõi trao đổi với các chi nhánh theo từng booking của bạn.
          </Text>
        </LinearGradient>

        {isLoading ? (
          <View style={[styles.centerCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
            <ActivityIndicator color={palette.accent} />
            <Text style={[styles.stateText, { color: palette.subtext }]}>Đang tải cuộc trò chuyện...</Text>
          </View>
        ) : rooms.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
            <Ionicons name="chatbubble-ellipses-outline" size={28} color={palette.accent} />
            <Text style={[styles.emptyTitle, { color: palette.text }]}>Chưa có cuộc trò chuyện</Text>
            <Text style={[styles.emptyText, { color: palette.subtext }]}> 
              Khi bạn nhắn với chi nhánh từ chi tiết booking, cuộc trò chuyện sẽ xuất hiện tại đây.
            </Text>
          </View>
        ) : (
          <View style={styles.roomList}>
            {rooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={[styles.roomCard, { backgroundColor: palette.card, borderColor: palette.border }]}
                activeOpacity={0.85}
                onPress={() => router.push(`/chat/${room.bookingId}` as any)}>
                <View style={styles.roomTop}>
                  <View style={styles.roomIdentity}>
                    <View style={[styles.roomIconWrap, { backgroundColor: palette.soft }]}> 
                      <Ionicons name="business-outline" size={18} color={palette.accent} />
                    </View>
                    <View style={styles.roomTextWrap}>
                      <Text style={[styles.roomBranch, { color: palette.text }]}> 
                        {room.branchName || 'Chi nhánh Smart Garage'}
                      </Text>
                      <Text style={[styles.roomMeta, { color: palette.subtext }]}> 
                        Booking #{room.bookingId} {room.licensePlate ? `· ${room.licensePlate}` : ''}
                      </Text>
                    </View>
                  </View>
                  {(room.unreadCount ?? 0) > 0 ? (
                    <View style={[styles.unreadBadge, { backgroundColor: palette.badge }]}> 
                      <Text style={[styles.unreadBadgeText, { color: palette.badgeText }]}> 
                        {(room.unreadCount ?? 0) > 99 ? '99+' : room.unreadCount}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.roomBottom}>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>
                      {STATUS_LABELS[room.bookingStatus || ''] || room.bookingStatus || 'Đang trao đổi'}
                    </Text>
                  </View>
                  <Text style={[styles.roomTime, { color: palette.subtext }]}> 
                    {formatDateTime(room.lastMessageAt || room.createdAt)}
                  </Text>
                </View>

                <Text style={[styles.roomPreview, { color: palette.text }]}> 
                  {room.lastMessagePreview || 'Chưa có tin nhắn nào.'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  heroCard: {
    borderRadius: 24,
    padding: 22,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  heroText: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.86)',
    fontSize: 14,
    lineHeight: 21,
  },
  centerCard: {
    minHeight: 160,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    minHeight: 220,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  roomList: {
    gap: 14,
  },
  roomCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  roomTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  roomIdentity: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  roomIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomTextWrap: {
    flex: 1,
  },
  roomBranch: {
    fontSize: 15,
    fontWeight: '800',
  },
  roomMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  roomBottom: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  statusPill: {
    borderRadius: 999,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '700',
  },
  roomTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  roomPreview: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 21,
  },
});
