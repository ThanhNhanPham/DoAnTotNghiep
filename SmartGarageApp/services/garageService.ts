import apiClient from '@/constants/Api';
import { VehicleType } from '@/services/vehicleService';

export interface GarageService {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  durationMinutes?: number | null;
  imageUrl?: string | null;
  type?: VehicleType | null;
  isActive?: boolean;
}

interface PageResponse<T> {
  content: T[];
}

const garageService = {
  async getAllServices() {
    const response = await apiClient.get<GarageService[] | PageResponse<GarageService>>('/services', {
      params: {
        isActive: true,
        size: 100,
      },
    });

    return Array.isArray(response.data) ? response.data : response.data.content || [];
  },
};

export default garageService;
