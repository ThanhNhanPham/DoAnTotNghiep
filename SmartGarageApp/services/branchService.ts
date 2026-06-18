import apiClient from '@/constants/Api';

export interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  imageUrl?: string | null;
  isActive?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  travelDistanceKm?: number | null;
  travelDurationMinutes?: number | null;
}

const branchService = {
  async getActiveBranches() {
    const response = await apiClient.get<Branch[]>('/branches/active');
    return response.data;
  },

  async getNearbyActiveBranches(latitude: number, longitude: number) {
    const response = await apiClient.get<Branch[]>('/branches/active/nearby', {
      params: { latitude, longitude },
    });
    return response.data;
  },
};

export default branchService;
