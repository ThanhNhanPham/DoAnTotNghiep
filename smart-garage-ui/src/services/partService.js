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
      return response.data;
    } catch (error) {
      console.error(`Error fetching part ${id}:`, error);
      throw error;
    }
  },
};

export default partService;
