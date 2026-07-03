import api from './api';

const BASE = '/api/v1';

export interface StaffMember {
  id: string;
  userId: string | null;
  userName: string | null;
  userPhone: string | null;
  phonePending: string | null;
  hospitalId: string;
  hospitalName: string;
  role: string;
  status: string;
  invitedByName: string | null;
  createdAt: string;
  activatedAt: string | null;
}

export interface InviteStaffPayload {
  phone: string;
  role: 'HOSPITAL_RECEPTIONIST' | 'HOSPITAL_MANAGER';
}

export interface DoctorHospitalItem {
  hospitalId: string;
  hospitalName: string;
  isPrimary: boolean;
}

export interface PhoneLookupResult {
  userId: string;
  name: string;
  phone: string;
}

export const staffService = {
  // ── Doctor operations ───────────────────────────────────────────────────────
  doctorMyHospitals: (): Promise<DoctorHospitalItem[]> =>
    api.get<DoctorHospitalItem[]>(`${BASE}/doctor/staff/my-hospitals`),

  doctorLookupPhone: (phone: string): Promise<PhoneLookupResult | null> =>
    api.get<PhoneLookupResult | null>(`${BASE}/doctor/staff/lookup`, { params: { phone } }),

  doctorInviteReceptionist: (hospitalId: string, phone: string): Promise<StaffMember> =>
    api.post<StaffMember>(
      `${BASE}/doctor/staff/invite`,
      { phone, role: 'HOSPITAL_RECEPTIONIST' },
      { params: { hospitalId } }
    ),

  doctorListReceptionists: (hospitalId: string): Promise<StaffMember[]> =>
    api.get<StaffMember[]>(`${BASE}/doctor/staff/receptionists`, { params: { hospitalId } }),

  doctorRevokeReceptionist: (staffId: string): Promise<void> =>
    api.delete<void>(`${BASE}/doctor/staff/${staffId}`),

  // ── Manager operations ──────────────────────────────────────────────────────
  managerInvite: (hospitalId: string, payload: InviteStaffPayload): Promise<StaffMember> =>
    api.post<StaffMember>(`${BASE}/hospital-manager/staff/invite`, payload, { params: { hospitalId } }),

  managerListByHospital: (hospitalId: string, status?: string): Promise<StaffMember[]> =>
    api.get<StaffMember[]>(`${BASE}/hospital-manager/staff`, { params: { hospitalId, status } }),

  managerApprove: (staffId: string): Promise<StaffMember> =>
    api.post<StaffMember>(`${BASE}/hospital-manager/staff/${staffId}/approve`),

  managerReject: (staffId: string): Promise<void> =>
    api.post<void>(`${BASE}/hospital-manager/staff/${staffId}/reject`),

  managerRevoke: (staffId: string): Promise<void> =>
    api.delete<void>(`${BASE}/hospital-manager/staff/${staffId}`),
};

export default staffService;
