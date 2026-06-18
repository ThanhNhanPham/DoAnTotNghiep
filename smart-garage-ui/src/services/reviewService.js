import axios from 'axios';
import { API_ENDPOINTS, getAuthConfig } from '../config/api';

export const getApiErrorMessage = (error, fallback = 'Có lỗi xảy ra!') => {
  const data = error?.response?.data;

  if (typeof data === 'string') return data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (data?.detail) return data.detail;

  return error?.message || fallback;
};

const reviewService = {
  getReviewByBooking: async (bookingId) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.reviews}/booking/${bookingId}`, getAuthConfig());
      return response.data;
    } catch (error) {
      if (error?.response?.status !== 404) {
        console.error('Error fetching booking review:', error);
      }
      throw error;
    }
  },

  replyToReview: async (reviewId, reply) => {
    try {
      const response = await axios.patch(
        `${API_ENDPOINTS.reviews}/${reviewId}/reply`,
        { reply },
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error replying to review:', error);
      throw error;
    }
  },
};

export default reviewService;
