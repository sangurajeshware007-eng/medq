/**
 * Onboarding API Service
 *
 * Doctor Onboarding:
 *   POST /api/v1/onboarding/doctor/profile    → Step 1+2 (Profile & Consultation)
 *   POST /api/v1/onboarding/doctor/details    → Step 3+4 (Qualifications, Services)
 *   POST /api/v1/onboarding/doctor/hospitals  → Step 5 (Link Hospitals & Availability)
 *   POST /api/v1/onboarding/doctor/submit     → Final submission
 *   GET  /api/v1/onboarding/doctor/status     → Status polling
 *
 * Hospital Onboarding:
 *   POST /api/v1/onboarding/hospital/profile   → Step 1 (Hospital details)
 *   POST /api/v1/onboarding/hospital/documents → Step 2 (Documents upload)
 *   POST /api/v1/onboarding/hospital/submit    → Final submission
 *   GET  /api/v1/onboarding/hospital/status    → Status polling
 */
import api from './api';

const DOCTOR_BASE = '/api/v1/onboarding/doctor';
const HOSPITAL_BASE = '/api/v1/onboarding/hospital';

// ─── Types ───────────────────────────────────────────────────────────────

export type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface OnboardingStatusResponse {
  status: OnboardingStatus;
  currentStep: number;
  totalSteps: number;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface DoctorProfilePayload {
  specialization: string;
  gender: string;
  dateOfBirth?: string;
  consultationFee: number;
  teleConsultation: boolean;
  teleConsultationFee?: number;
  clinicAddress?: string;
  bio?: string;
  languages: string[];
  registrationNumber: string;
  practiceStartedYear?: number;
  avatarUrl?: string;
}

export interface QualificationPayload {
  degree: string;
  institution: string;
  year: number;
}

export interface AwardPayload {
  title: string;
  awardedBy: string;
  year: number;
}

export interface DoctorDetailsPayload {
  qualifications: QualificationPayload[];
  services: string[];
  conditions: string[];
  awards?: AwardPayload[];
}

export interface AvailabilityEntryPayload {
  dayOfWeek: number;  // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  sessionName: string;
  sessionType: string;
  startTime: string;   // "09:00"
  endTime: string;     // "13:00"
  slotDurationMinutes: number;
  maxPatientsPerSlot: number;
}

export interface LinkedHospitalPayload {
  hospitalId: string;
  consultationFee: number;
  roomNumber?: string;
  isPrimary: boolean;
  availability: AvailabilityEntryPayload[];
}

export interface DoctorHospitalsPayload {
  hospitals: LinkedHospitalPayload[];
}

/** Structured address — matches backend AddressDto 1:1. */
export interface AddressPayload {
  addressLine1: string;
  addressLine2?: string;
  pincode: string;   // 6 digits
  city: string;
  district?: string;
  state: string;
  country: string;   // "India"
}

export interface HospitalProfilePayload {
  name: string;
  address: AddressPayload;
  /** GPS coords of the map pin (separate concept from postal address). */
  locationLat?: number;
  locationLng?: number;
  phone: string;
  emergencyContact?: string;
  departments: string[];
  establishedYear?: number;
  totalBeds?: number;
  is24x7: boolean;
  website?: string;
  imageUrl?: string;
}

/** GET /api/v1/pincode/{pincode} — 404 means "unknown, fall back to manual entry". */
export interface PincodeLookupResult {
  pincode: string;
  area: string | null;
  city: string;
  district: string | null;
  state: string;
  country: string;
}

export interface HospitalDocumentsPayload {
  registrationNumber: string;
  documents: Array<{
    documentType: string;
    documentUrl: string;
    fileName: string;
  }>;
}

export interface SubmitResponse {
  message: string;
  status: OnboardingStatus;
}

// ─── GET Response Types (for hydrating previously saved data) ─────────────

/** Maps backend approvalStatus values to our OnboardingStatus */
export type ApprovalStatus = 'NOT_STARTED' | 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

/** Lightweight status summary — matches DoctorOnboardingStatusResponse from backend */
export interface DoctorOnboardingStatusSummary {
  doctorId: string | null;
  approvalStatus: ApprovalStatus;
  rejectionReason: string | null;
  profileStrength: number;
  isActive: boolean;
  isVerified: boolean;
}

/** Lightweight status summary — matches HospitalOnboardingStatusResponse from backend */
export interface HospitalOnboardingStatusSummary {
  hospitalId: string | null;
  approvalStatus: ApprovalStatus;
  rejectionReason: string | null;
  isActive: boolean;
  isVerified: boolean;
}

export interface DoctorOnboardingResponse {
  doctorId: string | null;
  approvalStatus: ApprovalStatus;
  profileStrength: number;
  rejectionReason: string | null;
  profile: {
    specialization: string;
    gender: string;
    dateOfBirth?: string;
    consultationFee: number;
    teleConsultation: boolean;
    teleConsultationFee?: number;
    clinicAddress?: string;
    bio?: string;
    languagesSpoken: string[];
    registrationNumber: string;
    practiceStartedYear?: number;
    avatarUrl?: string;
  } | null;
  details: {
    qualifications: { degree: string; institution: string; year: number }[];
    services: string[];
    conditions: string[];
    awards: { title: string; awardedBy: string; year: number }[];
  } | null;
  hospitals: {
    hospitalId: string;
    hospitalName: string;
    address: string;
    consultationFee: number;
    roomNumber?: string;
    isPrimary: boolean;
    availability: {
      dayOfWeek: number;
      sessionName: string;
      sessionType: string;
      startTime: string;
      endTime: string;
      slotDurationMinutes: number;
      maxPatientsPerSlot: number;
    }[];
  }[];
}

export interface HospitalOnboardingData {
  profile: {
    name: string;
    address: string;
    locationLat?: number;
    locationLng?: number;
    phone: string;
    emergencyContact?: string;
    departments: string[];
    establishedYear?: number;
    totalBeds?: number;
    is24x7: boolean;
    website?: string;
    imageUrl?: string;
  } | null;
  documents: {
    registrationNumber: string;
    documents: {
      documentType: string;
      documentUrl: string;
      fileName: string;
    }[];
  } | null;
}

// ─── Service ─────────────────────────────────────────────────────────────

const onboardingService = {
  // ── Doctor Onboarding ──────────────────────────────────────────────

  /** Save doctor profile & consultation info (Step 1) */
  saveDoctorProfile: (data: DoctorProfilePayload) =>
    api.post<{ message: string }>(`${DOCTOR_BASE}/profile`, data),

  /** Save qualifications, services, conditions, awards (Step 2) */
  saveDoctorDetails: (data: DoctorDetailsPayload) =>
    api.post<{ message: string }>(`${DOCTOR_BASE}/details`, data),

  /** Save linked hospitals & availability (Step 3) */
  saveDoctorHospitals: (data: DoctorHospitalsPayload) =>
    api.post<{ message: string }>(`${DOCTOR_BASE}/hospitals`, data),

  /** Submit doctor onboarding for review (Step 4) */
  submitDoctorOnboarding: () =>
    api.post<SubmitResponse>(`${DOCTOR_BASE}/submit`),

  /** Poll doctor onboarding status */
  getDoctorStatus: () =>
    api.get<OnboardingStatusResponse>(`${DOCTOR_BASE}/status`),

  /** Fetch all saved doctor onboarding data (for hydrating the form on return) */
  getDoctorOnboarding: () =>
    api.get<DoctorOnboardingResponse>(`${DOCTOR_BASE}/profile`),

  // ── Hospital Onboarding ────────────────────────────────────────────

  /** Save hospital profile details (Step 1) */
  saveHospitalProfile: (data: HospitalProfilePayload) =>
    api.post<{ message: string }>(`${HOSPITAL_BASE}/profile`, data),

  /** Save hospital documents (Step 2) */
  saveHospitalDocuments: (data: HospitalDocumentsPayload) =>
    api.post<{ message: string }>(`${HOSPITAL_BASE}/documents`, data),

  /** Submit hospital onboarding for review (Step 3) */
  submitHospitalOnboarding: () =>
    api.post<SubmitResponse>(`${HOSPITAL_BASE}/submit`),

  /** Poll hospital onboarding status */
  getHospitalStatus: () =>
    api.get<OnboardingStatusResponse>(`${HOSPITAL_BASE}/status`),

  /** Fetch all saved hospital onboarding data (for hydrating the form on return) */
  getHospitalData: () =>
    api.get<HospitalOnboardingData>(`${HOSPITAL_BASE}/data`),

  // ── Lightweight status summaries (used by Profile screen) ─────────────

  /** Doctor onboarding status — used on Profile screen to show context-aware CTA */
  getDoctorOnboardingStatus: () =>
    api.get<DoctorOnboardingStatusSummary>(`${DOCTOR_BASE}/status`),

  /** Hospital onboarding status — used on Profile screen to show context-aware CTA */
  getHospitalOnboardingStatus: () =>
    api.get<HospitalOnboardingStatusSummary>(`${HOSPITAL_BASE}/status`),

  // ── Pincode lookup (public — no auth) ──────────────────────────────────

  /**
   * Look up city / state / district from an Indian 6-digit pincode.
   * Throws (404) when the pincode isn't in the master table — callers
   * should catch and fall back to manual entry.
   */
  lookupPincode: (pincode: string) =>
    api.get<PincodeLookupResult>(`/api/v1/pincode/${pincode}`),
};

export default onboardingService;

