import axios from 'axios';

const API_URL = 'http://localhost:8080/api/v1/bookings';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

const bookingService = {
  // Lấy tất cả danh sách đặt lịch (dành cho Admin)
  getAllBookings: async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/bookings`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },

  // Xác nhận đơn đặt lịch (cần gán mechanicId)
  confirmBooking: async (bookingId, mechanicId) => {
    try {
      const response = await axios.patch(
        `${API_URL}/${bookingId}/confirm?mechanicId=${mechanicId}`,
        null,
        getAuthHeaders()
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
        `${API_URL}/${bookingId}/complete`,
        null,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error completing booking:', error);
      throw error;
    }
  },

  // Hủy/Xóa đơn đặt lịch
  cancelBooking: async (bookingId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/${bookingId}`,
        getAuthHeaders()
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
        `${API_URL}/${bookingId}/Part/${partId}?quantity=${quantity}`,
        null,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error adding part to booking:', error);
      throw error;
    }
  }
};

export default bookingService;
