import axios from 'axios';
import { API_ENDPOINTS, getAuthConfig } from '../config/api';

const serviceService = {
  // Lấy tất cả dịch vụ
  getAllServices: async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.services, {
        ...getAuthConfig(),
        params: {
          page: 0,
          size: 100,
          isActive: true,
        },
      });
      return Array.isArray(response.data) ? response.data : response.data?.content || [];
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  // Lấy danh sách dịch vụ có phân trang cho Admin
  getServicesPage: async ({ page = 1, size = 10, status, type, keyword } = {}) => {
    try {
      const response = await axios.get(API_ENDPOINTS.services, {
        ...getAuthConfig(),
        params: {
          page: Math.max(page - 1, 0),
          size,
          ...(status ? { isActive: status === 'active' } : {}),
          ...(type ? { type } : {}),
          ...(keyword?.trim() ? { keyword: keyword.trim() } : {}),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching services page:', error);
      throw error;
    }
  },

  // Lấy chi tiết dịch vụ theo id
  getServiceById: async (id) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.services}/${id}`, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error(`Error fetching service ${id}:`, error);
      throw error;
    }
  },

  // Thêm dịch vụ mới
  createService: async (serviceData) => {
    try {
      const response = await axios.post(API_ENDPOINTS.services, serviceData, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  },

  // Cập nhật dịch vụ
  updateService: async (id, serviceData) => {
    try {
      const response = await axios.put(`${API_ENDPOINTS.services}/${id}`, serviceData, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  },

  // Xóa dịch vụ
  deleteService: async (id) => {
    try {
      await axios.delete(`${API_ENDPOINTS.services}/${id}`, getAuthConfig());
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  },
};

export default serviceService;
