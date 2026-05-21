import axios from 'axios';
import { API_ENDPOINTS, getAuthConfig } from '../config/api';

const vehicleService = {
  // Lấy danh sách phương tiện theo userId
  getVehiclesByUserId: async (userId) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.vehicles}/user/${userId}`, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error(`Error fetching vehicles for user ${userId}:`, error);
      throw error;
    }
  },

  // Lấy tất cả phương tiện (dành cho Admin)
  getAllVehicles: async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.vehicles, {
        ...getAuthConfig(),
        params: {
          page: 0,
          size: 100,
        },
      });
      return Array.isArray(response.data) ? response.data : response.data?.content || [];
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  },

  getVehiclesPage: async ({ page = 1, size = 10, keyword, type, brand, isActive } = {}) => {
    try {
      const response = await axios.get(API_ENDPOINTS.vehicles, {
        ...getAuthConfig(),
        params: {
          page: Math.max(page - 1, 0),
          size,
          ...(keyword?.trim() ? { keyword: keyword.trim() } : {}),
          ...(type ? { type } : {}),
          ...(brand ? { brand } : {}),
          ...(isActive !== undefined ? { isActive } : {}),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicles page:', error);
      throw error;
    }
  },

  // Lấy chi tiết phương tiện theo id
  getVehicleById: async (id) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.vehicles}/${id}`, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error(`Error fetching vehicle ${id}:`, error);
      throw error;
    }
  },

  // Thêm phương tiện mới cho user (cần userId)
  createVehicle: async (userId, vehicleData) => {
    try {
      const response = await axios.post(`${API_ENDPOINTS.vehicles}/user/${userId}`, vehicleData, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  },

  // Cập nhật phương tiện
  updateVehicle: async (id, vehicleData) => {
    try {
      const response = await axios.put(`${API_ENDPOINTS.vehicles}/${id}`, vehicleData, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  },

  // Xóa phương tiện (soft delete - chuyển active = false)
  deleteVehicle: async (id) => {
    try {
      const response = await axios.delete(`${API_ENDPOINTS.vehicles}/${id}`, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  },
};

export default vehicleService;
