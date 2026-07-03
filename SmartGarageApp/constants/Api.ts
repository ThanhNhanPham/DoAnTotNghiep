import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import { Alert } from 'react-native';

// Đối với Emulator/Simulator:
// - iOS: localhost hoặc IP máy tính
// - Android: 10.0.2.2 hoặc IP máy tính
// Sử dụng IP máy tính để cả máy ảo và thiết bị thật đều kết nối được
// export const BASE_URL = 'http://localhost:8080/api/v1';
export const BASE_URL = 'http://172.20.10.7:8080/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRedirectingToLogin = false;

const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

const isPublicAuthRequest = (url?: string) =>
  Boolean(url && PUBLIC_AUTH_PATHS.some((path) => url.includes(path)));

const redirectToLoginForExpiredSession = async () => {
  if (isRedirectingToLogin) {
    return;
  }

  isRedirectingToLogin = true;
  await AsyncStorage.clear();
  router.replace('/login');

  Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại để tiếp tục.');
  isRedirectingToLogin = false;
};

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url;
    const hasToken = Boolean(await AsyncStorage.getItem('token'));
    const isAuthError = status === 401 || status === 403;

    if (hasToken && isAuthError && !isPublicAuthRequest(requestUrl)) {
      await redirectToLoginForExpiredSession();
    }

    return Promise.reject(error);
  }
);

export default apiClient;
