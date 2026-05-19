import apiClient from '@/constants/Api';

export interface NotificationItem {
  id: number;
  title?: string;
  content?: string;
  isRead?: boolean;
  createdAt?: string;
}

const notificationService = {
  async getMyNotifications() {
    const response = await apiClient.get<NotificationItem[] | string>('/notifications');
    return response.data;
  },

  async markAsRead(id: number) {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  },
};

export default notificationService;
