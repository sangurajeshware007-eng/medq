/**
 * City landmark image lookup — used by the home-screen welcome hero so the
 * background matches the user's selected city / GPS coordinates.
 *
 * Two lookup paths:
 *   • getByCity(city, state) — exact name match (legacy)
 *   • getNearby(lat, lng)    — radius-based, returns all matches sorted by
 *                              distance. Multiple overlapping coverage areas
 *                              naturally return multiple results.
 *
 * Empty results / null mean "no image configured" — callers MUST fall back
 * to the default gradient rather than treat it as an error.
 */
import api from './api';

export interface CityImage {
  id: string;
  city: string;
  state: string;
  country: string;
  imageUrl: string;
  caption: string | null;
  locationLat: number | null;
  locationLng: number | null;
  /** Present only on /nearby responses. */
  distanceKm?: number | null;
}

const BASE = '/api/v1/city-images';

const cityImageService = {
  /** Look up the active image for a city (case-insensitive). state optional but recommended. */
  getByCity: async (city: string, state?: string): Promise<CityImage | null> => {
    if (!city?.trim()) return null;
    const params: Record<string, string> = { city };
    if (state) params.state = state;
    const raw = await api.get<CityImage | null>(BASE, { params });
    return raw ?? null;
  },

  /**
   * Find all active images whose configured (lat, lng, radius_km) coverage
   * contains the requested point. Sorted by distance ascending. Empty array
   * means no image is configured for this area.
   */
  getNearby: async (lat: number, lng: number): Promise<CityImage[]> => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    const raw = await api.get<CityImage[]>(`${BASE}/nearby`, {
      params: { lat: String(lat), lng: String(lng) },
    });
    return raw ?? [];
  },
};

export default cityImageService;
