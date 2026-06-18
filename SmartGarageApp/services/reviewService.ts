import apiClient from '@/constants/Api';

export interface ReviewPayload {
  bookingId: number;
  rating: number;
  comment?: string;
}

export interface ReviewItem {
  id: number;
  rating: number;
  comment?: string | null;
  adminReply?: string | null;
  repliedAt?: string | null;
  createdAt?: string | null;
}

export interface ReviewSummary {
  totalReviews: number;
  averageRating: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}

const reviewService = {
  async createReview(payload: ReviewPayload) {
    const response = await apiClient.post<ReviewItem>('/reviews', payload);
    return response.data;
  },

  async getReviewByBooking(bookingId: number) {
    const response = await apiClient.get<ReviewItem>(`/reviews/booking/${bookingId}`);
    return response.data;
  },

  async getReviews(page = 0, size = 10) {
    const response = await apiClient.get<PageResponse<ReviewItem>>('/reviews', {
      params: { page, size },
    });
    return response.data;
  },

  async getReviewSummary() {
    const response = await apiClient.get<ReviewSummary>('/reviews/summary');
    return response.data;
  },

  async replyToReview(id: number, reply: string) {
    const response = await apiClient.patch<ReviewItem>(`/reviews/${id}/reply`, { reply });
    return response.data;
  },
};

export default reviewService;
