import apiClient from '@/constants/Api';

export type VehicleType = 'MOTORBIKE' | 'CAR';

export interface VehiclePayload {
  licensePlate: string;
  brand: string;
  model: string;
  color?: string;
  type: VehicleType;
  isActive?: boolean;
}

export interface Vehicle extends VehiclePayload {
  id: number;
  ownerName?: string | null;
  isActive: boolean;
}

const vehicleService = {
  async getVehiclesByUserId(userId: number) {
    const response = await apiClient.get<Vehicle[]>(`/vehicles/user/${userId}`);
    return response.data;
  },

  async createVehicle(userId: number, vehicleData: VehiclePayload) {
    const response = await apiClient.post<Vehicle>(`/vehicles/user/${userId}`, vehicleData);
    return response.data;
  },

  async updateVehicle(id: number, vehicleData: VehiclePayload) {
    const response = await apiClient.put<Vehicle>(`/vehicles/${id}`, vehicleData);
    return response.data;
  },

  async deleteVehicle(id: number) {
    const response = await apiClient.delete(`/vehicles/${id}`);
    return response.data;
  },
};

export default vehicleService;
