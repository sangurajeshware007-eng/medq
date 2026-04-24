/**
 * Zustand store for Doctor Onboarding form state
 *
 * Persists progress across app closes using MMKV.
 * Each step writes to its section; clearing happens on successful submit.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import storage from '../utils/storage';

// ─── Types ───────────────────────────────────────────────────────────────

export interface QualificationEntry {
  degree: string;
  institution: string;
  year: string;
}

export interface AwardEntry {
  title: string;
  awardedBy: string;
  year: string;
}

export interface SessionEntry {
  sessionName: string;
  sessionType: string; // OPD | SURGERY | EMERGENCY | TELE
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  slotDurationMinutes: number;
  maxPatientsPerSlot: number;
}

export interface DayAvailability {
  day: string; // MON, TUE, ...
  sessions: SessionEntry[];
}

export interface LinkedHospital {
  hospitalId: string;
  hospitalName: string;
  address: string;
  consultationFee: string;
  roomNumber: string;
  isPrimary: boolean;
  availability: DayAvailability[];
}

export interface DoctorProfileStep {
  specialization: string;
  gender: string;
  dateOfBirth: string;
  consultationFee: string;
  teleConsultation: boolean;
  teleConsultationFee: string;
  clinicAddress: string;
  bio: string;
  languages: string[];
  registrationNumber: string;
  practiceStartedYear: string;
  avatarUrl: string;      // public URL set after R2 upload
}

export interface DoctorDetailsStep {
  qualifications: QualificationEntry[];
  services: string[];
  customServices: string[];
  conditions: string[];
  customConditions: string[];
  awards: AwardEntry[];
}

interface DoctorOnboardingState {
  currentStep: number;
  completedSteps: number[];

  // Step 1 — Profile & Consultation
  profile: DoctorProfileStep;

  // Step 2 — Qualifications, Services, Conditions, Awards
  details: DoctorDetailsStep;

  // Step 3 — Hospitals & Availability
  linkedHospitals: LinkedHospital[];

  // Actions
  setCurrentStep: (step: number) => void;
  markStepCompleted: (step: number) => void;
  updateProfile: (data: Partial<DoctorProfileStep>) => void;
  updateDetails: (data: Partial<DoctorDetailsStep>) => void;
  setLinkedHospitals: (hospitals: LinkedHospital[]) => void;
  addLinkedHospital: (hospital: LinkedHospital) => void;
  removeLinkedHospital: (hospitalId: string) => void;
  updateHospitalAvailability: (hospitalId: string, availability: DayAvailability[]) => void;
  resetStore: () => void;
}

// ─── Defaults ────────────────────────────────────────────────────────────

const defaultProfile: DoctorProfileStep = {
  specialization: '',
  gender: '',
  dateOfBirth: '',
  consultationFee: '',
  teleConsultation: false,
  teleConsultationFee: '',
  clinicAddress: '',
  bio: '',
  languages: [],
  registrationNumber: '',
  practiceStartedYear: '',
  avatarUrl: '',
};

const defaultDetails: DoctorDetailsStep = {
  qualifications: [{ degree: '', institution: '', year: '' }],
  services: [],
  customServices: [],
  conditions: [],
  customConditions: [],
  awards: [],
};

// ─── MMKV-backed storage adapter for Zustand persist ─────────────────────

const mmkvStorage = createJSONStorage(() => ({
  getItem: (key: string) => storage.getSync(key),
  setItem: (key: string, value: string) => storage.setSync(key, value),
  removeItem: (key: string) => storage.removeSync(key),
}));

// ─── Store ───────────────────────────────────────────────────────────────

export const useDoctorOnboardingStore = create<DoctorOnboardingState>()(
  persist(
    (set) => ({
      currentStep: 1,
      completedSteps: [],
      profile: { ...defaultProfile },
      details: { ...defaultDetails },
      linkedHospitals: [],

      setCurrentStep: (step) => set({ currentStep: step }),

      markStepCompleted: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step],
        })),

      updateProfile: (data) =>
        set((state) => ({
          profile: { ...state.profile, ...data },
        })),

      updateDetails: (data) =>
        set((state) => ({
          details: { ...state.details, ...data },
        })),

      setLinkedHospitals: (hospitals) => set({ linkedHospitals: hospitals }),

      addLinkedHospital: (hospital) =>
        set((state) => ({
          linkedHospitals: [...state.linkedHospitals, hospital],
        })),

      removeLinkedHospital: (hospitalId) =>
        set((state) => ({
          linkedHospitals: state.linkedHospitals.filter((h) => h.hospitalId !== hospitalId),
        })),

      updateHospitalAvailability: (hospitalId, availability) =>
        set((state) => ({
          linkedHospitals: state.linkedHospitals.map((h) =>
            h.hospitalId === hospitalId ? { ...h, availability } : h,
          ),
        })),

      resetStore: () =>
        set({
          currentStep: 1,
          completedSteps: [],
          profile: { ...defaultProfile },
          details: { ...defaultDetails },
          linkedHospitals: [],
        }),
    }),
    {
      name: 'doctor-onboarding-store',
      storage: mmkvStorage,
    },
  ),
);

