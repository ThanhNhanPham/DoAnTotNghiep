import axios from 'axios';
import { API_ENDPOINTS, getAuthConfig } from '../config/api';

const notificationService = {
  getNotifications: async () => {
    const response = await axios.get(API_ENDPOINTS.notifications, getAuthConfig());
    return response.data;
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
};

export default notificationService;
