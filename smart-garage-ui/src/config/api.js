export const API_BASE_URL = '/api/v1';

export const API_ENDPOINTS = {
  auth: `${API_BASE_URL}/auth`,
  bookings: `${API_BASE_URL}/bookings`,
  adminBookings: `${API_BASE_URL}/admin/bookings`,
  payments: `${API_BASE_URL}/payments`,
  notifications: `${API_BASE_URL}/notifications`,
  branches: `${API_BASE_URL}/branches`,
  mechanics: `${API_BASE_URL}/mechanics`,
  services: `${API_BASE_URL}/services`,
  parts: `${API_BASE_URL}/parts`,
  users: `${API_BASE_URL}/users`,
  vehicles: `${API_BASE_URL}/vehicles`,
  reviews: `${API_BASE_URL}/reviews`,
  invoices: `${API_BASE_URL}/invoices`,
  chat: `${API_BASE_URL}/chat`,
  dashboard: `${API_BASE_URL}/dashboard`,
};

export const getAuthToken = () => localStorage.getItem('authToken') || localStorage.getItem('token');

export const getAuthConfig = () => {
  const token = getAuthToken();

  return token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : {};
};

export const getAuthHeaders = () => getAuthConfig().headers || {};
