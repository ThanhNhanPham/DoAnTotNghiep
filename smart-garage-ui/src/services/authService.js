import axios from 'axios';
import { API_ENDPOINTS, getAuthConfig, getAuthToken } from '../config/api';
import { ADMIN_ROLES, hasAnyRole, normalizeRole } from '../config/permissions';

// Helper function để decode JWT token
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

const persistBranchInfo = (data) => {
  const branchId = data?.branchId || data?.branch?.id;
  const branchName = data?.branchName || data?.branch?.name;

  if (branchId) {
    localStorage.setItem('branchId', String(branchId));
  } else {
    localStorage.removeItem('branchId');
  }

  if (branchName) {
    localStorage.setItem('branchName', branchName);
  } else {
    localStorage.removeItem('branchName');
  }
};

const persistUserSession = (data) => {
  if (!data) return;

  const email = data.email || data.username;
  const role = data.role;
  const userId = data.userId || data.id;

  if (email) {
    localStorage.setItem('userEmail', email);
  }

  if (role) {
    localStorage.setItem('userRole', role);
  }

  if (userId) {
    localStorage.setItem('userId', String(userId));
  }

  persistBranchInfo(data);
  localStorage.setItem('isAuthenticated', 'true');
};

const authService = {
  // API Đăng nhập
  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_ENDPOINTS.auth}/login`, {
        email,
        password,
      });
      
      console.log('Login response data:', response.data);
      
      // Lưu token vào localStorage
      if (response.data.token) {
        const token = response.data.token;
        localStorage.setItem('authToken', token);
        persistUserSession(response.data);
        
        // Decode JWT token để lấy userId
        const decodedToken = decodeToken(token);
        console.log('Decoded token:', decodedToken);
        
        if (decodedToken) {
          // Thử các key phổ biến cho userId trong JWT
          const userId = decodedToken.userId || decodedToken.id || decodedToken.sub;
          if (userId) {
            localStorage.setItem('userId', userId);
            console.log('UserId from token:', userId);
          } else {
            console.warn('UserId not found in JWT token');
          }
        }
        
        // Nếu backend trả về userId trực tiếp
        if (response.data.userId || response.data.id) {
          localStorage.setItem('userId', response.data.userId || response.data.id);
        }
        
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Đăng nhập thất bại!';
    }
  },

  // API Đăng ký
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_ENDPOINTS.auth}/register`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Đăng ký thất bại!';
    }
  },

  // API Debug password (dành cho test)
  debugPassword: async (email, password) => {
    try {
      const response = await axios.post(`${API_ENDPOINTS.auth}/debug-password`, {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Lỗi khi debug!';
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('branchId');
    localStorage.removeItem('branchName');
    localStorage.removeItem('isAuthenticated');
  },

  // Lấy token
  getToken: () => {
    return getAuthToken();
  },

  // Kiểm tra đăng nhập
  isAuthenticated: () => {
    return Boolean(getAuthToken());
  },

  // Lấy thông tin user
  getUserInfo: () => {
    return {
      email: localStorage.getItem('userEmail'),
      role: localStorage.getItem('userRole'),
      userId: localStorage.getItem('userId'),
      branchId: localStorage.getItem('branchId'),
      branchName: localStorage.getItem('branchName'),
    };
  },

  getUserRole: () => normalizeRole(localStorage.getItem('userRole')),

  hasAnyRole: (allowedRoles) => hasAnyRole(localStorage.getItem('userRole'), allowedRoles),

  isAdminUser: () => hasAnyRole(localStorage.getItem('userRole'), ADMIN_ROLES),

  hasCompleteAdminSession: () => {
    const role = normalizeRole(localStorage.getItem('userRole'));
    if (!hasAnyRole(role, ADMIN_ROLES)) {
      return false;
    }

    if (role === 'ADMIN' && !localStorage.getItem('branchId')) {
      return false;
    }

    return true;
  },

  restoreSession: async () => {
    if (!getAuthToken()) {
      return null;
    }

    const response = await axios.get(`${API_ENDPOINTS.auth}/me`, getAuthConfig());
    persistUserSession(response.data);
    return response.data;
  },

  // API Đổi mật khẩu
  changePassword: async (changePasswordRequest) => {
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.auth}/change-password`,
        changePasswordRequest,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Đổi mật khẩu thất bại!' };
    }
  },

  // API Gửi mã xác nhận quên mật khẩu
  forgotPassword: async (email) => {
    try {
      const response = await axios.post(`${API_ENDPOINTS.auth}/forgot-password`, {
        email,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Gửi mã xác nhận thất bại!' };
    }
  },

  // API Đặt lại mật khẩu bằng mã xác nhận
  resetPassword: async (resetPasswordRequest) => {
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.auth}/reset-password`,
        resetPasswordRequest
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Đặt lại mật khẩu thất bại!' };
    }
  },

  // API Cập nhật hồ sơ
  updateProfile: async (profileData) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await axios.put(
        `${API_ENDPOINTS.users}/${userId}`,
        profileData,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Cập nhật hồ sơ thất bại!' };
    }
  },

  // API Lấy thông tin user hiện tại
  getCurrentUser: async () => {
    try {
      let userId = localStorage.getItem('userId');
      
      console.log('Getting user info - Token:', getAuthToken() ? 'exists' : 'missing');
      console.log('Getting user info - UserId:', userId);
      
      // Kiểm tra nếu userId là email (không phải số) thì dùng endpoint khác
      if (!userId || isNaN(userId)) {
        console.log('UserId is not a number, trying to get from /auth/me endpoint');
        // Thử gọi endpoint /auth/me nếu có
        try {
          const response = await axios.get(
            `${API_ENDPOINTS.auth}/me`,
            getAuthConfig()
          );
          console.log('getCurrentUser from /auth/me response:', response.data);
          persistUserSession(response.data);
          return response.data;
        } catch (meError) {
          console.error('/auth/me endpoint error:', meError);
          throw { message: 'UserId không hợp lệ. Vui lòng đăng nhập lại.' };
        }
      }
      
      const response = await axios.get(
        `${API_ENDPOINTS.users}/${userId}`,
        getAuthConfig()
      );
      
      console.log('getCurrentUser response:', response.data);
      persistUserSession(response.data);
      return response.data;
    } catch (error) {
      console.error('getCurrentUser error:', error);
      throw error.response?.data || { message: error.message || 'Lấy thông tin user thất bại!' };
    }
  },
};

export default authService;
