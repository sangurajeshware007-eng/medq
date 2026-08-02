/**
 * Doctor live queue API service (doctor-side console)
 *
 * Endpoints (backend: /api/v1/doctor/queue, role DOCTOR):
 *   GET  /                    → today's queue state
 *   POST /start | /end        → open / close today's session
 *   POST /next  | /skip       → advance the queue
 *   POST /recall/{bookingId}  → re-point at a passed-over patient
 *
 * Every mutation returns the full new queue state — hooks write it
 * straight into the query cache (no optimistic guessing).
 */
import api from './api';

// ─── Types ───────────────────────────────────────────────────────────────

export type QueueSessionStatus = 'NOT_STARTED' | 'ACTIVE' | 'ENDED';

export interface QueueEntry {
  bookingId: string;
  tokenNumber: number;
  patientName: string | null;
  patientPhone: string | null;
  slotStart: string;
  /** BookingStatus name: CONFIRMED | COMPLETED | CANCELLED | NO_SHOW | PENDING */
  status: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  isCurrent: boolean;
}

export interface DoctorQueueState {
  sessionStatus: QueueSessionStatus;
  date: string;
  currentTokenNumber: number;
  currentPatient: QueueEntry | null;
  totalTokensToday: number;
  waitingCount: number;
  notArrivedCount: number;
  completedCount: number;
  startedAt: string | null;
  endedAt: string | null;
  entries: QueueEntry[];
}

// ─── Constants ───────────────────────────────────────────────────────────
const BASE = '/api/v1/doctor/queue';

// ─── Service Methods ─────────────────────────────────────────────────────

export const doctorQueueService = {
  /** GET /api/v1/doctor/queue — today's queue state */
  getQueue: (): Promise<DoctorQueueState> => api.get<DoctorQueueState>(BASE),

  /** POST /api/v1/doctor/queue/start — open (or resume) today's session */
  start: (): Promise<DoctorQueueState> => api.post<DoctorQueueState>(`${BASE}/start`),

  /** POST /api/v1/doctor/queue/end — close today's session */
  end: (): Promise<DoctorQueueState> => api.post<DoctorQueueState>(`${BASE}/end`),

  /** POST /api/v1/doctor/queue/next — complete current + call next checked-in patient */
  next: (): Promise<DoctorQueueState> => api.post<DoctorQueueState>(`${BASE}/next`),

  /** POST /api/v1/doctor/queue/skip — advance without completing current */
  skip: (): Promise<DoctorQueueState> => api.post<DoctorQueueState>(`${BASE}/skip`),

  /** POST /api/v1/doctor/queue/recall/{bookingId} — recall a passed-over patient */
  recall: (bookingId: string): Promise<DoctorQueueState> =>
    api.post<DoctorQueueState>(`${BASE}/recall/${bookingId}`),
};

export default doctorQueueService;
