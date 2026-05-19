import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import notificationService from '@/services/notificationService';

export function useUnreadNotificationCount(refreshIntervalMs = 20000) {
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const refreshUnreadCount = async () => {
        try {
          const count = await notificationService.getUnreadCount();

          if (isActive) {
            setUnreadCount(count);
          }
        } catch (error) {
          console.error('Load unread notification count failed:', error);

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
