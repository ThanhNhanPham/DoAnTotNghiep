import apiClient from '@/constants/Api';

export interface NotificationItem {
  id: number;
  title?: string;
  content?: string;
  bookingId?: number | null;
  booking_id?: number | null;
  bookingID?: number | null;
  isRead?: boolean;
  read?: boolean;
  createdAt?: string;
}

export interface UnreadNotificationCountResponse {
  unreadCount: number;
}

const notificationService = {
  async getMyNotifications() {
    const response = await apiClient.get<NotificationItem[] | string>('/notifications');
    if (!Array.isArray(response.data)) {
      return response.data;
    }

    return response.data.map((notification) => ({
      ...notification,
      bookingId: notification.bookingId ?? notification.booking_id ?? notification.bookingID ?? null,
      isRead: notification.isRead ?? notification.read ?? false,
    }));
  },

  async getUnreadCount() {
    const response = await apiClient.get<UnreadNotificationCountResponse>('/notifications/unread-count');
    return response.data.unreadCount;
  },

  async markAsRead(id: number) {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },

  async deleteNotification(id: number) {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data;
  },
};

export default notificationService;
