import axios from 'axios';

const API_URL = 'http://localhost:8080/api/v1';

const motorbikeService = {
  // Lấy xe máy theo userId
  getMotorbikesByUserId: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/motorbikes/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching motorbikes for user ${userId}:`, error);
      throw error;
    }
  },
  // lấy tất cả xe máy
    getAllMotorbikes: async () => {
        try {
            const response = await axios.get(`${API_URL}/motorbikes`);
            return response.data;
        } catch (error) {
            console.error('Error fetching motorbikes:', error);
            throw error;
        }
    },

  // Thêm xe máy mới cho user (cần userId)
  createMotorbike: async (userId, motorbikeData) => {
    try {
      const response = await axios.post(`${API_URL}/motorbikes/user/${userId}`, motorbikeData);
      return response.data;
    } catch (error) {
      console.error('Error creating motorbike:', error);
      throw error;
    }
  },

  // Cập nhật xe máy
  updateMotorbike: async (id, motorbikeData) => {
    try {
      const response = await axios.put(`${API_URL}/motorbikes/${id}`, motorbikeData);
      return response.data;
    } catch (error) {
      console.error('Error updating motorbike:', error);
      throw error;
    }
  },

  // Xóa xe máy
  deleteMotorbike: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/motorbikes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting motorbike:', error);
      throw error;
    }
  },
};

export default motorbikeService;
