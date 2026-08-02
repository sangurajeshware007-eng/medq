/**
 * Doctor API service
 *
 * All endpoints use /api/v1/doctors as the base:
 *   GET  /api/v1/doctors                     → List all doctors (with optional geo-filter)
 *   GET  /api/v1/doctors/{id}                → Doctor detail
 *   GET  /api/v1/doctors/{id}/available-slots → Available time slots
 *   GET  /api/v1/doctors/{id}/reviews         → Doctor reviews
 */
import api from './api';

// ─── Constants ───────────────────────────────────────────────────────────
const BASE = '/api/v1/doctors';
const SELF_BASE = '/api/v1/doctor/profile';

// ─── Types ───────────────────────────────────────────────────────────────

export interface DoctorListItem {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  photo?: string;
  hospitalName: string;
  availability: string;
  consultationFee?: number;
  languages?: string[];
  verified?: boolean;
  diseases?: string[];
  distanceKm?: number;
  /** Comma-separated qualification string e.g. "MBBS, MD (General Medicine)" — shown on list cards in place of rating during phase 1. */
  degree?: string;
  /** Day-of-week values on which the doctor has active availability (0=Sun … 6=Sat) */
  availableDays?: number[];
}

export interface HospitalAssociation {
  hospitalId: string;
  hospitalName: string;
  address: string;
  locationLat: number;
  locationLng: number;
  consultationFee: number;
  isPrimary: boolean;
  availableDays: any[]; // Raw session data from API
}

export interface Qualification {
  degree: string;
  institution: string;
  year: number;
  displayOrder: number;
}

export interface Condition {
  condition: string;
  conditionHi?: string;
  conditionKn?: string;
}

export interface DoctorDetail {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  reviewCount: number;
  totalReviews: number;
  photo?: string;
  avatarUrl?: string;
  education: string[];
  certifications: string[];
  languages: string[];
  about?: string;
  bio?: string;
  fee: number;
  consultationFee: number;
  isTeleAvailable: boolean;
  teleFee: number;
  verified: boolean;
  isVerified: boolean;
  hospital: {
    id: string;
    name: string;
    address: string;
    locationLat?: number;
    locationLng?: number;
  };
  hospitals: HospitalAssociation[];
  availableDays: any[];
  qualifications: Qualification[];
  conditions: Condition[];
  services: string[];
  profileStrength: number;
  diseases?: string[];
  distanceKm?: number;
  clinicAddress?: string;
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  isPast: boolean;
  percentFilled?: number;
  remaining?: number;
}

export interface Session {
  sessionName: string;
  sessionType: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  slots: TimeSlot[];
}

export interface AvailableSlotsResponse {
  date: string;
  doctorId?: string;
  hospitalId?: string;
  sessions: Session[];
}

export interface DoctorReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  user: {
    name: string;
    avatar?: string;
  };
}

export interface DoctorFilterParams {
  lat?: number;
  lng?: number;
  radius_km?: number;
  sort_by?: 'rating' | 'distance' | 'experience' | 'fee';
  min_fee?: number;
  max_fee?: number;
  page?: number;
  size?: number;
}

// ─── Self-edit types (doctor editing their own profile) ──────────────────

export interface SelfQualification {
  id?: string;
  degree: string;
  institution: string;
  year?: number;
  displayOrder?: number;
}

export interface SelfAward {
  id?: string;
  title: string;
  awardedBy?: string;
  year?: number;
}

export interface SelfHospital {
  hospitalId: string;
  hospitalName: string;
  address: string;
  consultationFee: number;
  isPrimary: boolean;
  roomNumber?: string;
}

export interface SelfAvailabilitySlot {
  id?: string;
  dayOfWeek: number;
  sessionName: string;
  sessionType: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  maxPatientsPerSlot: number;
  isAvailable: boolean;
  hospitalId?: string;
  hospitalName?: string;
}

export interface DoctorSelfProfile {
  id: string;
  name: string;
  specialization: string;
  gender?: string;
  dateOfBirth?: string;
  practiceStartedDate?: string;
  registrationNo?: string;
  consultationFee: number;
  isTeleAvailable: boolean;
  teleFee?: number;
  bio?: string;
  clinicAddress?: string;
  languagesSpoken: string[];
  avatarUrl?: string;
  videoUrl?: string;
  profileStrength: number;
  approvalStatus: string;
  /** Doctor-controlled pause for NEW online bookings (independent of admin isActive). */
  acceptingBookings: boolean;
  qualifications: SelfQualification[];
  services: string[];
  conditions: string[];
  awards: SelfAward[];
  hospitals: SelfHospital[];
  availability: SelfAvailabilitySlot[];
}

export interface DoctorSelfProfileUpdatePayload {
  specialization?: string;
  gender?: string;
  dateOfBirth?: string;
  consultationFee?: number;
  isTeleAvailable?: boolean;
  teleFee?: number;
  bio?: string;
  clinicAddress?: string;
  languagesSpoken?: string[];
  avatarUrl?: string;
  videoUrl?: string;
  practiceStartedYear?: number;
}

export interface DoctorSelfDetailsUpdatePayload {
  qualifications?: Array<{ degree: string; institution: string; year?: number }>;
  services?: string[];
  conditions?: string[];
  awards?: Array<{ title: string; awardedBy?: string; year?: number }>;
}

export interface AddHospitalPayload {
  hospitalId: string;
  consultationFee?: number;
  roomNumber?: string;
  isPrimary?: boolean;
}

export interface DoctorSelfAvailabilityUpdatePayload {
  hospitalId?: string;
  slots: Array<{
    dayOfWeek: number;
    sessionName: string;
    sessionType: string;
    startTime: string;
    endTime: string;
    slotDurationMinutes: number;
    maxPatientsPerSlot: number;
    isAvailable: boolean;
    hospitalId?: string;
  }>;
}

// ─── Service Methods ─────────────────────────────────────────────────────

export const doctorService = {
  getAll: async (params?: DoctorFilterParams): Promise<DoctorListItem[]> => {
    const raw = await api.get<any[]>(BASE, { params });
    return raw.map((d) => ({
      id: d.id,
      name: d.name,
      specialization: d.specialization,
      experience: d.experience ?? d.experienceYears ?? 0,
      rating: d.rating,
      photo: d.photo ?? d.photoUrl ?? d.avatarUrl ?? d.image ?? d.imageUrl ?? undefined,
      hospitalName: d.hospitalName,
      availability: d.availability ?? '',
      consultationFee: d.consultationFee,
      languages: d.languages,
      verified: d.verified ?? d.isVerified ?? false,
      diseases: d.diseases,
      distanceKm: d.distanceKm,
      degree: d.degree ?? undefined,
      availableDays: d.availableDays ?? [],
    }));
  },

  getById: async (id: string | number): Promise<DoctorDetail> => {
    const d = await api.get<any>(`${BASE}/${id}`);
    return {
      id: d.id,
      name: d.name,
      specialization: d.specialization,
      experience: d.experienceYears ?? d.experience ?? 0,
      rating: d.rating,
      reviewCount: d.totalReviews ?? d.reviewCount ?? 0,
      totalReviews: d.totalReviews ?? 0,
      photo: d.avatarUrl ?? d.photo ?? d.photoUrl ?? undefined,
      avatarUrl: d.avatarUrl,
      education: d.education ?? [],
      certifications: d.certifications ?? [],
      languages: d.languagesSpoken ?? d.languages ?? [],
      about: d.bio ?? d.about,
      bio: d.bio,
      fee: d.consultationFee ?? d.fee ?? 0,
      consultationFee: d.consultationFee ?? 0,
      isTeleAvailable: d.isTeleAvailable ?? false,
      teleFee: d.teleFee ?? 0,
      verified: d.isVerified ?? d.verified ?? false,
      isVerified: d.isVerified ?? false,
      hospital: d.hospital ?? { id: d.hospitalId, name: d.hospitalName },
      hospitals: d.hospitals ?? [],
      availableDays: d.availableDays ?? [],
      qualifications: d.qualifications ?? [],
      conditions: d.conditions ?? [],
      services: d.services ?? [],
      profileStrength: d.profileStrength ?? 0,
      diseases: d.diseases ?? [],
      distanceKm: d.distanceKm,
      clinicAddress: d.clinicAddress,
    };
  },

  getAvailableSlots: async (
    id: string | number,
    date: string,
    hospitalId?: string,
  ): Promise<AvailableSlotsResponse> => {
    const params: Record<string, string> = { date };
    if (hospitalId) params.hospitalId = hospitalId;
    const raw = await api.get<any>(`${BASE}/${id}/available-slots`, { params });
    return {
      date: raw.date ?? date,
      doctorId: raw.doctorId,
      hospitalId: raw.hospitalId,
      sessions: (raw.sessions ?? []).map((session: any, sIdx: number) => ({
        sessionName: session.sessionName ?? `Session ${sIdx + 1}`,
        sessionType: session.sessionType ?? '',
        startTime: session.startTime ?? '',
        endTime: session.endTime ?? '',
        slotDurationMinutes: session.slotDurationMinutes ?? 15,
        slots: (session.slots ?? []).map((s: any, slotIdx: number) => ({
          id: s.id ? String(s.id) : `s${sIdx}-slot${slotIdx}`,
          time: s.time,
          available: s.available ?? true,
          isPast: s.isPast ?? false,
          percentFilled: s.percentFilled ?? 0,
          remaining: s.remaining ?? 0,
        })),
      })),
    };
  },

  getReviews: (id: string | number): Promise<DoctorReview[]> =>
    api.get<DoctorReview[]>(`${BASE}/${id}/reviews`),

  // ── Self-edit (authenticated doctor only) ────────────────────────────

  getMyProfile: async (): Promise<DoctorSelfProfile> => {
    const d = await api.get<any>(SELF_BASE);
    return mapSelfProfile(d);
  },

  updateMyProfile: async (payload: DoctorSelfProfileUpdatePayload): Promise<DoctorSelfProfile> => {
    const d = await api.put<any>(SELF_BASE, payload);
    return mapSelfProfile(d);
  },

  updateMyDetails: async (payload: DoctorSelfDetailsUpdatePayload): Promise<DoctorSelfProfile> => {
    const d = await api.put<any>(`${SELF_BASE}/details`, payload);
    return mapSelfProfile(d);
  },

  updateMyAvailability: async (
    payload: DoctorSelfAvailabilityUpdatePayload,
  ): Promise<DoctorSelfProfile> => {
    const d = await api.put<any>(`${SELF_BASE}/availability`, payload);
    return mapSelfProfile(d);
  },

  addHospital: async (payload: AddHospitalPayload): Promise<DoctorSelfProfile> => {
    const d = await api.post<any>(`${SELF_BASE}/hospitals`, payload);
    return mapSelfProfile(d);
  },

  /** PATCH /api/v1/doctor/profile/accepting-bookings — pause/resume NEW online bookings */
  updateAcceptingBookings: async (accepting: boolean): Promise<{ accepting: boolean }> =>
    api.patch<{ accepting: boolean }>(`${SELF_BASE}/accepting-bookings`, { accepting }),
};

function mapSelfProfile(d: any): DoctorSelfProfile {
  return {
    id: d.id,
    name: d.name,
    specialization: d.specialization,
    gender: d.gender,
    dateOfBirth: d.dateOfBirth,
    practiceStartedDate: d.practiceStartedDate,
    registrationNo: d.registrationNo,
    consultationFee: Number(d.consultationFee ?? 0),
    isTeleAvailable: d.isTeleAvailable ?? false,
    teleFee: d.teleFee != null ? Number(d.teleFee) : undefined,
    bio: d.bio,
    clinicAddress: d.clinicAddress,
    languagesSpoken: d.languagesSpoken ?? [],
    avatarUrl: d.avatarUrl,
    videoUrl: d.videoUrl,
    profileStrength: d.profileStrength ?? 0,
    approvalStatus: d.approvalStatus ?? 'PENDING',
    acceptingBookings: d.acceptingBookings ?? true,
    qualifications: d.qualifications ?? [],
    services: d.services ?? [],
    conditions: d.conditions ?? [],
    awards: d.awards ?? [],
    hospitals: (d.hospitals ?? []).map((h: any) => ({
      hospitalId: h.hospitalId,
      hospitalName: h.hospitalName,
      address: h.address,
      consultationFee: Number(h.consultationFee ?? 0),
      isPrimary: h.isPrimary ?? false,
      roomNumber: h.roomNumber,
    })),
    availability: d.availability ?? [],
  };
}

export default doctorService;
