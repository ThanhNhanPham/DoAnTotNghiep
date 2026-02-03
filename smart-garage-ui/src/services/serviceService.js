import axios from 'axios';

const API_URL = 'http://localhost:8080/api/v1';

const serviceService = {
  // Lấy tất cả dịch vụ
  getAllServices: async () => {
    try {
      const response = await axios.get(`${API_URL}/services`);
      return response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  // Thêm dịch vụ mới
  createService: async (serviceData) => {
    try {
      const response = await axios.post(`${API_URL}/services`, serviceData);
      return response.data;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  },

  // Cập nhật dịch vụ
  updateService: async (id, serviceData) => {
    try {
      const response = await axios.put(`${API_URL}/services/${id}`, serviceData);
      return response.data;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  },

  // Xóa dịch vụ
  deleteService: async (id) => {
    try {
      await axios.delete(`${API_URL}/services/${id}`);
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  },
};

export default serviceService;
