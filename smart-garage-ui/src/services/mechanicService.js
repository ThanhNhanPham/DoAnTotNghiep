import axios from 'axios';
import { API_ENDPOINTS, getAuthConfig } from '../config/api';

const mechanicService = {
  // Lấy tất cả thợ sửa xe
  getAllMechanics: async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.mechanics, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error('Error fetching mechanics:', error);
      throw error;
    }
  },

  // Lấy thợ theo chi nhánh
  getMechanicsByBranch: async (branchId) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.mechanics}/branch/${branchId}`, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error(`Error fetching mechanics for branch ${branchId}:`, error);
      throw error;
    }
  },

  // Lấy chi tiết thợ sửa xe theo id
  getMechanicById: async (id) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.mechanics}/${id}`, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error(`Error fetching mechanic ${id}:`, error);
      throw error;
    }
  },

  // Thêm thợ sửa xe vào chi nhánh cụ thể
  createMechanic: async (branchId, mechanicData) => {
    try {
      const { branchId: _branchId, ...payload } = mechanicData;
      const response = await axios.post(
        `${API_ENDPOINTS.mechanics}/branch/${branchId}`,
        {
          ...payload,
          branch: { id: branchId },
        },
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error creating mechanic:', error);
      throw error;
    }
  },

  // Cập nhật trạng thái thợ sửa xe
  updateMechanicStatus: async (id, status) => {
    try {
      // Dùng query param theo API của bạn: /id/status?status={status}
      const response = await axios.patch(`${API_ENDPOINTS.mechanics}/${id}/status`, null, {
        ...getAuthConfig(),
        params: { status },
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating mechanic ${id} status:`, error);
      throw error;
    }
  },

  // Chuyển trạng thái thợ sang nghỉ việc (xóa mềm)
  deleteMechanic: async (id) => {
    try {
      const response = await axios.delete(`${API_ENDPOINTS.mechanics}/${id}`, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error('Error deleting mechanic:', error);
      throw error;
    }
  },

  // Cập nhật thông tin thợ sửa xe
  updateMechanic: async (id, mechanicData) => {
    try {
      const { branchId, ...payload } = mechanicData;
      const response = await axios.put(
        `${API_ENDPOINTS.mechanics}/${id}`,
        {
          ...payload,
          ...(branchId ? { branch: { id: branchId } } : {}),
        },
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating mechanic:', error);
      throw error;
    }
  }
};

export default mechanicService;
