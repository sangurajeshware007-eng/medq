/**
 * Dashboard API Service
 *
 * Doctor:
 *   GET /api/v1/doctor/dashboard             → DoctorDashboardResponse
 *
 * Hospital Manager:
 *   GET /api/v1/hospital-manager/dashboard   → HospitalManagerDashboardResponse
 *
 * Admin:
 *   GET /api/v1/admin/onboarding/dashboard   → AdminDashboardResponse
 *   GET /api/v1/admin/onboarding/doctors     → AdminDoctorSummaryDto[]
 *   GET /api/v1/admin/onboarding/hospitals   → AdminHospitalSummaryDto[]
 *   GET /api/v1/admin/onboarding/pending     → PendingOnboardingResponse
 *   PATCH /api/v1/admin/onboarding/doctor/:id/approve
 *   PATCH /api/v1/admin/onboarding/doctor/:id/reject
 *   PATCH /api/v1/admin/onboarding/hospital/:id/approve
 *   PATCH /api/v1/admin/onboarding/hospital/:id/reject
 */
import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────

export interface DoctorHospitalSummary {
  hospitalId: string;
  hospitalName: string;
  address: string;
  roomNumber: string | null;
  consultationFee: number;
}

export interface AppointmentSummary {
  bookingId: string;
  patientName: string | null;
  patientPhone: string | null;
  slotStart: string;
  slotEnd: string;
  tokenNumber: number;
  status: string;
  amount: number;
  paymentStatus: string;
}

export interface DoctorDateAppointments {
  date: string;
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  dateRevenue: number;
  appointments: AppointmentSummary[];
}

export interface DayRevenue {
  date: string;
  revenue: number;
}

export interface RevenueStats {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  dailyBreakdown: DayRevenue[];
}

export interface TodayStats {
  totalBookings: number;
  confirmedBookings: number;
  upcomingAppointments: AppointmentSummary[];
}

export interface DoctorDashboard {
  doctorId: string;
  name: string;
  specialization: string;
  approvalStatus: string;
  isActive: boolean;
  /** Doctor-controlled pause for NEW online bookings (independent of isActive). */
  acceptingBookings: boolean;
  profileStrength: number;
  primaryHospital: DoctorHospitalSummary | null;
  today: TodayStats;
  revenue: RevenueStats;
}

export interface LinkedDoctor {
  doctorId: string;
  name: string;
  specialization: string;
  approvalStatus: string;
  consultationFee: number;
  roomNumber: string | null;
  isPrimary: boolean;
  rating: number;
  avatarUrl: string | null;
}

export interface HospitalStats {
  todayBookings: number;
  weekBookings: number;
  monthBookings: number;
  weekRevenue: number;
  monthRevenue: number;
}

export interface HospitalManagerDashboard {
  hospitalId: string;
  hospitalName: string;
  approvalStatus: string;
  isActive: boolean;
  isVerified: boolean;
  departments: string[];
  totalDoctors: number;
  linkedDoctors: LinkedDoctor[];
  stats: HospitalStats;
}

export interface PlatformStats {
  totalDoctors: number;
  activeDoctors: number;
  totalHospitals: number;
  activeHospitals: number;
  todayBookings: number;
  monthBookings: number;
  monthRevenue: number;
}

export interface PendingCount {
  doctors: number;
  hospitals: number;
}

export interface AdminDoctorSummary {
  doctorId: string;
  name: string;
  specialization: string;
  approvalStatus: string;
  isActive: boolean;
  registrationNo: string | null;
  createdAt: string | null;
}

export interface AdminHospitalSummary {
  hospitalId: string;
  name: string;
  address: string;
  approvalStatus: string;
  isActive: boolean;
  isVerified: boolean;
  totalDoctors: number;
  createdAt: string | null;
}

export interface AdminDashboard {
  platformStats: PlatformStats;
  pendingApprovals: PendingCount;
  recentDoctors: AdminDoctorSummary[];
  recentHospitals: AdminHospitalSummary[];
}

export interface PendingOnboarding {
  pendingDoctors: Array<{
    id: string;
    name: string;
    specialization: string | null;
    profileStrength: number;
    approvalStatus: string;
    rejectionReason: string | null;
    type: string;
  }>;
  pendingHospitals: Array<{
    id: string;
    name: string;
    specialization: null;
    profileStrength: number;
    approvalStatus: string;
    rejectionReason: string | null;
    type: string;
  }>;
}

// ─── Service ──────────────────────────────────────────────────────────────

const dashboardService = {
  // ── Doctor ─────────────────────────────────────────────────────────────

  getDoctorDashboard: () => api.get<DoctorDashboard>('/api/v1/doctor/dashboard'),

  getAppointmentsForDate: (date: string) =>
    api.get<DoctorDateAppointments>('/api/v1/doctor/dashboard/appointments', { params: { date } }),

  /** Doctor flips their own booking to COMPLETED (consultation done) or NO_SHOW (patient absent). */
  markAppointmentStatus: (bookingId: string, status: 'COMPLETED' | 'NO_SHOW') =>
    api.patch<AppointmentSummary>(`/api/v1/doctor/dashboard/appointments/${bookingId}/status`, {
      status,
    }),

  // ── Hospital Manager ────────────────────────────────────────────────────

  getHospitalManagerDashboard: () =>
    api.get<HospitalManagerDashboard>('/api/v1/hospital-manager/dashboard'),

  // ── Admin ───────────────────────────────────────────────────────────────

  getAdminDashboard: () => api.get<AdminDashboard>('/api/v1/admin/onboarding/dashboard'),

  /**
   * The backend endpoint paginates each list independently (v2 of the API),
   * but the dashboard UI just wants flat arrays to map over. We unwrap
   * `.content` here so every downstream consumer stays unchanged.
   * A single dashboard pull of up to 100+100 rows is the whole review queue
   * in the current service area — no infinite scroll needed.
   */
  getAdminPending: async (): Promise<PendingOnboarding> => {
    type Paged<T> = { content: T[] };
    type Raw = {
      pendingDoctors:
        | Paged<PendingOnboarding['pendingDoctors'][number]>
        | PendingOnboarding['pendingDoctors'];
      pendingHospitals:
        | Paged<PendingOnboarding['pendingHospitals'][number]>
        | PendingOnboarding['pendingHospitals'];
    };
    const raw = await api.get<Raw>('/api/v1/admin/onboarding/pending', {
      params: { doctorsSize: 100, hospitalsSize: 100 },
    });
    const unwrap = <T>(x: Paged<T> | T[] | undefined): T[] =>
      Array.isArray(x) ? x : (x?.content ?? []);
    return {
      pendingDoctors: unwrap(raw.pendingDoctors),
      pendingHospitals: unwrap(raw.pendingHospitals),
    };
  },

  listAllDoctors: () => api.get<AdminDoctorSummary[]>('/api/v1/admin/onboarding/doctors'),

  listAllHospitals: () => api.get<AdminHospitalSummary[]>('/api/v1/admin/onboarding/hospitals'),

  approveDoctor: (doctorId: string) =>
    api.patch<{ message: string }>(`/api/v1/admin/onboarding/doctor/${doctorId}/approve`),

  rejectDoctor: (doctorId: string, rejectionReason: string) =>
    api.patch<{ message: string }>(`/api/v1/admin/onboarding/doctor/${doctorId}/reject`, {
      rejectionReason,
    }),

  approveHospital: (hospitalId: string) =>
    api.patch<{ message: string }>(`/api/v1/admin/onboarding/hospital/${hospitalId}/approve`),

  rejectHospital: (hospitalId: string, rejectionReason: string) =>
    api.patch<{ message: string }>(`/api/v1/admin/onboarding/hospital/${hospitalId}/reject`, {
      rejectionReason,
    }),

  // ── Active / Inactive toggle (post-approval operational control) ───────
  toggleDoctorStatus: (doctorId: string, isActive: boolean, reason?: string) =>
    api.patch<{ message: string }>(`/api/v1/admin/doctors/${doctorId}/status`, {
      isActive,
      reason,
    }),

  toggleHospitalStatus: (hospitalId: string, isActive: boolean, reason?: string) =>
    api.patch<{ message: string }>(`/api/v1/admin/hospitals/${hospitalId}/status`, {
      isActive,
      reason,
    }),
};

export default dashboardService;
