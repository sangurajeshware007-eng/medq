/**
 * Services barrel export
 * Import all services from one place.
 */
export { default as api, TokenManager } from './api';
export type { ApiError, ApiClient } from './api';

export { default as authService, AuthError } from './authService';
export type {
  SignupRequest,
  LoginRequest,
  AuthUser,
  AuthResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  UserProfile,
  UpdateProfileRequest,
} from './authService';

export { default as hospitalService } from './hospitalService';
export type {
  HospitalListItem,
  HospitalDetail,
  HospitalDoctor,
  NearbyParams,
  HospitalFilterParams,
} from './hospitalService';

export { default as doctorService } from './doctorService';
export type {
  DoctorListItem,
  DoctorDetail,
  DoctorHospital,
  DoctorFilterParams,
  DoctorReview,
  AvailableSlotsResponse,
  DiseaseSearchResult,
} from './doctorService';
export type { TimeSlot, Session } from './doctorService';

export { default as bookingService } from './bookingService';
export type {
  CreateBookingRequest,
  CreateBookingResponse,
  BookingDetail,
  BookingResponseItem,
  BookingDoctor,
  BookingUser,
  BookingListParams,
  RescheduleRequest,
  BookingListItem,
  BookingListResponse,
  PaginationMeta,
} from './bookingService';

export { default as reviewService } from './reviewService';
export type {
  SubmitReviewRequest,
  UpdateReviewRequest,
  ReviewItem,
  PagedReviews,
} from './reviewService';

export { default as tokenService } from './tokenService';
export type { LiveQueueState, MyTokenPosition } from './tokenService';

export { default as searchService, translationService } from './searchService';
export type {
  UnifiedSearchResult,
  UnifiedSearchParams,
  DiseaseItem,
  SpecializationCategory,
  TranslationMap,
} from './searchService';

export { default as onboardingService } from './onboardingService';
export type {
  OnboardingStatus,
  DoctorProfilePayload,
  DoctorDetailsPayload,
  DoctorHospitalsPayload,
  HospitalProfilePayload,
  HospitalDocumentsPayload,
  SubmitResponse,
} from './onboardingService';

export { default as dashboardService } from './dashboardService';
export type {
  DoctorDashboard,
  HospitalManagerDashboard,
  AdminDashboard,
  PendingOnboarding,
  AdminDoctorSummary,
  AdminHospitalSummary,
  LinkedDoctor,
  DayRevenue,
  RevenueStats,
  TodayStats,
  HospitalStats,
  PlatformStats,
} from './dashboardService';

export { default as doctorQueueService } from './doctorQueueService';
export type { DoctorQueueState, QueueEntry, QueueSessionStatus } from './doctorQueueService';

export { default as doctorPatientService } from './doctorPatientService';
export type { DoctorPatientSummary, PatientVisit, Paged } from './doctorPatientService';
