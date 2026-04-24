/**
 * React Query hooks for all API endpoints.
 * Provides loading states, error handling, and caching out of the box.
 */
import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';

import {
  hospitalService,
  doctorService,
  bookingService,
  reviewService,
  tokenService,
  searchService,
} from '../services';
import type {
  HospitalListItem,
  HospitalDetail,
  DoctorListItem,
  DoctorDetail,
  DoctorFilterParams,
  DoctorReview,
  AvailableSlotsResponse,
  CreateBookingRequest,
  CreateBookingResponse,
  BookingDetail,
  BookingResponseItem,
  BookingListParams,
  BookingListResponse,
  RescheduleRequest,
  SubmitReviewRequest,
  SubmitReviewResponse,
  ReviewItem,
  LiveQueueState,
  MyTokenPosition,
  UnifiedSearchResult,
  UnifiedSearchParams,
  NearbyParams,
  ApiError,
} from '../services';
import dashboardService from '../services/dashboardService';
import type {
  DoctorDashboard,
  DoctorDateAppointments,
  HospitalManagerDashboard,
  AdminDashboard,
  PendingOnboarding,
  AdminDoctorSummary,
  AdminHospitalSummary,
} from '../services/dashboardService';
import onboardingService from '../services/onboardingService';
import type {
  DoctorOnboardingStatusSummary,
  HospitalOnboardingStatusSummary,
} from '../services/onboardingService';

// ─── Query Keys ──────────────────────────────────────────────────────────
export const queryKeys = {
  hospitals: ['hospitals'] as const,
  hospital: (id: number | string) => ['hospital', id] as const,
  nearbyHospitals: (lat: number, lng: number, radiusKm?: number) =>
    ['hospitals', 'nearby', lat, lng, radiusKm] as const,
  nearbyDoctors: (lat: number, lng: number, radiusKm?: number) =>
    ['doctors', 'nearby', lat, lng, radiusKm] as const,
  doctors: (params?: DoctorFilterParams) => ['doctors', params] as const,
  doctor: (id: number | string) => ['doctor', id] as const,
  doctorSlots: (id: number | string, date: string) => ['doctor', id, 'slots', date] as const,
  doctorReviews: (id: number | string) => ['doctor', id, 'reviews'] as const,
  bookings: (params?: BookingListParams) => ['bookings', params] as const,
  booking: (id: number | string) => ['booking', id] as const,
  upcomingBookings: (page: number, size: number) => ['bookings', 'upcoming', page, size] as const,
  pastBookings: (page: number, size: number) => ['bookings', 'past', page, size] as const,
  reviews: (doctorId: number | string) => ['reviews', doctorId] as const,
  liveQueue: (doctorId: number | string) => ['tokens', 'live', doctorId] as const,
  myToken: (bookingId: number | string) => ['tokens', 'my', bookingId] as const,
  search: (query: string) => ['search', query] as const,
  doctorOnboardingStatus: ['doctor', 'onboarding-status'] as const,
  hospitalOnboardingStatus: ['hospital', 'onboarding-status'] as const,
  doctorDashboard: ['doctor', 'dashboard'] as const,
  hospitalManagerDashboard: ['hospital-manager', 'dashboard'] as const,
  adminDashboard: ['admin', 'dashboard'] as const,
  adminPending: ['admin', 'pending'] as const,
  adminDoctors: ['admin', 'doctors'] as const,
  adminHospitals: ['admin', 'hospitals'] as const,
};

// ─── Hospital Hooks ──────────────────────────────────────────────────────

/** Fetch all hospitals */
export function useHospitals(
  options?: Omit<UseQueryOptions<HospitalListItem[], ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<HospitalListItem[], ApiError>({
    queryKey: queryKeys.hospitals,
    queryFn: () => hospitalService.getAll(),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/** Fetch a specific hospital by ID */
export function useHospital(
  id: number | string,
  options?: Omit<UseQueryOptions<HospitalDetail, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<HospitalDetail, ApiError>({
    queryKey: queryKeys.hospital(id),
    queryFn: () => hospitalService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/** Fetch nearby hospitals by GPS coordinates */
export function useNearbyHospitals(
  params: NearbyParams | null,
  options?: Omit<UseQueryOptions<HospitalListItem[], ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<HospitalListItem[], ApiError>({
    queryKey: params
      ? queryKeys.nearbyHospitals(params.lat, params.lng, params.radius_km)
      : ['hospitals', 'nearby'],
    queryFn: () => hospitalService.getNearby(params!),
    enabled: !!params,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

/**
 * Fetch all doctors (geo-filtered when lat/lng provided).
 * Returns up to `size` doctors within `radius_km`.
 * The full list is cached for client-side disease/category filtering.
 */
export function useNearbyDoctors(
  params: { lat: number; lng: number; radius_km?: number; size?: number } | null,
  options?: Omit<UseQueryOptions<DoctorListItem[], ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<DoctorListItem[], ApiError>({
    queryKey: params
      ? queryKeys.nearbyDoctors(params.lat, params.lng, params.radius_km)
      : ['doctors', 'nearby'],
    queryFn: () =>
      doctorService.getAll({
        lat: params!.lat,
        lng: params!.lng,
        radius_km: params!.radius_km ?? 15,
        size: params!.size ?? 100,
      }),
    enabled: !!params,
    staleTime: 5 * 60 * 1000, // 5 min — cached for client-side filtering
    ...options,
  });
}

// ─── Doctor Hooks ────────────────────────────────────────────────────────

/** Fetch all/filtered doctors */
export function useDoctors(
  params?: DoctorFilterParams,
  options?: Omit<UseQueryOptions<DoctorListItem[], ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<DoctorListItem[], ApiError>({
    queryKey: queryKeys.doctors(params),
    queryFn: () => doctorService.getAll(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/** Fetch a specific doctor by ID */
export function useDoctor(
  id: number | string,
  options?: Omit<UseQueryOptions<DoctorDetail, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<DoctorDetail, ApiError>({
    queryKey: queryKeys.doctor(id),
    queryFn: () => doctorService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/** Fetch available time slots for a doctor on a specific date */
export function useDoctorSlots(
  id: number | string,
  date: string,
  options?: Omit<UseQueryOptions<AvailableSlotsResponse, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<AvailableSlotsResponse, ApiError>({
    queryKey: queryKeys.doctorSlots(id, date),
    queryFn: () => doctorService.getAvailableSlots(id, date),
    enabled: !!id && !!date,
    staleTime: 60 * 1000, // 1 min — slots change quickly
    ...options,
  });
}

/** Fetch doctor reviews */
export function useDoctorReviews(
  id: number | string,
  options?: Omit<UseQueryOptions<DoctorReview[], ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<DoctorReview[], ApiError>({
    queryKey: queryKeys.doctorReviews(id),
    queryFn: () => doctorService.getReviews(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

// ─── Booking Hooks ───────────────────────────────────────────────────────

/** Create a new booking (mutation) */
export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation<CreateBookingResponse, ApiError, CreateBookingRequest>({
    mutationFn: (data) => bookingService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

/** Fetch user's bookings */
export function useBookings(
  params?: BookingListParams,
  options?: Omit<UseQueryOptions<BookingDetail[], ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<BookingDetail[], ApiError>({
    queryKey: queryKeys.bookings(params),
    queryFn: () => bookingService.getAll(params),
    staleTime: 60 * 1000,
    ...options,
  });
}

/** Fetch a specific booking by ID */
export function useBooking(
  id: number | string,
  options?: Omit<UseQueryOptions<BookingDetail, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<BookingDetail, ApiError>({
    queryKey: queryKeys.booking(id),
    queryFn: () => bookingService.getById(id),
    enabled: !!id,
    ...options,
  });
}

/** Cancel a booking (mutation) */
export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, number | string>({
    mutationFn: (id) => bookingService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

/** Fetch a single booking by ID */
export function useBookingDetail(id: string) {
  return useQuery<BookingResponseItem, ApiError>({
    queryKey: ['booking', id],
    queryFn: () => bookingService.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/** Reschedule a booking (mutation) */
export function useRescheduleBooking() {
  const queryClient = useQueryClient();
  return useMutation<BookingResponseItem, ApiError, { id: string; data: RescheduleRequest }>({
    mutationFn: ({ id, data }) => bookingService.reschedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    },
  });
}

/**
 * Fetch upcoming bookings (paginated).
 * GET /api/v1/bookings/upcoming?page=N&size=N
 */
export function useUpcomingBookings(
  params?: { page?: number; size?: number },
  options?: Omit<UseQueryOptions<BookingListResponse, ApiError>, 'queryKey' | 'queryFn'>,
) {
  const page = params?.page ?? 0;
  const size = params?.size ?? 10;
  return useQuery<BookingListResponse, ApiError>({
    queryKey: queryKeys.upcomingBookings(page, size),
    queryFn: () => bookingService.getUpcoming({ page, size }),
    staleTime: 60 * 1000, // 1 min
    ...options,
  });
}

/**
 * Fetch past bookings (paginated).
 * GET /api/v1/bookings/past?page=N&size=N
 */
export function usePastBookings(
  params?: { page?: number; size?: number },
  options?: Omit<UseQueryOptions<BookingListResponse, ApiError>, 'queryKey' | 'queryFn'>,
) {
  const page = params?.page ?? 0;
  const size = params?.size ?? 10;
  return useQuery<BookingListResponse, ApiError>({
    queryKey: queryKeys.pastBookings(page, size),
    queryFn: () => bookingService.getPast({ page, size }),
    staleTime: 60 * 1000,
    ...options,
  });
}

// ─── Review Hooks ────────────────────────────────────────────────────────

/** Fetch all reviews for a doctor */
export function useReviews(
  doctorId: number | string,
  options?: Omit<UseQueryOptions<ReviewItem[], ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ReviewItem[], ApiError>({
    queryKey: queryKeys.reviews(doctorId),
    queryFn: () => reviewService.getByDoctorId(doctorId),
    enabled: !!doctorId,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

/** Submit a review (mutation) */
export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation<SubmitReviewResponse, ApiError, SubmitReviewRequest>({
    mutationFn: (data) => reviewService.submit(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews(variables.doctorId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctorReviews(variables.doctorId) });
    },
  });
}

// ─── Token Tracker Hooks ─────────────────────────────────────────────────

/** Fetch live queue state for a doctor (polls every 10s) */
export function useLiveQueue(
  doctorId: number | string,
  options?: Omit<UseQueryOptions<LiveQueueState, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<LiveQueueState, ApiError>({
    queryKey: queryKeys.liveQueue(doctorId),
    queryFn: () => tokenService.getLiveQueue(doctorId),
    enabled: !!doctorId,
    refetchInterval: 10_000, // Poll every 10 seconds
    staleTime: 5_000,
    ...options,
  });
}

/** Fetch my token position for a booking */
export function useMyToken(
  bookingId: number | string,
  options?: Omit<UseQueryOptions<MyTokenPosition, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<MyTokenPosition, ApiError>({
    queryKey: queryKeys.myToken(bookingId),
    queryFn: () => tokenService.getMyToken(bookingId),
    enabled: !!bookingId,
    refetchInterval: 10_000,
    staleTime: 5_000,
    ...options,
  });
}

// ─── Search Hooks ────────────────────────────────────────────────────────

/** Unified name-based search across doctors + hospitals */
export function useUnifiedSearch(
  params: UnifiedSearchParams | null,
  options?: Omit<UseQueryOptions<UnifiedSearchResult, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<UnifiedSearchResult, ApiError>({
    queryKey: params ? queryKeys.search(params.query) : ['search'],
    queryFn: () => searchService.search(params!),
    enabled: !!params && params.query.length >= 2,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

// ─── Onboarding Status Hooks (used by Profile screen) ────────────────────

export function useDoctorOnboardingStatus(
  options?: Omit<UseQueryOptions<DoctorOnboardingStatusSummary, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<DoctorOnboardingStatusSummary, ApiError>({
    queryKey: queryKeys.doctorOnboardingStatus,
    queryFn: () => onboardingService.getDoctorOnboardingStatus(),
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useHospitalOnboardingStatus(
  options?: Omit<UseQueryOptions<HospitalOnboardingStatusSummary, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<HospitalOnboardingStatusSummary, ApiError>({
    queryKey: queryKeys.hospitalOnboardingStatus,
    queryFn: () => onboardingService.getHospitalOnboardingStatus(),
    staleTime: 30 * 1000,
    ...options,
  });
}

// ─── Dashboard Hooks ─────────────────────────────────────────────────────

export function useDoctorDashboard(
  options?: Omit<UseQueryOptions<DoctorDashboard, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<DoctorDashboard, ApiError>({
    queryKey: queryKeys.doctorDashboard,
    queryFn: () => dashboardService.getDoctorDashboard(),
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useDoctorAppointments(date: string) {
  return useQuery<DoctorDateAppointments, ApiError>({
    queryKey: ['doctorAppointments', date],
    queryFn: () => dashboardService.getAppointmentsForDate(date),
    staleTime: 30 * 1000,
    enabled: !!date,
  });
}

export function useHospitalManagerDashboard(
  options?: Omit<UseQueryOptions<HospitalManagerDashboard, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<HospitalManagerDashboard, ApiError>({
    queryKey: queryKeys.hospitalManagerDashboard,
    queryFn: () => dashboardService.getHospitalManagerDashboard(),
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useAdminDashboard(
  options?: Omit<UseQueryOptions<AdminDashboard, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<AdminDashboard, ApiError>({
    queryKey: queryKeys.adminDashboard,
    queryFn: () => dashboardService.getAdminDashboard(),
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useAdminPending(
  options?: Omit<UseQueryOptions<PendingOnboarding, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<PendingOnboarding, ApiError>({
    queryKey: queryKeys.adminPending,
    queryFn: () => dashboardService.getAdminPending(),
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useAdminDoctors(
  options?: Omit<UseQueryOptions<AdminDoctorSummary[], ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<AdminDoctorSummary[], ApiError>({
    queryKey: queryKeys.adminDoctors,
    queryFn: () => dashboardService.listAllDoctors(),
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useAdminHospitals(
  options?: Omit<UseQueryOptions<AdminHospitalSummary[], ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<AdminHospitalSummary[], ApiError>({
    queryKey: queryKeys.adminHospitals,
    queryFn: () => dashboardService.listAllHospitals(),
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useApproveDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (doctorId: string) => dashboardService.approveDoctor(doctorId),
    onMutate: (doctorId) => {
      queryClient.setQueryData(queryKeys.adminPending, (old: PendingOnboarding | undefined) => {
        if (!old) return old;
        return { ...old, pendingDoctors: old.pendingDoctors.filter((d) => d.id !== doctorId) };
      });
      queryClient.setQueryData(queryKeys.adminDashboard, (old: AdminDashboard | undefined) => {
        if (!old) return old;
        return {
          ...old,
          recentDoctors: old.recentDoctors.map((d) =>
            d.doctorId === doctorId ? { ...d, approvalStatus: 'APPROVED', isActive: true } : d,
          ),
          pendingApprovals: {
            ...old.pendingApprovals,
            doctors: Math.max(0, old.pendingApprovals.doctors - 1),
          },
        };
      });
      queryClient.setQueryData(queryKeys.adminDoctors, (old: AdminDoctorSummary[] | undefined) => {
        if (!old) return old;
        return old.map((d) =>
          d.doctorId === doctorId ? { ...d, approvalStatus: 'APPROVED', isActive: true } : d,
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPending });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDoctors });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPending });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDoctors });
    },
  });
}

export function useRejectDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ doctorId, reason }: { doctorId: string; reason: string }) =>
      dashboardService.rejectDoctor(doctorId, reason),
    onMutate: ({ doctorId, reason }) => {
      queryClient.setQueryData(queryKeys.adminPending, (old: PendingOnboarding | undefined) => {
        if (!old) return old;
        return { ...old, pendingDoctors: old.pendingDoctors.filter((d) => d.id !== doctorId) };
      });
      queryClient.setQueryData(queryKeys.adminDashboard, (old: AdminDashboard | undefined) => {
        if (!old) return old;
        return {
          ...old,
          recentDoctors: old.recentDoctors.map((d) =>
            d.doctorId === doctorId
              ? { ...d, approvalStatus: 'REJECTED', isActive: false }
              : d,
          ),
          pendingApprovals: {
            ...old.pendingApprovals,
            doctors: Math.max(0, old.pendingApprovals.doctors - 1),
          },
        };
      });
      queryClient.setQueryData(queryKeys.adminDoctors, (old: AdminDoctorSummary[] | undefined) => {
        if (!old) return old;
        return old.map((d) =>
          d.doctorId === doctorId ? { ...d, approvalStatus: 'REJECTED', isActive: false } : d,
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPending });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDoctors });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPending });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDoctors });
    },
  });
}

export function useApproveHospital() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hospitalId: string) => dashboardService.approveHospital(hospitalId),
    onMutate: (hospitalId) => {
      queryClient.setQueryData(queryKeys.adminPending, (old: PendingOnboarding | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pendingHospitals: old.pendingHospitals.filter((h) => h.id !== hospitalId),
        };
      });
      queryClient.setQueryData(queryKeys.adminDashboard, (old: AdminDashboard | undefined) => {
        if (!old) return old;
        return {
          ...old,
          recentHospitals: old.recentHospitals.map((h) =>
            h.hospitalId === hospitalId
              ? { ...h, approvalStatus: 'APPROVED', isActive: true, isVerified: true }
              : h,
          ),
          pendingApprovals: {
            ...old.pendingApprovals,
            hospitals: Math.max(0, old.pendingApprovals.hospitals - 1),
          },
        };
      });
      queryClient.setQueryData(
        queryKeys.adminHospitals,
        (old: AdminHospitalSummary[] | undefined) => {
          if (!old) return old;
          return old.map((h) =>
            h.hospitalId === hospitalId
              ? { ...h, approvalStatus: 'APPROVED', isActive: true, isVerified: true }
              : h,
          );
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPending });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminHospitals });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPending });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminHospitals });
    },
  });
}

export function useRejectHospital() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ hospitalId, reason }: { hospitalId: string; reason: string }) =>
      dashboardService.rejectHospital(hospitalId, reason),
    onMutate: ({ hospitalId }) => {
      queryClient.setQueryData(queryKeys.adminPending, (old: PendingOnboarding | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pendingHospitals: old.pendingHospitals.filter((h) => h.id !== hospitalId),
        };
      });
      queryClient.setQueryData(queryKeys.adminDashboard, (old: AdminDashboard | undefined) => {
        if (!old) return old;
        return {
          ...old,
          recentHospitals: old.recentHospitals.map((h) =>
            h.hospitalId === hospitalId
              ? { ...h, approvalStatus: 'REJECTED', isActive: false }
              : h,
          ),
          pendingApprovals: {
            ...old.pendingApprovals,
            hospitals: Math.max(0, old.pendingApprovals.hospitals - 1),
          },
        };
      });
      queryClient.setQueryData(
        queryKeys.adminHospitals,
        (old: AdminHospitalSummary[] | undefined) => {
          if (!old) return old;
          return old.map((h) =>
            h.hospitalId === hospitalId
              ? { ...h, approvalStatus: 'REJECTED', isActive: false }
              : h,
          );
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPending });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminHospitals });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPending });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminHospitals });
    },
  });
}

export function useToggleDoctorStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      doctorId,
      isActive,
      reason,
    }: {
      doctorId: string;
      isActive: boolean;
      reason?: string;
    }) => dashboardService.toggleDoctorStatus(doctorId, isActive, reason),
    onMutate: ({ doctorId, isActive }) => {
      queryClient.setQueryData(queryKeys.adminDoctors, (old: AdminDoctorSummary[] | undefined) => {
        if (!old) return old;
        return old.map((d) => (d.doctorId === doctorId ? { ...d, isActive } : d));
      });
      queryClient.setQueryData(queryKeys.adminDashboard, (old: AdminDashboard | undefined) => {
        if (!old) return old;
        return {
          ...old,
          recentDoctors: old.recentDoctors.map((d) =>
            d.doctorId === doctorId ? { ...d, isActive } : d,
          ),
          platformStats: {
            ...old.platformStats,
            activeDoctors: isActive
              ? old.platformStats.activeDoctors + 1
              : Math.max(0, old.platformStats.activeDoctors - 1),
          },
        };
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDoctors });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDoctors });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
    },
  });
}

export function useToggleHospitalStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      hospitalId,
      isActive,
      reason,
    }: {
      hospitalId: string;
      isActive: boolean;
      reason?: string;
    }) => dashboardService.toggleHospitalStatus(hospitalId, isActive, reason),
    onMutate: ({ hospitalId, isActive }) => {
      queryClient.setQueryData(
        queryKeys.adminHospitals,
        (old: AdminHospitalSummary[] | undefined) => {
          if (!old) return old;
          return old.map((h) => (h.hospitalId === hospitalId ? { ...h, isActive } : h));
        },
      );
      queryClient.setQueryData(queryKeys.adminDashboard, (old: AdminDashboard | undefined) => {
        if (!old) return old;
        return {
          ...old,
          recentHospitals: old.recentHospitals.map((h) =>
            h.hospitalId === hospitalId ? { ...h, isActive } : h,
          ),
          platformStats: {
            ...old.platformStats,
            activeHospitals: isActive
              ? old.platformStats.activeHospitals + 1
              : Math.max(0, old.platformStats.activeHospitals - 1),
          },
        };
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminHospitals });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminHospitals });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
    },
  });
}
