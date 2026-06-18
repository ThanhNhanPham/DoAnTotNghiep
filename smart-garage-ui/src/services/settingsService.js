import axios from 'axios';
import { API_ENDPOINTS, getAuthConfig } from '../config/api';

const settingsService = {
  async getSystemSettings() {
    const response = await axios.get(API_ENDPOINTS.settings, getAuthConfig());
    return response.data;
  },

  async updateSystemSettings(payload) {
    const response = await axios.put(API_ENDPOINTS.settings, payload, getAuthConfig());
    return response.data;
  },

  async resetSystemSettings() {
    const response = await axios.post(`${API_ENDPOINTS.settings}/reset`, null, getAuthConfig());
    return response.data;
  },
};

export default settingsService;
