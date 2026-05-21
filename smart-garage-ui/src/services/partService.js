import axios from 'axios';
import { API_ENDPOINTS, getAuthConfig } from '../config/api';

const partService = {
  getAllParts: async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.parts, {
        ...getAuthConfig(),
        params: {
          page: 0,
          size: 100,
        },
      });
      return Array.isArray(response.data) ? response.data : response.data?.content || [];
    } catch (error) {
      console.error('Error fetching parts:', error);
      throw error;
    }
  },

  getPartsPage: async ({ page = 1, size = 10, keyword, stockStatus } = {}) => {
    try {
      const response = await axios.get(API_ENDPOINTS.parts, {
        ...getAuthConfig(),
        params: {
          page: Math.max(page - 1, 0),
          size,
          ...(keyword?.trim() ? { keyword: keyword.trim() } : {}),
          ...(stockStatus ? { stockStatus } : {}),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching parts page:', error);
      throw error;
    }
  },

  getPartById: async (id) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.parts}/${id}`, getAuthConfig());
      return {
        ...response.data,
        branchName: response.data?.branchName || response.data?.branch?.name,
        branchId: response.data?.branchId || response.data?.branch?.id,
      };
    } catch (error) {
      console.error(`Error fetching part ${id}:`, error);
      throw error;
    }
  },

  searchParts: async (name) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.parts}/search`, {
        ...getAuthConfig(),
        params: { name },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching parts:', error);
      throw error;
    }
  },

  getPartsByBranch: async (branchId) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.parts}/branch/${branchId}`, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error(`Error fetching parts by branch ${branchId}:`, error);
      throw error;
    }
  },

  createPart: async (branchId, partData) => {
    try {
      const response = await axios.post(`${API_ENDPOINTS.parts}/${branchId}`, partData, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error('Error creating part:', error);
      throw error;
    }
  },

  updatePart: async (id, partData) => {
    try {
      const response = await axios.put(`${API_ENDPOINTS.parts}/${id}`, partData, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error(`Error updating part ${id}:`, error);
      throw error;
    }
  },

  addStock: async (id, amount) => {
    try {
      const response = await axios.patch(`${API_ENDPOINTS.parts}/${id}/add-stock`, null, {
        ...getAuthConfig(),
        params: { amount },
      });
      return response.data;
    } catch (error) {
      console.error(`Error adding stock for part ${id}:`, error);
      throw error;
    }
  },

  removeStock: async (id, amount) => {
    try {
      const response = await axios.patch(`${API_ENDPOINTS.parts}/${id}/remove-stock`, null, {
        ...getAuthConfig(),
        params: { amount },
      });
      return response.data;
    } catch (error) {
      console.error(`Error removing stock for part ${id}:`, error);
      throw error;
    }
  },

  deletePart: async (id) => {
    try {
      await axios.delete(`${API_ENDPOINTS.parts}/${id}`, getAuthConfig());
    } catch (error) {
      console.error(`Error deleting part ${id}:`, error);
      throw error;
    }
  },

  getLowStockParts: async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.parts}/low-stock`, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error('Error fetching low-stock parts:', error);
      throw error;
    }
  },
};

export default partService;
