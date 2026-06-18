import axios from 'axios';
import { API_ENDPOINTS, getAuthConfig } from '../config/api';

const invoiceService = {
  getAllInvoices: async ({ page = 1, size = 10, status } = {}) => {
    try {
      const response = await axios.get(API_ENDPOINTS.invoices, {
        ...getAuthConfig(),
        params: {
          page: Math.max(page - 1, 0),
          size,
          ...(status ? { status } : {}),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },

  getInvoiceById: async (invoiceId) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.invoices}/${invoiceId}`, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice detail:', error);
      throw error;
    }
  },

  getInvoiceByBookingId: async (bookingId) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.invoices}/booking/${bookingId}`, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice by booking:', error);
      throw error;
    }
  },

};

export default invoiceService;
