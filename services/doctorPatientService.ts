/**
 * Doctor "My Patients" API service
 *
 * Endpoints (backend: /api/v1/doctor/patients, role DOCTOR):
 *   GET /?search=&page=&size=              → distinct patients, latest visit first
 *   GET /{userId}/history?page=&size=      → that patient's bookings with me
 */
import api from './api';

// ─── Types ───────────────────────────────────────────────────────────────

export interface DoctorPatientSummary {
  userId: string;
  name: string | null;
  phone: string | null;
  visitCount: number;
  lastVisitDate: string | null;
}

export interface PatientVisit {
  bookingId: string;
  bookingRef: string;
  date: string;
  slotStart: string;
  slotEnd: string;
  status: string;
  tokenNumber: number;
  amount: number;
  hospitalName: string | null;
}

/** Backend common PagedResponse envelope (already unwrapped from ApiResponse). */
export interface Paged<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────
const BASE = '/api/v1/doctor/patients';

// ─── Service Methods ─────────────────────────────────────────────────────

export const doctorPatientService = {
  /** GET /api/v1/doctor/patients — searchable, paginated distinct patients */
  list: (params: {
    page?: number;
    size?: number;
    search?: string;
  }): Promise<Paged<DoctorPatientSummary>> =>
    api.get<Paged<DoctorPatientSummary>>(BASE, {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
        ...(params.search ? { search: params.search } : {}),
      },
    }),

  /** GET /api/v1/doctor/patients/{userId}/history — one patient's visits with me */
  history: (
    patientUserId: string,
    params?: { page?: number; size?: number },
  ): Promise<Paged<PatientVisit>> =>
    api.get<Paged<PatientVisit>>(`${BASE}/${patientUserId}/history`, {
      params: { page: params?.page ?? 0, size: params?.size ?? 20 },
    }),
};

export default doctorPatientService;
