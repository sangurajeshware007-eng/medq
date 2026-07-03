import api from './api';

const BASE = '/api/v1/reception';

export interface ReceptionHospitalItem {
  hospitalId: string;
  hospitalName: string;
}

export interface ReceptionDoctorItem {
  doctorId: string;
  name: string;
  specialization: string;
  consultationFee: string;
}

export interface PatientLookupResult {
  userId: string;
  name: string;
  phone: string;
}

export interface CreateWalkInPayload {
  doctorId: string;
  hospitalId: string;
  patientPhone: string;
  patientName?: string;
  bookingDate: string;     // YYYY-MM-DD
  slotStart: string;       // HH:mm-HH:mm
  paymentMethod?: string;
  notes?: string;
}

export interface CreateWalkInResponse {
  bookingId: string;
  bookingRef: string;
  patientUserId: string;
  createdNewUser: boolean;
}

export interface CheckInResponse {
  bookingId: string;
  bookingRef: string;
  checkedInAt: string;
}

export interface ReceptionBookingItem {
  bookingId: string;
  bookingRef: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  slotStart: string;     // HH:mm
  slotEnd: string;       // HH:mm
  tokenNumber: number;
  checkedIn: boolean;
  checkedInAt: string | null;
  source: 'ONLINE' | 'WALK_IN';
  notes: string | null;
}

export const receptionService = {
  myHospitals: (): Promise<ReceptionHospitalItem[]> =>
    api.get<ReceptionHospitalItem[]>(`${BASE}/my-hospitals`),

  doctorsAtHospital: (hospitalId: string): Promise<ReceptionDoctorItem[]> =>
    api.get<ReceptionDoctorItem[]>(`${BASE}/hospitals/${hospitalId}/doctors`),

  lookupPatient: (phone: string): Promise<PatientLookupResult | null> =>
    api.get<PatientLookupResult | null>(`${BASE}/lookup-patient`, { params: { phone } }),

  createWalkIn: (payload: CreateWalkInPayload): Promise<CreateWalkInResponse> =>
    api.post<CreateWalkInResponse>(`${BASE}/walk-in`, payload),

  checkIn: (bookingRef: string): Promise<CheckInResponse> =>
    api.post<CheckInResponse>(`${BASE}/check-in/${bookingRef}`),

  listBookings: (
    hospitalId: string,
    date: string,
    onlyPending: boolean = true,
  ): Promise<ReceptionBookingItem[]> =>
    api.get<ReceptionBookingItem[]>(
      `${BASE}/hospitals/${hospitalId}/bookings`,
      { params: { date, onlyPending } },
    ),
};

export default receptionService;
