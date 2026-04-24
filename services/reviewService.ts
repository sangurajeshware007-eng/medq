/**
 * Review API service
 *
 * Reviews are accessed via doctor endpoints:
 *   GET /api/v1/doctors/{id}/reviews — Doctor reviews (in doctorService)
 *
 * This service handles standalone review operations if the backend
 * provides them, or delegates to doctorService.
 */
import api from './api';

// ─── Types ───────────────────────────────────────────────────────────────

export interface SubmitReviewRequest {
    doctorId: string | number;
    rating: number;
    comment: string;
}

export interface SubmitReviewResponse {
    message: string;
}

export interface ReviewUser {
    id: string | number;
    name: string;
}

export interface ReviewItem {
    id: string | number;
    user: ReviewUser;
    rating: number;
    comment: string;
    date: string;
}

// ─── Service Methods ─────────────────────────────────────────────────────

export const reviewService = {
    /** POST review for a doctor */
    submit: (data: SubmitReviewRequest): Promise<SubmitReviewResponse> =>
        api.post<SubmitReviewResponse>(`/api/v1/doctors/${data.doctorId}/reviews`, data),

    /** GET reviews for a doctor (delegates to doctor endpoint) */
    getByDoctorId: (doctorId: number | string): Promise<ReviewItem[]> =>
        api.get<ReviewItem[]>(`/api/v1/doctors/${doctorId}/reviews`),
};

export default reviewService;
