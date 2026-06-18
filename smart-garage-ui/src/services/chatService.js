import axios from 'axios';
import { API_ENDPOINTS, getAuthConfig } from '../config/api';

const chatService = {
  getRooms: async () => {
    const response = await axios.get(`${API_ENDPOINTS.chat}/rooms`, getAuthConfig());
    return response.data;
  },

  getMessages: async (roomId) => {
    const response = await axios.get(`${API_ENDPOINTS.chat}/rooms/${roomId}/messages`, getAuthConfig());
    return response.data;
  },

  sendMessage: async (roomId, content) => {
    const response = await axios.post(
      `${API_ENDPOINTS.chat}/rooms/${roomId}/messages`,
      { content },
      getAuthConfig()
    );
    return response.data;
  },

  markRoomAsRead: async (roomId) => {
    const response = await axios.put(`${API_ENDPOINTS.chat}/rooms/${roomId}/read`, null, getAuthConfig());
    return response.data;
  },

  deleteRoom: async (roomId) => {
    const response = await axios.delete(`${API_ENDPOINTS.chat}/rooms/${roomId}`, getAuthConfig());
    return response.data;
  },
};

export default chatService;
