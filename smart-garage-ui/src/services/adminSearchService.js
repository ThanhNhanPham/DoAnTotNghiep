import axios from 'axios';
import { API_ENDPOINTS, getAuthConfig } from '../config/api';

const adminSearchService = {
  search: async (keyword, limit = 5) => {
    const response = await axios.get(`${API_ENDPOINTS.admin}/search`, {
      ...getAuthConfig(),
      params: {
        keyword: keyword.trim(),
        limit,
      },
    });
    return response.data;
  },
};

export default adminSearchService;
