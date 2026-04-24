import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import storage from '../utils/storage';
export type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

export interface DocumentUpload {
  type: string;
  fileName: string;
  uri: string;
  mimeType?: string;
  required: boolean;
  // Set after successful R2 upload
  uploadStatus: UploadStatus;
  uploadedUrl?: string;   // public URL — only used by public docs
  uploadedKey?: string;   // object key — for REGISTRATION_CERTIFICATE, ACCREDITATION
}

/**
 * Facility photos are modelled separately because there can be multiple
 * (up to 4). Each upload is independent — the user can pick, remove, and
 * re-add without disturbing the others. Lives as its own array so the
 * UI can enforce the max in one place.
 */
export interface FacilityPhoto {
  id: string;              // client-side uuid; only for React list keys
  uri: string;             // local URI for preview
  fileName: string;
  mimeType?: string;
  uploadStatus: UploadStatus;
  uploadedUrl?: string;    // public URL after successful R2 upload
}

export const MAX_FACILITY_PHOTOS = 4;
/**
 * Structured address — matches the backend AddressDto shape 1:1.
 * Pincode-led entry: user enters pincode first, city/state auto-fill from
 * the /api/v1/pincode/{pincode} lookup (and remain editable if the pincode
 * isn't in the master table).
 */
export interface HospitalAddressStep {
  addressLine1: string;  // "15 MG Road, Near Bus Stand"
  addressLine2: string;  // "Basavakalyan Nagar" (optional)
  pincode: string;       // 6 digits
  city: string;
  district: string;      // optional; often auto-filled from lookup
  state: string;
  country: string;       // defaults to "India"
}

export interface HospitalProfileStep {
  name: string;
  address: HospitalAddressStep;
  /** Map-pin coordinates — distinct from the postal address above. */
  locationLat: string;
  locationLng: string;
  phone: string;
  emergencyContact: string;
  departments: string[];
  customDepartments: string[];
  establishedYear: string;
  totalBeds: string;
  is24x7: boolean;
  website: string;
  imageUrl: string;       // public URL of hospital profile photo (set after R2 upload)
}
export interface HospitalDocumentsStep {
  registrationNumber: string;
  /** Single-file docs — registration certificate (required) and accreditation (optional). */
  documents: DocumentUpload[];
  /** Up to MAX_FACILITY_PHOTOS images showing the hospital exterior, wards, etc. */
  facilityPhotos: FacilityPhoto[];
}
interface HospitalOnboardingState {
  currentStep: number;
  completedSteps: number[];
  profile: HospitalProfileStep;
  documents: HospitalDocumentsStep;
  setCurrentStep: (step: number) => void;
  markStepCompleted: (step: number) => void;
  updateProfile: (data: Partial<HospitalProfileStep>) => void;
  updateAddress: (data: Partial<HospitalAddressStep>) => void;
  updateDocuments: (data: Partial<HospitalDocumentsStep>) => void;
  setDocument: (type: string, doc: Partial<DocumentUpload>) => void;
  addFacilityPhoto: (photo: FacilityPhoto) => void;
  updateFacilityPhoto: (id: string, partial: Partial<FacilityPhoto>) => void;
  removeFacilityPhoto: (id: string) => void;
  resetStore: () => void;
}
const defaultAddress: HospitalAddressStep = {
  addressLine1: '', addressLine2: '', pincode: '',
  city: '', district: '', state: '', country: 'India',
};
const defaultProfile: HospitalProfileStep = {
  name: '', address: { ...defaultAddress }, locationLat: '', locationLng: '',
  phone: '', emergencyContact: '', departments: [], customDepartments: [],
  establishedYear: '', totalBeds: '', is24x7: false, website: '', imageUrl: '',
};
// LOGO and FACILITY_PHOTOS are intentionally NOT here:
//  - LOGO lives on profile.imageUrl (uploaded in step 1, saved to hospitals.image_url)
//  - FACILITY_PHOTOS live in documents.facilityPhotos as a multi-entry array
const defaultDocs: DocumentUpload[] = [
  { type: 'REGISTRATION_CERTIFICATE', fileName: '', uri: '', required: true, uploadStatus: 'idle' },
  { type: 'ACCREDITATION', fileName: '', uri: '', required: false, uploadStatus: 'idle' },
];
const mmkvStorage = createJSONStorage(() => ({
  getItem: (key: string) => storage.getSync(key),
  setItem: (key: string, value: string) => storage.setSync(key, value),
  removeItem: (key: string) => storage.removeSync(key),
}));
export const useHospitalOnboardingStore = create<HospitalOnboardingState>()(
  persist(
    (set) => ({
      currentStep: 1,
      completedSteps: [],
      profile: { ...defaultProfile },
      documents: { registrationNumber: '', documents: defaultDocs.map((d) => ({ ...d })), facilityPhotos: [] },
      setCurrentStep: (step) => set({ currentStep: step }),
      markStepCompleted: (step) =>
        set((s) => ({
          completedSteps: s.completedSteps.includes(step) ? s.completedSteps : [...s.completedSteps, step],
        })),
      updateProfile: (data) => set((s) => ({ profile: { ...s.profile, ...data } })),
      updateAddress: (data) => set((s) => ({
        profile: { ...s.profile, address: { ...s.profile.address, ...data } },
      })),
      updateDocuments: (data) => set((s) => ({ documents: { ...s.documents, ...data } })),
      setDocument: (type, doc) =>
        set((s) => ({
          documents: {
            ...s.documents,
            documents: s.documents.documents.map((d) => (d.type === type ? { ...d, ...doc } : d)),
          },
        })),
      addFacilityPhoto: (photo) =>
        set((s) => {
          if (s.documents.facilityPhotos.length >= MAX_FACILITY_PHOTOS) return s;
          return {
            documents: {
              ...s.documents,
              facilityPhotos: [...s.documents.facilityPhotos, photo],
            },
          };
        }),
      updateFacilityPhoto: (id, partial) =>
        set((s) => ({
          documents: {
            ...s.documents,
            facilityPhotos: s.documents.facilityPhotos.map((p) =>
              p.id === id ? { ...p, ...partial } : p,
            ),
          },
        })),
      removeFacilityPhoto: (id) =>
        set((s) => ({
          documents: {
            ...s.documents,
            facilityPhotos: s.documents.facilityPhotos.filter((p) => p.id !== id),
          },
        })),
      resetStore: () =>
        set({
          currentStep: 1, completedSteps: [],
          profile: { ...defaultProfile },
          documents: { registrationNumber: '', documents: defaultDocs.map((d) => ({ ...d })), facilityPhotos: [] },
        }),
    }),
    {
      name: 'hospital-onboarding-store',
      storage: mmkvStorage,
      // Bump when the persisted schema changes. `migrate` upgrades old
      // shapes in place so half-filled drafts survive app updates.
      version: 3,
      migrate: (persisted: unknown, fromVersion) => {
        if (!persisted || typeof persisted !== 'object') return persisted as HospitalOnboardingState;
        const s = persisted as {
          profile?: { address?: unknown };
          documents?: { documents?: Array<{ type: string }>; facilityPhotos?: unknown };
        };

        // v<2 → v2: profile.address was a flat string, now an object.
        if (fromVersion < 2 && s.profile) {
          if (typeof s.profile.address === 'string' || s.profile.address == null) {
            s.profile.address = { ...defaultAddress };
          }
        }

        // v<3 → v3: remove LOGO + FACILITY_PHOTOS entries from documents
        // (LOGO moved to profile.imageUrl in step 1; FACILITY_PHOTOS split
        // into its own facilityPhotos[] array).
        if (fromVersion < 3 && s.documents) {
          if (Array.isArray(s.documents.documents)) {
            s.documents.documents = s.documents.documents.filter(
              (d) => d.type !== 'LOGO' && d.type !== 'FACILITY_PHOTOS',
            );
          }
          if (!Array.isArray(s.documents.facilityPhotos)) {
            s.documents.facilityPhotos = [];
          }
        }
        return persisted as HospitalOnboardingState;
      },
    },
  ),
);
