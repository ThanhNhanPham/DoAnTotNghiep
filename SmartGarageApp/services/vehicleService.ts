import apiClient from '@/constants/Api';

export type VehicleType = 'MOTORBIKE' | 'CAR';

export interface VehiclePayload {
  licensePlate: string;
  brand: string;
  model: string;
  color?: string;
  imageUrl?: string;
  type: VehicleType;
  isActive?: boolean;
}

export interface Vehicle extends VehiclePayload {
  id: number;
  ownerName?: string | null;
  isActive: boolean;
}

interface VehicleImageUploadPayload {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
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

  async uploadVehicleImage(file: VehicleImageUploadPayload) {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.fileName || `vehicle-${Date.now()}.jpg`,
      type: file.mimeType || 'image/jpeg',
    } as any);

    const response = await apiClient.post<{ imageUrl: string }>('/vehicles/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.imageUrl;
  },

  async deleteVehicle(id: number) {
    const response = await apiClient.delete(`/vehicles/${id}`);
    return response.data;
  },
};

export default vehicleService;
