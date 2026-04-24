/**
 * Booking API service
 *
 * Endpoints (backend: /api/v1/bookings):
 *   POST /              → Create booking
 *   GET  /              → List user bookings
 *   GET  /{id}          → Booking detail
 *   PUT  /{id}/cancel   → Cancel booking
 *   PUT  /{id}/reschedule → Reschedule booking
 */
import api from './api';
import { apiRaw } from './api';

// ─── Constants ───────────────────────────────────────────────────────────
const BASE = '/api/v1/bookings';

// ─── Types ───────────────────────────────────────────────────────────────

export interface CreateBookingRequest {
  doctorId: string;
  hospitalId: string;
  bookingDate: string; // YYYY-MM-DD
  slotStart: string;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'INSURANCE';
  notes?: string | null;
}

export interface CreateBookingResponse {
  bookingId: string;
  bookingRef: string;
}

export interface RescheduleRequest {
  newDate: string;      // YYYY-MM-DD
  newSlotStart: string; // "HH:mm-HH:mm" e.g. "09:00-09:15"
}

// Matches backend BookingResponse — used for GET /bookings/{id}
export interface BookingResponseItem {
  id: string;
  bookingRef: string;
  userId: string;
  doctorId: string;
  doctorName: string;
  hospitalId: string;
  hospitalName: string;
  specialization: string;
  bookingDate: string;
  slotStart: string;
  slotEnd: string;
  tokenNumber: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  amount: number;
  notes: string | null;
  canCancel: boolean;
  canReschedule: boolean;
}

export interface BookingDoctor {
  id: number;
  name: string;
  specialization: string;
  photo?: string;
}

export interface BookingUser {
  id: number;
  name: string;
  phone: string;
}

export interface BookingDetail {
  id: number;
  doctor: BookingDoctor;
  user: BookingUser;
  date: string;
  time: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  tokenNumber: number;
  hospitalName?: string;
}

export interface BookingListParams {
  status?: 'confirmed' | 'completed' | 'cancelled';
  page?: number;
  size?: number;
}

// ─── Booking List Types (upcoming / past endpoints) ─────────────────────

export interface BookingListItem {
  id: string;
  bookingRef: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  hospitalName: string;
  bookingDate: string;
  slotStart: string;
  slotEnd: string;
  tokenNumber: number;
  status: string;
  amount: number;
  canCancel: boolean;
  canReschedule: boolean;
}

export interface PaginationMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}

export type BookingListResponse = BookingListItem[];

// ─── Service Methods ─────────────────────────────────────────────────────

export const bookingService = {
  /** POST /api/v1/bookings — create booking */
  create: (data: CreateBookingRequest): Promise<CreateBookingResponse> =>
    api.post<CreateBookingResponse>(BASE, data),

  /** GET /api/v1/bookings — list user bookings */
  getAll: (params?: BookingListParams): Promise<BookingDetail[]> =>
    api.get<BookingDetail[]>(BASE, { params }),

  /** GET /api/v1/bookings/{id} — booking detail */
  getById: (id: number | string): Promise<BookingResponseItem> =>
    api.get<BookingResponseItem>(`${BASE}/${id}`),

  /** PUT /api/v1/bookings/{id}/cancel — cancel booking */
  cancel: (id: number | string): Promise<{ message: string }> =>
    api.put<{ message: string }>(`${BASE}/${id}/cancel`),

  /** PUT /api/v1/bookings/{id}/reschedule — reschedule booking */
  reschedule: (id: number | string, data: RescheduleRequest): Promise<BookingResponseItem> =>
    api.put<BookingResponseItem>(`${BASE}/${id}/reschedule`, data),

  /**
   * GET /api/v1/bookings/upcoming — paginated upcoming bookings
   */
  getUpcoming: async (params?: { page?: number; size?: number }): Promise<BookingListResponse> => {
    return api.get<BookingListResponse>(`${BASE}/upcoming`, {
      params: { page: params?.page ?? 0, size: params?.size ?? 10 },
    });
  },

  /**
   * GET /api/v1/bookings/past — paginated past bookings
   */
  getPast: async (params?: { page?: number; size?: number }): Promise<BookingListResponse> => {
    return api.get<BookingListResponse>(`${BASE}/past`, {
      params: { page: params?.page ?? 0, size: params?.size ?? 10 },
    });
  },
};

export default bookingService;
