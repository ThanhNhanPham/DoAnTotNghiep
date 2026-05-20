import apiClient from '@/constants/Api';

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

const authService = {
  async changePassword(payload: ChangePasswordPayload) {
    const response = await apiClient.post('/auth/change-password', payload);
    return response.data;
  },

  async forgotPassword(payload: ForgotPasswordPayload) {
    const response = await apiClient.post('/auth/forgot-password', payload);
    return response.data;
  },

  async resetPassword(payload: ResetPasswordPayload) {
    const response = await apiClient.post('/auth/reset-password', payload);
    return response.data;
  },
};

export default authService;
