/**
 * Hospital API service
 *
 * All endpoints use /api/v1/hospitals as the base:
 *   GET  /api/v1/hospitals         → List/filter hospitals
 *   GET  /api/v1/hospitals/{id}    → Hospital detail with doctors
 *   GET  /api/v1/hospitals/nearby  → Nearby hospitals (GPS)
 *
 * Nearby params: lat, lng, radius_km (default 15), page, size
 */
import api from './api';

// ─── Constants ───────────────────────────────────────────────────────────
const BASE = '/api/v1/hospitals';

// ─── Types ───────────────────────────────────────────────────────────────

export interface HospitalListItem {
  id: string;
  name: string;
  address: string;
  distance?: string;
  distanceKm?: number;
  rating: number;
  totalReviews: number;
  doctorsCount: number;
  image?: string;
  departments: string[];
  isOpen24x7: boolean;
  phone?: string;
}

export interface HospitalDoctor {
  id: string;
  name: string;
  specialization: string;
  rating?: number;
  photo?: string;
  consultationFee?: number;
}

export interface HospitalDetail {
  id: string;
  name: string;
  address: string;
  phone?: string;
  rating: number;
  totalReviews: number;
  image?: string;
  /** Gallery images. Falls back to `[image]` when backend has only one. */
  imageUrls: string[];
  departments: string[];
  isOpen24x7: boolean;
  totalBeds?: number;
  establishedYear?: number;
  emergencyContact?: string;
  websiteUrl?: string;
  locationLat?: number;
  locationLng?: number;
  doctors: HospitalDoctor[];
}

export interface NearbyParams {
  lat: number;
  lng: number;
  radius_km?: number;
  page?: number;
  size?: number;
}

export interface HospitalFilterParams {
  search?: string;
  page?: number;
  size?: number;
}

// ─── Service Methods ─────────────────────────────────────────────────────

export const hospitalService = {
  /** GET /api/v1/hospitals — list/filter hospitals */
  getAll: async (params?: HospitalFilterParams): Promise<HospitalListItem[]> => {
    const raw = await api.get<any[]>(BASE, { params });
    return raw.map((h) => ({
      id: h.id,
      name: h.name,
      address: h.address,
      distance: h.distance,
      distanceKm: h.distanceKm,
      rating: typeof h.rating === 'object' ? parseFloat(h.rating) : (h.rating ?? 0),
      totalReviews: h.totalReviews ?? 0,
      doctorsCount: h.doctorsCount ?? h.doctorCount ?? 0,
      image: h.image ?? h.imageUrl ?? undefined,
      departments: Array.isArray(h.departments) ? h.departments : [],
      isOpen24x7: h.isOpen24x7 ?? false,
      phone: h.phone ?? undefined,
    }));
  },

  /** GET /api/v1/hospitals/{id} — hospital detail with doctors */
  getById: async (id: string | number): Promise<HospitalDetail> => {
    const h = await api.get<any>(`${BASE}/${id}`);
    const single = h.image ?? h.imageUrl ?? undefined;
    const gallery: string[] =
      Array.isArray(h.imageUrls) && h.imageUrls.length > 0 ? h.imageUrls : single ? [single] : [];
    return {
      id: h.id,
      name: h.name,
      address: h.address,
      phone: h.phone,
      rating: typeof h.rating === 'object' ? parseFloat(h.rating) : (h.rating ?? 0),
      totalReviews: h.totalReviews ?? 0,
      image: single,
      imageUrls: gallery,
      departments: Array.isArray(h.departments) ? h.departments : [],
      isOpen24x7: h.isOpen24x7 ?? false,
      totalBeds: h.totalBeds ?? undefined,
      establishedYear: h.establishedYear ?? undefined,
      emergencyContact: h.emergencyContact ?? undefined,
      websiteUrl: h.websiteUrl ?? undefined,
      locationLat: h.locationLat ?? undefined,
      locationLng: h.locationLng ?? undefined,
      doctors: (h.doctors || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        specialization: d.specialization,
        rating: typeof d.rating === 'object' ? parseFloat(d.rating) : d.rating,
        photo: d.photo ?? d.photoUrl ?? d.avatarUrl ?? d.image ?? undefined,
        consultationFee:
          d.consultationFee != null ? Number(d.consultationFee) : undefined,
      })),
    };
  },

  /** GET /api/v1/hospitals/nearby?lat=...&lng=...&radius_km=15 */
  getNearby: async (params: NearbyParams): Promise<HospitalListItem[]> => {
    const raw = await api.get<any[]>(`${BASE}/nearby`, { params });
    return raw.map((entry) => {
      const h = entry.hospital ?? entry;
      const distanceKm: number | undefined = entry.distanceKm ?? h.distanceKm;

      return {
        id: h.id,
        name: h.name,
        address: h.address,
        distance: typeof distanceKm === 'number' ? `${distanceKm.toFixed(1)} km` : undefined,
        distanceKm,
        rating: typeof h.rating === 'object' ? parseFloat(h.rating) : (h.rating ?? 0),
        totalReviews: h.totalReviews ?? 0,
        doctorsCount: h.doctorsCount ?? h.doctorCount ?? 0,
        image: h.image ?? h.imageUrl ?? undefined,
        departments: Array.isArray(h.departments) ? h.departments : [],
        isOpen24x7: h.isOpen24x7 ?? false,
        phone: h.phone ?? undefined,
      } as HospitalListItem;
    });
  },
};

export default hospitalService;
