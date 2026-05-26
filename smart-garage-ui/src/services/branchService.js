import axios from 'axios';
import { API_ENDPOINTS, getAuthConfig } from '../config/api';

const branchService = {
  // Lấy tất cả chi nhánh
  getAllBranches: async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.branches, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }
  },

  // Lấy danh sách chi nhánh đang hoạt động
  getActiveBranches: async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.branches}/active`, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error('Error fetching active branches:', error);
      throw error;
    }
  },

  getNearbyActiveBranches: async (latitude, longitude) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.branches}/active/nearby`, {
        ...getAuthConfig(),
        params: { latitude, longitude },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching nearby active branches:', error);
      throw error;
    }
  },

  // Lấy chi tiết chi nhánh theo id
  getBranchById: async (id) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.branches}/${id}`, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error(`Error fetching branch ${id}:`, error);
      throw error;
    }
  },

  // Thêm chi nhánh mới
  createBranch: async (branchData) => {
    try {
      const response = await axios.post(API_ENDPOINTS.branches, branchData, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  },

  // Cập nhật thông tin chi nhánh
  updateBranch: async (id, branchData) => {
    try {
      const response = await axios.put(`${API_ENDPOINTS.branches}/${id}`, branchData, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  },

  // Vô hiệu hóa chi nhánh
  deactivateBranch: async (id) => {
    try {
      const response = await axios.delete(`${API_ENDPOINTS.branches}/${id}`, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error('Error deactivating branch:', error);
      throw error;
    }
  }
};

export default branchService;
