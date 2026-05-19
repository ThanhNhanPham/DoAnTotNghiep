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

export interface AvailableBookingSlot {
  start: string;
  end: string;
  remainingCapacity: number;
}

export interface AvailableBookingSlotResponse {
  branchId: number;
  date: string;
  slotDurationMinutes: number;
  slotIntervalMinutes: number;
  branchCapacity: number;
  slots: AvailableBookingSlot[];
}

const bookingService = {
  async getAvailableSlots(branchId: number, date: string, slotDurationMinutes = 60, slotIntervalMinutes = 60) {
    const response = await apiClient.get<AvailableBookingSlotResponse>('/bookings/available-slots', {
      params: {
        branchId,
        date,
        slotDurationMinutes,
        slotIntervalMinutes,
      },
    });
    return response.data;
  },

  async createBooking(payload: BookingPayload) {
    const response = await apiClient.post<BookingResponse>('/bookings', payload);
    return response.data;
  },
};

export default bookingService;
