import axios from 'axios';
import { API_ENDPOINTS, getAuthConfig } from '../config/api';

const paymentService = {
  confirmCashPayment: async (bookingId) => {
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.payments}/cash/confirm/${bookingId}`,
        null,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error confirming cash payment:', error);
      throw error;
    }
  },

  confirmBankTransferPayment: async (bookingId) => {
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.payments}/bank-transfer/confirm/${bookingId}`,
        null,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error confirming bank transfer payment:', error);
      throw error;
    }
  },
};

export default paymentService;
