import axios from 'axios';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api';

const userService = {
  // Lấy danh sách tất cả người dùng (Admin)
  getAllUsers: async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.users, {
        headers: getAuthHeaders(),
      });
      console.log('API getAllUsers Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API getAllUsers Error:', error);
      throw error.response?.data || { message: 'Lỗi kết nối máy chủ (CORS hoặc Network)!' };
    }
  },

  // Lấy chi tiết người dùng theo id (Admin)
  getUserById: async (id) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.users}/${id}`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`API getUserById ${id} Error:`, error);
      throw error.response?.data || { message: 'Lỗi khi tải chi tiết người dùng!' };
    }
  },

  // Tạo người dùng mới (Admin)
  createUser: async (userData) => {
    try {
      const response = await axios.post(API_ENDPOINTS.users, userData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Lỗi khi tạo người dùng!' };
    }
  },

  // Super Admin tạo tài khoản Admin cho chi nhánh
  createAdmin: async (adminData) => {
    try {
      const response = await axios.post(`${API_ENDPOINTS.users}/admins`, adminData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Lỗi khi tạo tài khoản Admin!' };
    }
  },

  // Super Admin cập nhật trạng thái tài khoản
  updateAccountStatus: async (id, accountStatus) => {
    try {
      const response = await axios.patch(`${API_ENDPOINTS.users}/${id}/status`, { accountStatus }, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Lỗi khi cập nhật trạng thái tài khoản!' };
    }
  },

  // Cập nhật người dùng (Admin)
  updateUser: async (id, userData) => {
    try {
      const response = await axios.put(`${API_ENDPOINTS.users}/${id}`, userData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Lỗi khi cập nhật người dùng!' };
    }
  },

  // Xóa người dùng (Admin)
  deleteUser: async (id) => {
    try {
      await axios.delete(`${API_ENDPOINTS.users}/${id}`, {
        headers: getAuthHeaders(),
      });
      return true;
    } catch (error) {
      throw error.response?.data || { message: 'Lỗi khi xóa người dùng!' };
    }
  }
};

export default userService;
