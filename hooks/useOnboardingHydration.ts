/**
 * useOnboardingHydration — Fetches saved onboarding data from the backend
 * and populates the Zustand stores so forms are pre-filled when a user returns.
 *
 * Usage: call in the onboarding _layout.tsx before rendering steps.
 */
import onboardingService from '@services/onboardingService';
import type {
  OnboardingStatus,
  DoctorOnboardingResponse,
  HospitalOnboardingData,
} from '@services/onboardingService';
import { useDoctorOnboardingStore } from '@store/doctorOnboardingStore';
import { useHospitalOnboardingStore } from '@store/hospitalOnboardingStore';
import { useState, useEffect, useCallback } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Map backend dayOfWeek (1=Monday … 7=Sunday) to our day codes */
const DAY_OF_WEEK_MAP: Record<number, string> = {
  1: 'MON',
  2: 'TUE',
  3: 'WED',
  4: 'THU',
  5: 'FRI',
  6: 'SAT',
  7: 'SUN',
};

/** Map backend approvalStatus → our OnboardingStatus */
function toOnboardingStatus(approvalStatus: string): OnboardingStatus {
  if (approvalStatus === 'DRAFT') return 'IN_PROGRESS';
  return approvalStatus as OnboardingStatus;
}

/**
 * Group flat availability rows (one per session) into { day, sessions[] }
 * expected by the Zustand store.
 */
function groupAvailability(flat: DoctorOnboardingResponse['hospitals'][number]['availability']) {
  const map = new Map<string, typeof flat>();
  for (const row of flat) {
    const day = DAY_OF_WEEK_MAP[row.dayOfWeek] ?? `DAY${row.dayOfWeek}`;
    const existing = map.get(day) ?? [];
    existing.push(row);
    map.set(day, existing);
  }
  return Array.from(map.entries()).map(([day, rows]) => ({
    day,
    sessions: rows.map((r) => ({
      sessionName: r.sessionName,
      sessionType: r.sessionType ?? 'OPD',
      startTime: r.startTime,
      endTime: r.endTime,
      slotDurationMinutes: r.slotDurationMinutes ?? 15,
      maxPatientsPerSlot: r.maxPatientsPerSlot ?? 1,
    })),
  }));
}

// ─── Doctor Hydration ─────────────────────────────────────────────────────

interface HydrationResult {
  /** True while fetching status + data from the backend */
  loading: boolean;
  /** The step the user should land on (1-based) */
  resumeStep: number;
  /** Backend onboarding status */
  status: OnboardingStatus | null;
  /** Non-null if status is REJECTED */
  rejectionReason?: string;
}

export function useDoctorOnboardingHydration(): HydrationResult {
  const [loading, setLoading] = useState(true);
  const [resumeStep, setResumeStep] = useState(1);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | undefined>();

  const store = useDoctorOnboardingStore();

  const hydrate = useCallback(async () => {
    try {
      // Single GET — returns status + all saved data
      const res: DoctorOnboardingResponse = await onboardingService.getDoctorOnboarding();
      const mapped = toOnboardingStatus(res.approvalStatus);
      setStatus(mapped);
      setRejectionReason(res.rejectionReason ?? undefined);

      // Nothing to hydrate
      if (mapped === 'NOT_STARTED') {
        setResumeStep(1);
        return;
      }

      // Already submitted — layout will redirect to approval-pending
      if (mapped === 'PENDING' || mapped === 'APPROVED') {
        setResumeStep(1);
        return;
      }

      // DRAFT (IN_PROGRESS) or REJECTED → hydrate the store
      const completedSteps: number[] = [];

      // Step 1 — Profile
      if (res.profile) {
        const p = res.profile;
        store.updateProfile({
          specialization: p.specialization ?? '',
          gender: p.gender ?? '',
          dateOfBirth: p.dateOfBirth ?? '',
          consultationFee: p.consultationFee ? String(p.consultationFee) : '',
          teleConsultation: p.teleConsultation ?? false,
          teleConsultationFee: p.teleConsultationFee ? String(p.teleConsultationFee) : '',
          clinicAddress: p.clinicAddress ?? '',
          bio: p.bio ?? '',
          languages: p.languagesSpoken ?? [],
          registrationNumber: p.registrationNumber ?? '',
          practiceStartedYear: p.practiceStartedYear ? String(p.practiceStartedYear) : '',
          avatarUrl: p.avatarUrl ?? '',
        });
        completedSteps.push(1);
      }

      // Step 2 — Details
      if (res.details) {
        const d = res.details;
        store.updateDetails({
          qualifications: d.qualifications?.length
            ? d.qualifications.map((q) => ({
                degree: q.degree,
                institution: q.institution,
                year: q.year ? String(q.year) : '',
              }))
            : [{ degree: '', institution: '', year: '' }],
          services: d.services ?? [],
          customServices: [],
          conditions: d.conditions ?? [],
          customConditions: [],
          awards: d.awards?.length
            ? d.awards.map((a) => ({
                title: a.title,
                awardedBy: a.awardedBy,
                year: a.year ? String(a.year) : '',
              }))
            : [],
        });
        completedSteps.push(2);
      }

      // Step 3 — Linked hospitals
      if (res.hospitals && res.hospitals.length > 0) {
        store.setLinkedHospitals(
          res.hospitals.map((h) => ({
            hospitalId: h.hospitalId,
            hospitalName: h.hospitalName ?? '',
            address: h.address ?? '',
            consultationFee: h.consultationFee ? String(h.consultationFee) : '',
            roomNumber: h.roomNumber ?? '',
            isPrimary: h.isPrimary ?? false,
            availability: groupAvailability(h.availability ?? []),
          })),
        );
        completedSteps.push(3);
      }

      // Update store progress
      for (const step of completedSteps) {
        store.markStepCompleted(step);
      }
      const nextStep = completedSteps.length > 0 ? Math.min(Math.max(...completedSteps) + 1, 4) : 1;
      store.setCurrentStep(nextStep);
      setResumeStep(nextStep);
    } catch {
      // Fetch failed — fall back to local Zustand state (MMKV-persisted)
      setResumeStep(store.currentStep);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return { loading, resumeStep, status, rejectionReason };
}

// ─── Hospital Hydration ───────────────────────────────────────────────────

/**
 * @param editMode When true, hydrate the form even for APPROVED hospitals so
 *   the owner can edit their existing details. Default false keeps the
 *   original onboarding behaviour (don't load form data once submitted/approved).
 */
export function useHospitalOnboardingHydration(editMode: boolean = false): HydrationResult {
  const [loading, setLoading] = useState(true);
  const [resumeStep, setResumeStep] = useState(1);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | undefined>();

  const store = useHospitalOnboardingStore();

  const hydrate = useCallback(async () => {
    try {
      // Backend returns { hospitalId, approvalStatus, rejectionReason, ... } —
      // NOT { status, currentStep }. Reading the wrong field here used to make
      // this always undefined, so the layout's PENDING/APPROVED redirect never
      // fired and approved owners landed back on "Submit for Approval".
      const statusRes = await onboardingService.getHospitalOnboardingStatus();
      const mapped = toOnboardingStatus(statusRes.approvalStatus);
      setStatus(mapped);
      setRejectionReason(statusRes.rejectionReason ?? undefined);

      if (mapped === 'NOT_STARTED') {
        setResumeStep(1);
        setLoading(false);
        return;
      }

      // In normal onboarding, don't re-hydrate once submitted/approved — but
      // edit-mode (owner re-editing an approved hospital) NEEDS the data.
      const skipHydrate = !editMode && (mapped === 'PENDING' || mapped === 'APPROVED');
      if (skipHydrate) {
        setResumeStep(1);
        setLoading(false);
        return;
      }

      // IN_PROGRESS / REJECTED / (APPROVED in edit mode) → fetch and hydrate
      const data: HospitalOnboardingData = await onboardingService.getHospitalData();

      const completedSteps: number[] = [];

      // Hydrate profile (Step 1)
      if (data.profile) {
        const p = data.profile;
        store.updateProfile({
          name: p.name ?? '',
          address: p.address ?? '',
          locationLat:
            p.locationLat !== null && p.locationLat !== undefined ? String(p.locationLat) : '',
          locationLng:
            p.locationLng !== null && p.locationLng !== undefined ? String(p.locationLng) : '',
          phone: p.phone ?? '',
          emergencyContact: p.emergencyContact ?? '',
          departments: p.departments ?? [],
          customDepartments: [],
          establishedYear: p.establishedYear ? String(p.establishedYear) : '',
          totalBeds: p.totalBeds ? String(p.totalBeds) : '',
          is24x7: p.is24x7 ?? false,
          website: p.website ?? '',
          imageUrl: p.imageUrl ?? '',
        });
        completedSteps.push(1);
      }

      // Hydrate documents (Step 2)
      if (data.documents) {
        store.updateDocuments({ registrationNumber: data.documents.registrationNumber ?? '' });
        for (const doc of data.documents.documents ?? []) {
          store.setDocument(doc.documentType, {
            fileName: doc.fileName ?? '',
            uri: doc.documentUrl ?? '',
            uploadStatus: doc.documentUrl ? 'done' : 'idle',
            uploadedUrl: doc.documentUrl,
          });
        }
        completedSteps.push(2);
      }

      for (const step of completedSteps) {
        store.markStepCompleted(step);
      }

      const nextStep = completedSteps.length > 0 ? Math.min(Math.max(...completedSteps) + 1, 3) : 1;
      store.setCurrentStep(nextStep);
      setResumeStep(nextStep);
    } catch {
      setResumeStep(store.currentStep);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return { loading, resumeStep, status, rejectionReason };
}
