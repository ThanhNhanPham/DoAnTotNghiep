import apiClient from '@/constants/Api';
import { MembershipTier } from './authService';

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER';

export interface BookingPayload {
  vehicleId: number;
  branchId: number;
  arrivalSlotStart: string;
  arrivalSlotEnd: string;
  serviceIds: number[];
  note?: string;
  paymentMethod: PaymentMethod;
}

export interface UpdateBookingPayload {
  vehicleId: number;
  branchId: number;
  arrivalSlotStart: string;
  arrivalSlotEnd: string;
  serviceIds: number[];
  note?: string;
}

export interface BookingResponse {
  id: number;
  status?: string;
  createdAt?: string;
  bookingTime?: string;
  arrivalSlotStart?: string;
  arrivalSlotEnd?: string;
  arrivalTime?: string | null;
  repairStartTime?: string | null;
  repairEndTime?: string | null;
  customerName?: string;
  vehicleOwnerName?: string | null;
  customerPhone?: string;
  vehicleId?: number | null;
  vehicleName?: string;
  vehicleType?: string | null;
  vehicleImageUrl?: string | null;
  licensePlate?: string;
  branchId?: number | null;
  branchName?: string;
  mechanicName?: string;
  serviceIds?: number[];
  serviceNames?: string[];
  partNames?: string[];
  note?: string | null;
  cancelReason?: string | null;
  serviceAmount?: number;
  partAmount?: number;
  membershipTierApplied?: MembershipTier | null;
  membershipDiscountRate?: number;
  membershipDiscountAmount?: number;
  pointsEarned?: number;
  finalAmount?: number;
  totalAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: string;
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
  async getMyBookings() {
    const response = await apiClient.get<BookingResponse[]>('/bookings');
    return response.data;
  },

  async getBookingById(id: number) {
    const response = await apiClient.get<BookingResponse>(`/bookings/${id}`);
    return response.data;
  },

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

  async updateBooking(id: number, payload: UpdateBookingPayload) {
    const response = await apiClient.patch<BookingResponse>(`/bookings/${id}`, payload);
    return response.data;
  },
};

export default bookingService;
