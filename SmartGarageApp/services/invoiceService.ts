import apiClient from '@/constants/Api';
import { MembershipTier } from './authService';
import { PaymentMethod } from './bookingService';

export interface InvoiceResponse {
  invoiceId: number;
  invoiceNumber: string;
  bookingId: number;
  customerName?: string | null;
  customerPhone?: string | null;
  licensePlate?: string | null;
  serviceAmount?: number;
  partAmount?: number;
  membershipTier?: MembershipTier | null;
  membershipDiscountRate?: number;
  membershipDiscountAmount?: number;
  finalAmount?: number;
  pointsEarned?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: string;
  issuedAt?: string;
  note?: string | null;
}

const invoiceService = {
  async getInvoiceById(id: number) {
    const response = await apiClient.get<InvoiceResponse>(`/invoices/${id}`);
    return response.data;
  },

  async getInvoiceByBookingId(bookingId: number) {
    const response = await apiClient.get<InvoiceResponse>(`/invoices/booking/${bookingId}`);
    return response.data;
  },
};

export default invoiceService;
