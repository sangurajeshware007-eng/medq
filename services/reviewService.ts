/**
 * Review API service — mirrors backend /api/v1/reviews + /api/v1/doctors/{id}/reviews.
 *
 *   POST /api/v1/reviews                       → create
 *   PUT  /api/v1/reviews/{id}                  → edit own (within 7 days of visit)
 *   GET  /api/v1/reviews/by-booking/{bookingId} → fetch caller's review for a booking
 *   GET  /api/v1/doctors/{doctorId}/reviews    → paginated reviews of a doctor
 */
import api, { apiRaw } from './api';

// ─── Types ───────────────────────────────────────────────────────────────

export interface SubmitReviewRequest {
  bookingId: string;
  rating: number;
  comment?: string | null;
}

export interface UpdateReviewRequest {
  rating: number;
  comment?: string | null;
}

/** Backend ReviewResponse (flat shape). userName is masked first-name + last-initial. */
export interface ReviewItem {
  id: string;
  userId: string;
  userName: string;
  doctorId: string;
  bookingId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

/** Spring Data PagedResponse envelope as exposed by the backend. */
export interface PagedReviews {
  content: ReviewItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}

// ─── Service Methods ─────────────────────────────────────────────────────

export const reviewService = {
  submit: (data: SubmitReviewRequest): Promise<ReviewItem> =>
    api.post<ReviewItem>('/api/v1/reviews', data),

  update: (reviewId: string, data: UpdateReviewRequest): Promise<ReviewItem> =>
    api.put<ReviewItem>(`/api/v1/reviews/${reviewId}`, data),

  getMyReviewForBooking: (bookingId: string): Promise<ReviewItem | null> =>
    api.get<ReviewItem | null>(`/api/v1/reviews/by-booking/${bookingId}`),

  /**
   * Paginated reviews for a doctor. The backend serialises Spring Data pages as
   * `{ success, data: ReviewItem[], meta: { page, size, ... } }` — `data` holds
   * the content and pagination lives in `meta`. The default `api` interceptor
   * strips the envelope and would leave us with just an array, so this call uses
   * `apiRaw` and re-assembles the `PagedReviews` shape the hooks expect.
   */
  getByDoctorId: async (
    doctorId: number | string,
    params?: { page?: number; size?: number },
  ): Promise<PagedReviews> => {
    const body = await apiRaw.get<{
      success: boolean;
      data: ReviewItem[] | null;
      meta?: {
        page: number;
        size: number;
        totalElements: number;
        totalPages: number;
        isFirst: boolean;
        isLast: boolean;
      };
    }>(`/api/v1/doctors/${doctorId}/reviews`, {
      params: { page: params?.page ?? 0, size: params?.size ?? 10 },
    });
    const content = body.data ?? [];
    const meta = body.meta;
    return {
      content,
      page: meta?.page ?? params?.page ?? 0,
      size: meta?.size ?? params?.size ?? 10,
      totalElements: meta?.totalElements ?? content.length,
      totalPages: meta?.totalPages ?? (content.length === 0 ? 0 : 1),
      isFirst: meta?.isFirst ?? true,
      isLast: meta?.isLast ?? true,
    };
  },
};

export default reviewService;
