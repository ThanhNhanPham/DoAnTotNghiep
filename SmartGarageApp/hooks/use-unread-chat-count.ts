import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import chatService, { ChatRoom } from '@/services/chatService';
import chatSocketService, { ChatSocketEvent } from '@/services/socket/chatSocketService';

const CHAT_POLL_INTERVAL_MS = 5000;

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

const mergeRoomEvent = (rooms: ChatRoom[], event: ChatSocketEvent) => {
  if (event.type === 'ROOM_UPSERT') {
    return upsertRoom(rooms, event.room);
  }

  if (event.type === 'ROOM_DELETED') {
    return removeRoom(rooms, event.roomId);
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
  const isRefreshingRoomsRef = useRef(false);
  const roomIds = useMemo(() => rooms.map((room) => room.id), [rooms]);
  const roomIdsKey = useMemo(() => [...roomIds].sort((a, b) => a - b).join(','), [roomIds]);

  const refreshRooms = useCallback(async () => {
    if (isRefreshingRoomsRef.current) {
      return;
    }

    try {
      isRefreshingRoomsRef.current = true;
      const data = await chatService.getRooms();
      setRooms(Array.isArray(data) ? sortRooms(data) : []);
    } catch (error: any) {
      const status = error?.response?.status;

      if (status !== 401 && status !== 403) {
        console.warn('Load unread chat count failed:', error);
      }

      setRooms([]);
    } finally {
      isRefreshingRoomsRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshRooms();

      const intervalId = setInterval(() => {
        refreshRooms();
      }, CHAT_POLL_INTERVAL_MS);

      return () => {
        clearInterval(intervalId);
      };
    }, [refreshRooms])
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

          setRooms((prev) => mergeRoomEvent(prev, event));
        });
      } catch (error) {
        console.warn('Subscribe unread chat room queue failed:', error);
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
