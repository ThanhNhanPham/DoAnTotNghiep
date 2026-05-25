import apiClient from '@/constants/Api';

export interface ChatRoom {
  id: number;
  bookingId: number;
  bookingStatus?: string;
  branchId?: number | null;
  branchName?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  licensePlate?: string | null;
  vehicleName?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  createdAt?: string | null;
}

export interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  senderName?: string | null;
  senderRole?: string | null;
  content: string;
  isRead: boolean;
  createdAt?: string | null;
}

const chatService = {
  async getRooms() {
    const response = await apiClient.get<ChatRoom[]>('/chat/rooms');
    return response.data;
  },

  async createOrGetRoom(bookingId: number) {
    const response = await apiClient.post<ChatRoom>('/chat/rooms', { bookingId });
    return response.data;
  },

  async getMessages(roomId: number) {
    const response = await apiClient.get<ChatMessage[]>(`/chat/rooms/${roomId}/messages`);
    return response.data;
  },

  async sendMessage(roomId: number, content: string) {
    const response = await apiClient.post<ChatMessage>(`/chat/rooms/${roomId}/messages`, { content });
    return response.data;
  },

  async markRoomAsRead(roomId: number) {
    const response = await apiClient.put(`/chat/rooms/${roomId}/read`);
    return response.data;
  },
};

export default chatService;
