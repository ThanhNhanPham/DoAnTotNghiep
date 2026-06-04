import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import chatService, { ChatRoom } from '@/services/chatService';
import chatSocketService, { ChatSocketEvent } from '@/services/socket/chatSocketService';

const canLoadChatForRole = (role: string | null) => !role || role.toUpperCase().includes('CUSTOMER');

const sortRooms = (items: ChatRoom[]) =>
  [...items].sort((a, b) => {
    const timeA = new Date(a.lastMessageAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.lastMessageAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

const mergeRoomEvent = (rooms: ChatRoom[], event: ChatSocketEvent) => {
  if (!rooms.length) {
    return rooms;
  }

  const index = rooms.findIndex((room) => room.id === event.roomId);
  if (index < 0) {
    return rooms;
  }

  const nextRooms = [...rooms];
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

export function useUnreadChatCount() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const roomIds = useMemo(() => rooms.map((room) => room.id), [rooms]);
  const roomIdsKey = useMemo(() => [...roomIds].sort((a, b) => a - b).join(','), [roomIds]);

  const refreshRooms = useCallback(async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');

      if (!canLoadChatForRole(role)) {
        setRooms([]);
        return;
      }

      const data = await chatService.getRooms();
      setRooms(Array.isArray(data) ? sortRooms(data) : []);
    } catch (error: any) {
      const status = error?.response?.status;

      if (status !== 401 && status !== 403) {
        console.warn('Load unread chat count failed:', error);
      }

      setRooms([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshRooms();
    }, [refreshRooms])
  );

  useEffect(() => {
    if (!roomIds.length) {
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

            setRooms((prev) => mergeRoomEvent(prev, event));
          });
          subscriptionIds.push(subscriptionId);
        }
      } catch (error) {
        console.warn('Subscribe unread chat count socket failed:', error);
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

  return useMemo(
    () => rooms.reduce((sum, room) => sum + Math.max(room.unreadCount ?? 0, 0), 0),
    [rooms]
  );
}
