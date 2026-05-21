import axios from 'axios';
import { API_ENDPOINTS, getAuthConfig } from '../config/api';

const bookingService = {
  // Lấy tất cả danh sách đặt lịch (dành cho Admin)
  getAllBookings: async ({ page = 1, size = 10, status, branchId, keyword } = {}) => {
    try {
      const response = await axios.get(API_ENDPOINTS.adminBookings, {
        ...getAuthConfig(),
        params: {
          page: Math.max(page - 1, 0),
          size,
          ...(status ? { status } : {}),
          ...(branchId ? { branchId } : {}),
          ...(keyword?.trim() ? { keyword: keyword.trim() } : {}),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },

  // Lấy chi tiết lịch hẹn cho Admin
  getBookingById: async (bookingId) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.adminBookings}/${bookingId}`, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error('Error fetching booking detail:', error);
      throw error;
    }
  },

  // Xác nhận đơn đặt lịch (cần gán mechanicId)
  confirmBooking: async (bookingId, mechanicId) => {
    try {
      const response = await axios.patch(
        `${API_ENDPOINTS.adminBookings}/${bookingId}/confirm`,
        { mechanicId },
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error confirming booking:', error);
      throw error;
    }
  },

  // Hoàn thành đơn đặt lịch
  completeBooking: async (bookingId) => {
    try {
      const response = await axios.patch(
        `${API_ENDPOINTS.adminBookings}/${bookingId}/complete`,
        null,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error completing booking:', error);
      throw error;
    }
  },

  // Xác nhận khách đã tới cửa hàng
  markArrived: async (bookingId) => {
    try {
      const response = await axios.patch(
        `${API_ENDPOINTS.adminBookings}/${bookingId}/arrive`,
        null,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error marking booking arrived:', error);
      throw error;
    }
  },

  // Bắt đầu xử lý xe
  startBooking: async (bookingId) => {
    try {
      const response = await axios.patch(
        `${API_ENDPOINTS.adminBookings}/${bookingId}/start`,
        null,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error starting booking:', error);
      throw error;
    }
  },

  // Đổi thợ phụ trách
  reassignMechanic: async (bookingId, mechanicId) => {
    try {
      const response = await axios.patch(
        `${API_ENDPOINTS.adminBookings}/${bookingId}/reassign-mechanic`,
        { mechanicId },
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error reassigning mechanic:', error);
      throw error;
    }
  },

  // Hủy/Xóa đơn đặt lịch
  cancelBooking: async (bookingId, cancelReason) => {
    try {
      const response = await axios.patch(
        `${API_ENDPOINTS.adminBookings}/${bookingId}/cancel`,
        { cancelReason },
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },

  // Thêm phụ tùng vào đơn
  addPartToBooking: async (bookingId, partId, quantity) => {
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.adminBookings}/${bookingId}/parts`,
        { partId, quantity },
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error adding part to booking:', error);
      throw error;
    }
  },

  updatePartInBooking: async (bookingId, partId, quantity) => {
    try {
      const response = await axios.patch(
        `${API_ENDPOINTS.adminBookings}/${bookingId}/parts/${partId}`,
        { quantity },
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating booking part:', error);
      throw error;
    }
  },

  removePartFromBooking: async (bookingId, partId) => {
    try {
      const response = await axios.delete(
        `${API_ENDPOINTS.adminBookings}/${bookingId}/parts/${partId}`,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error removing booking part:', error);
      throw error;
    }
  },

  addServiceToBooking: async (bookingId, serviceId) => {
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.adminBookings}/${bookingId}/services`,
        { serviceId },
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error adding service to booking:', error);
      throw error;
    }
  },

  replaceBookingServices: async (bookingId, serviceIds) => {
    try {
      const response = await axios.put(
        `${API_ENDPOINTS.adminBookings}/${bookingId}/services`,
        { serviceIds },
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error replacing booking services:', error);
      throw error;
    }
  },

  removeServiceFromBooking: async (bookingId, serviceId) => {
    try {
      const response = await axios.delete(
        `${API_ENDPOINTS.adminBookings}/${bookingId}/services/${serviceId}`,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Error removing booking service:', error);
      throw error;
    }
  },
};

export default bookingService;
