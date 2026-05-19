import apiClient from '@/constants/Api';

export type PaymentMethod = 'CASH' | 'MOMO';

export interface BookingPayload {
  vehicleId: number;
  branchId: number;
  arrivalSlotStart: string;
  arrivalSlotEnd: string;
  serviceIds: number[];
  note?: string;
  paymentMethod: PaymentMethod;
}

export interface BookingResponse {
  id: number;
  status?: string;
  bookingTime?: string;
  arrivalSlotStart?: string;
  arrivalSlotEnd?: string;
  totalAmount?: number;
  note?: string;
}

const bookingService = {
  async createBooking(payload: BookingPayload) {
    const response = await apiClient.post<BookingResponse>('/bookings', payload);
    return response.data;
  },
};

export default bookingService;
