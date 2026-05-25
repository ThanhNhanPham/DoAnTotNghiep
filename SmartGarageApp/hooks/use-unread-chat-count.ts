import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import chatService from '@/services/chatService';

export function useUnreadChatCount(refreshIntervalMs = 15000) {
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const refreshUnreadCount = async () => {
        try {
          const rooms = await chatService.getRooms();
          const totalUnread = Array.isArray(rooms)
            ? rooms.reduce((sum, room) => sum + Math.max(room.unreadCount ?? 0, 0), 0)
            : 0;

          if (isActive) {
            setUnreadCount(totalUnread);
          }
        } catch (error) {
          console.error('Load unread chat count failed:', error);

          if (isActive) {
            setUnreadCount(0);
          }
        }
      };

      refreshUnreadCount();
      const intervalId = setInterval(refreshUnreadCount, refreshIntervalMs);

      return () => {
        isActive = false;
        clearInterval(intervalId);
      };
    }, [refreshIntervalMs])
  );

  return unreadCount;
}
