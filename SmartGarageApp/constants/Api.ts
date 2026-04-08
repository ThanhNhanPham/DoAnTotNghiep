import axios from 'axios';

// Đối với Emulator/Simulator:
// - iOS: localhost hoặc IP máy tính
// - Android: 10.0.2.2 hoặc IP máy tính
// Sử dụng IP máy tính để cả máy ảo và thiết bị thật đều kết nối được
export const BASE_URL = 'http://192.168.1.100:8080/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
