import axios from 'axios';
import { API_ENDPOINTS, getAuthConfig } from '../config/api';

const dashboardService = {
  async getOverview() {
    const response = await axios.get(`${API_ENDPOINTS.dashboard}/overview`, getAuthConfig());
    return response.data;
  },

  async getBookingStatusDistribution() {
    const response = await axios.get(`${API_ENDPOINTS.dashboard}/bookings/status-distribution`, getAuthConfig());
    return response.data;
  },

  async getRevenueSummary(period = 'month') {
    const response = await axios.get(`${API_ENDPOINTS.dashboard}/revenue/summary`, {
      ...getAuthConfig(),
      params: { period },
    });
    return response.data;
  },

  async getRevenueTrend({ groupBy = 'day', from, to } = {}) {
    const response = await axios.get(`${API_ENDPOINTS.dashboard}/revenue/trend`, {
      ...getAuthConfig(),
      params: {
        groupBy,
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      },
    });
    return response.data;
  },

  async getTopServices(limit = 5) {
    const response = await axios.get(`${API_ENDPOINTS.dashboard}/services/top`, {
      ...getAuthConfig(),
      params: { limit },
    });
    return response.data;
  },

  async getRecentBookings(limit = 10) {
    const response = await axios.get(`${API_ENDPOINTS.dashboard}/bookings/recent`, {
      ...getAuthConfig(),
      params: { limit },
    });
    return response.data;
  },
};

export default dashboardService;
