/**
 * React Query hooks for all API endpoints.
 * Provides loading states, error handling, and caching out of the box.
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  type UseQueryOptions,
} from '@tanstack/react-query';

import { useLanguage } from '../context/LanguageContext';
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
  UpdateReviewRequest,
  ReviewItem,
  PagedReviews,
  LiveQueueState,
  MyTokenPosition,
  UnifiedSearchResult,
  UnifiedSearchParams,
  NearbyParams,
  ApiError,
} from '../services';
import authService from '../services/authService';
import cityImageService, { type CityImage } from '../services/cityImageService';
import dashboardService from '../services/dashboardService';
import type {
  AppointmentSummary,
  DoctorDashboard,
  DoctorDateAppointments,
  HospitalManagerDashboard,
  AdminDashboard,
  PendingOnboarding,
  AdminDoctorSummary,
  AdminHospitalSummary,
} from '../services/dashboardService';
import doctorPatientService from '../services/doctorPatientService';
import type { DoctorPatientSummary, PatientVisit, Paged } from '../services/doctorPatientService';
import doctorQueueService from '../services/doctorQueueService';
import type { DoctorQueueState } from '../services/doctorQueueService';
import onboardingService from '../services/onboardingService';
import type {
  DoctorOnboardingStatusSummary,
  HospitalOnboardingStatusSummary,
} from '../services/onboardingService';
import timeOffService, {
  type TimeOffEntry,
  type CreateTimeOffRequest,
} from '../services/timeOffService';

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
  doctorSlots: (id: number | string, date: string, hospitalId?: string) =>
    ['doctor', id, 'slots', date, hospitalId ?? null] as const,
  doctorReviews: (id: number | string) => ['doctor', id, 'reviews'] as const,
  bookings: (params?: BookingListParams) => ['bookings', params] as const,
  booking: (id: number | string) => ['booking', id] as const,
  upcomingBookings: (page: number, size: number) => ['bookings', 'upcoming', page, size] as const,
  pastBookings: (page: number, size: number) => ['bookings', 'past', page, size] as const,
  reviews: (doctorId: number | string) => ['reviews', doctorId] as const,
  reviewsPage: (doctorId: number | string, page: number, size: number) =>
    ['reviews', doctorId, 'page', page, size] as const,
  myReviewForBooking: (bookingId: number | string) => ['reviews', 'by-booking', bookingId] as const,
  liveQueue: (doctorId: number | string) => ['tokens', 'live', doctorId] as const,
  myToken: (bookingId: number | string) => ['tokens', 'my', bookingId] as const,
  search: (query: string) => ['search', query] as const,
  doctorOnboardingStatus: ['doctor', 'onboarding-status'] as const,
  hospitalOnboardingStatus: ['hospital', 'onboarding-status'] as const,
  doctorDashboard: ['doctor', 'dashboard'] as const,
  doctorQueue: ['doctor', 'queue'] as const,
  doctorPatients: (page: number, search: string) => ['doctor', 'patients', page, search] as const,
  doctorPatientHistory: (patientUserId: string, page: number) =>
    ['doctor', 'patients', patientUserId, 'history', page] as const,
  hospitalManagerDashboard: ['hospital-manager', 'dashboard'] as const,
  adminDashboard: ['admin', 'dashboard'] as const,
  adminPending: ['admin', 'pending'] as const,
  adminDoctors: ['admin', 'doctors'] as const,
  adminHospitals: ['admin', 'hospitals'] as const,
  cityImage: (city: string, state?: string) =>
    ['city-image', city.toLowerCase(), state?.toLowerCase() ?? null] as const,
  cityImagesNearby: (lat: number, lng: number) =>
    ['city-images', 'nearby', lat.toFixed(3), lng.toFixed(3)] as const,
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

/** Fetch available time slots for a doctor on a specific date (optionally at a specific hospital) */
export function useDoctorSlots(
  id: number | string,
  date: string,
  hospitalId?: string,
  options?: Omit<UseQueryOptions<AvailableSlotsResponse, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<AvailableSlotsResponse, ApiError>({
    queryKey: queryKeys.doctorSlots(id, date, hospitalId),
    queryFn: () => doctorService.getAvailableSlots(id, date, hospitalId),
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

/** Paginated reviews for a doctor */
export function useDoctorReviewsPaged(
  doctorId: number | string,
  params?: { page?: number; size?: number },
  options?: Omit<UseQueryOptions<PagedReviews, ApiError>, 'queryKey' | 'queryFn'>,
) {
  const page = params?.page ?? 0;
  const size = params?.size ?? 10;
  return useQuery<PagedReviews, ApiError>({
    queryKey: queryKeys.reviewsPage(doctorId, page, size),
    queryFn: () => reviewService.getByDoctorId(doctorId, { page, size }),
    enabled: !!doctorId,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

/** Convenience: first page only, returns the review list directly. */
export function useReviews(
  doctorId: number | string,
  options?: Omit<UseQueryOptions<ReviewItem[], ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ReviewItem[], ApiError>({
    queryKey: queryKeys.reviews(doctorId),
    queryFn: () =>
      reviewService.getByDoctorId(doctorId, { page: 0, size: 10 }).then((p) => p.content),
    enabled: !!doctorId,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

/** Fetch the caller's review for a booking (null if not yet rated). */
export function useMyReviewForBooking(
  bookingId: number | string | undefined | null,
  options?: Omit<UseQueryOptions<ReviewItem | null, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ReviewItem | null, ApiError>({
    queryKey: queryKeys.myReviewForBooking(bookingId ?? ''),
    queryFn: () => reviewService.getMyReviewForBooking(String(bookingId)),
    enabled: !!bookingId,
    staleTime: 60 * 1000,
    ...options,
  });
}

/** Submit a new review for a completed booking. */
export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation<ReviewItem, ApiError, SubmitReviewRequest>({
    mutationFn: (data) => reviewService.submit(data),
    onSuccess: (review) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctorReviews(review.doctorId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctor(review.doctorId) });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.booking(review.bookingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myReviewForBooking(review.bookingId) });
    },
  });
}

/** Edit an existing review within the 7-day window. */
export function useUpdateReview() {
  const queryClient = useQueryClient();
  return useMutation<ReviewItem, ApiError, { reviewId: string; data: UpdateReviewRequest }>({
    mutationFn: ({ reviewId, data }) => reviewService.update(reviewId, data),
    onSuccess: (review) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctorReviews(review.doctorId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctor(review.doctorId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myReviewForBooking(review.bookingId) });
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

/** Unified name-based search across doctors + hospitals.
 * Auto-injects the current UI language into `params.lang` so server-side
 * localization (when available) flows through without callers thinking about it.
 * Caller-supplied `lang` always wins. */
export function useUnifiedSearch(
  params: UnifiedSearchParams | null,
  options?: Omit<UseQueryOptions<UnifiedSearchResult, ApiError>, 'queryKey' | 'queryFn'>,
) {
  const { language } = useLanguage();
  const merged = params ? { lang: language, ...params } : null;
  return useQuery<UnifiedSearchResult, ApiError>({
    queryKey: merged ? [...queryKeys.search(merged.query), merged.lang] : ['search'],
    queryFn: () => searchService.search(merged!),
    enabled: !!merged && merged.query.length >= 2,
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
  options?: Omit<
    UseQueryOptions<HospitalOnboardingStatusSummary, ApiError>,
    'queryKey' | 'queryFn'
  >,
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

/**
 * Doctor flips one of their CONFIRMED bookings to COMPLETED or NO_SHOW.
 * Invalidates the dashboard (revenue) and the date's appointments list so
 * the UI updates straight after a successful mutation.
 */
export function useMarkAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation<
    AppointmentSummary,
    ApiError,
    { bookingId: string; status: 'COMPLETED' | 'NO_SHOW' }
  >({
    mutationFn: ({ bookingId, status }) =>
      dashboardService.markAppointmentStatus(bookingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctorDashboard });
      queryClient.invalidateQueries({ queryKey: ['doctorAppointments'] });
    },
  });
}

// ─── Doctor Live Queue Hooks ─────────────────────────────────────────────

export type QueueAction =
  | { action: 'start' }
  | { action: 'end' }
  | { action: 'next' }
  | { action: 'skip' }
  | { action: 'recall'; bookingId: string };

/** Doctor's own live queue — polls every 10s so reception check-ins show up. */
export function useDoctorQueue(
  options?: Omit<UseQueryOptions<DoctorQueueState, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<DoctorQueueState, ApiError>({
    queryKey: queryKeys.doctorQueue,
    queryFn: () => doctorQueueService.getQueue(),
    refetchInterval: 10_000,
    staleTime: 5_000,
    ...options,
  });
}

/**
 * One mutation hook for every queue action. The backend returns the full new
 * queue state, so we write it straight into the cache (setQueryData) instead
 * of optimistic guessing — the queue is contended state (reception check-ins
 * land concurrently) and the next token isn't client-predictable.
 */
export function useQueueAction() {
  const queryClient = useQueryClient();
  return useMutation<DoctorQueueState, ApiError, QueueAction>({
    mutationFn: (input) => {
      switch (input.action) {
        case 'start':
          return doctorQueueService.start();
        case 'end':
          return doctorQueueService.end();
        case 'next':
          return doctorQueueService.next();
        case 'skip':
          return doctorQueueService.skip();
        case 'recall':
          return doctorQueueService.recall(input.bookingId);
      }
    },
    onSuccess: (state) => {
      queryClient.setQueryData(queryKeys.doctorQueue, state);
      // Call Next auto-completes bookings → revenue and appointment lists move.
      queryClient.invalidateQueries({ queryKey: queryKeys.doctorDashboard });
      queryClient.invalidateQueries({ queryKey: ['doctorAppointments'] });
    },
  });
}

// ─── Doctor "My Patients" Hooks ──────────────────────────────────────────

export function useDoctorPatients(page: number, search: string) {
  return useQuery<Paged<DoctorPatientSummary>, ApiError>({
    queryKey: queryKeys.doctorPatients(page, search),
    queryFn: () => doctorPatientService.list({ page, size: 20, search: search || undefined }),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}

export function useDoctorPatientHistory(patientUserId: string, page = 0) {
  return useQuery<Paged<PatientVisit>, ApiError>({
    queryKey: queryKeys.doctorPatientHistory(patientUserId, page),
    queryFn: () => doctorPatientService.history(patientUserId, { page, size: 20 }),
    enabled: !!patientUserId,
    staleTime: 60 * 1000,
  });
}

// ─── Accepting-Bookings Toggle ───────────────────────────────────────────

/**
 * Optimistic boolean flip with rollback — unlike queue mutations this is
 * trivially predictable, so the switch should move instantly.
 */
export function useToggleAcceptingBookings() {
  const queryClient = useQueryClient();
  return useMutation<{ accepting: boolean }, ApiError, boolean, { prev?: DoctorDashboard }>({
    mutationFn: (accepting) => doctorService.updateAcceptingBookings(accepting),
    onMutate: async (accepting) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.doctorDashboard });
      const prev = queryClient.getQueryData<DoctorDashboard>(queryKeys.doctorDashboard);
      if (prev) {
        queryClient.setQueryData<DoctorDashboard>(queryKeys.doctorDashboard, {
          ...prev,
          acceptingBookings: accepting,
        });
      }
      return { prev };
    },
    onError: (_err, _accepting, context) => {
      if (context?.prev) {
        queryClient.setQueryData(queryKeys.doctorDashboard, context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctorDashboard });
    },
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
            d.doctorId === doctorId ? { ...d, approvalStatus: 'REJECTED', isActive: false } : d,
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
            h.hospitalId === hospitalId ? { ...h, approvalStatus: 'REJECTED', isActive: false } : h,
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
            h.hospitalId === hospitalId ? { ...h, approvalStatus: 'REJECTED', isActive: false } : h,
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

// ─── City Image (welcome-hero background) ─────────────────────────────────

/**
 * Fetch the landmark image for a city by name. Returns null when none is
 * configured. Long staleTime (10 min) because city landmarks rarely change.
 */
export function useCityImage(city?: string, state?: string) {
  return useQuery<CityImage | null, ApiError>({
    queryKey: queryKeys.cityImage(city ?? '', state),
    queryFn: () => cityImageService.getByCity(city!, state),
    enabled: !!city && city.trim().length > 0,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Fetch all images whose coverage area contains the given coordinates.
 * Sorted by distance ascending — clients render the first one as the
 * welcome-hero background. Multiple results = overlapping coverage areas.
 */
export function useNearbyCityImages(lat?: number, lng?: number) {
  return useQuery<CityImage[], ApiError>({
    queryKey: queryKeys.cityImagesNearby(lat ?? 0, lng ?? 0),
    queryFn: () => cityImageService.getNearby(lat!, lng!),
    enabled: Number.isFinite(lat) && Number.isFinite(lng),
    staleTime: 10 * 60 * 1000,
  });
}

// ─── Self-service account lifecycle ─────────────────────────────────────────

/**
 * Deactivate the current user's account (reversible).
 * Server cancels upcoming bookings and revokes all refresh tokens. Caller is
 * responsible for clearing local auth state and navigating to the login screen.
 *
 * We intentionally do NOT call queryClient.clear() in onSuccess — that triggers
 * refetches on still-mounted screens (e.g. doctor onboarding status on the
 * Profile tab), and those refetches race the local logout() that clears tokens,
 * producing harmless-but-noisy 403s. The existing logout() flow doesn't clear
 * the cache either; we follow the same pattern.
 */
export function useDeactivateProfile() {
  return useMutation<void, ApiError, string | undefined>({
    mutationFn: (reason) => authService.deactivateProfile(reason),
  });
}

/**
 * Permanently delete the current user's account (irreversible).
 * `confirmPhone` must match the user's current phone — server enforces.
 */
export function useDeleteProfile() {
  return useMutation<void, ApiError, { confirmPhone: string; reason?: string }>({
    mutationFn: ({ confirmPhone, reason }) => authService.deleteProfile(confirmPhone, reason),
  });
}

// ─── Doctor time off ────────────────────────────────────────────────────────

export function useTimeOffList() {
  return useQuery<TimeOffEntry[], ApiError>({
    queryKey: ['doctorTimeOff'],
    queryFn: () => timeOffService.list(),
    staleTime: 30 * 1000,
  });
}

export function useCreateTimeOff() {
  const queryClient = useQueryClient();
  return useMutation<TimeOffEntry, ApiError, CreateTimeOffRequest>({
    mutationFn: (data) => timeOffService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctorTimeOff'] });
      // Slot availability + dashboard appointments are now stale.
      queryClient.invalidateQueries({ queryKey: ['doctor'] });
      queryClient.invalidateQueries({ queryKey: ['doctorAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['doctorDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useDeleteTimeOff() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => timeOffService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctorTimeOff'] });
      queryClient.invalidateQueries({ queryKey: ['doctor'] });
    },
  });
}
