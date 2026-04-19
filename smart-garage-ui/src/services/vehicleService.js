import axios from 'axios';

const API_URL = 'http://localhost:8080/api/v1';

const vehicleService = {
  // Lấy danh sách phương tiện theo userId
  getVehiclesByUserId: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/vehicles/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching vehicles for user ${userId}:`, error);
      throw error;
    }
  },

  // Lấy tất cả phương tiện (dành cho Admin)
  getAllVehicles: async () => {
    try {
      const response = await axios.get(`${API_URL}/vehicles`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  },

  // Thêm phương tiện mới cho user (cần userId)
  createVehicle: async (userId, vehicleData) => {
    try {
      const response = await axios.post(`${API_URL}/vehicles/user/${userId}`, vehicleData);
      return response.data;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  },

  // Cập nhật phương tiện
  updateVehicle: async (id, vehicleData) => {
    try {
      const response = await axios.put(`${API_URL}/vehicles/${id}`, vehicleData);
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  },

  // Xóa phương tiện (soft delete - chuyển active = false)
  deleteVehicle: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  },
};

export default vehicleService;
