import axios from 'axios';
import { API_ENDPOINTS, getAuthConfig } from '../config/api';

const notificationService = {
  getNotifications: async () => {
    const response = await axios.get(API_ENDPOINTS.notifications, getAuthConfig());
    if (!Array.isArray(response.data)) {
      return response.data;
    }

    return response.data.map((notification) => ({
      ...notification,
      isRead: notification.isRead ?? notification.read ?? false,
    }));
  },

  getUnreadCount: async () => {
    const response = await axios.get(`${API_ENDPOINTS.notifications}/unread-count`, getAuthConfig());
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await axios.put(`${API_ENDPOINTS.notifications}/${id}/read`, null, getAuthConfig());
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await axios.put(`${API_ENDPOINTS.notifications}/read-all`, null, getAuthConfig());
    return response.data;
  },

  deleteNotification: async (id) => {
    const response = await axios.delete(`${API_ENDPOINTS.notifications}/${id}`, getAuthConfig());
    return response.data;
  },
};

export default notificationService;
