import apiClient from '@/constants/Api';

export type MembershipTier = 'REGULAR' | 'BRONZE' | 'SILVER' | 'GOLD';

export interface AuthMeResponse {
  userId: number;
  email: string;
  role: string;
  fullName: string;
  phone: string;
  fullAddress: string;
  isActive: boolean;
  loyaltyPoints: number;
  membershipTier: MembershipTier;
}

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

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  province: string;
  ward: string;
  houseNumber: string;
}

const authService = {
  async getMe() {
    const response = await apiClient.get<AuthMeResponse>('/auth/me');
    return response.data;
  },

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

  async register(payload: RegisterPayload) {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
  },
};

export default authService;
