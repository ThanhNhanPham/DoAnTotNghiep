import apiClient from '@/constants/Api';

export interface UpdateUserPayload {
  fullName: string;
  phone: string;
  houseNumber: string;
  ward: string;
  province: string;
}

export interface UserProfile extends UpdateUserPayload {
  id: number;
  email?: string;
  fullAddress?: string;
}

const userService = {
  async updateUser(id: number, payload: UpdateUserPayload) {
    const response = await apiClient.put<UserProfile>(`/users/${id}`, payload);
    return response.data;
  },
};

export default userService;
