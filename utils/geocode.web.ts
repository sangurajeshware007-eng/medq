/**
 * Geocoding utility — web implementation (OpenStreetMap Nominatim)
 *
 * expo-location's geocodeAsync/reverseGeocodeAsync are unimplemented on web,
 * so this uses Nominatim's free endpoints: no API key, fine for our
 * low-frequency lookups (city-name detection, occasional place search).
 * Usage policy: https://operations.osmfoundation.org/policies/nominatim/
 */
const NOMINATIM = 'https://nominatim.openstreetmap.org';

export interface ReverseGeocodePlace {
  city?: string | null;
  subregion?: string | null;
  name?: string | null;
  street?: string | null;
  region?: string | null;
}

export interface GeocodePoint {
  latitude: number;
  longitude: number;
}

/** Address → coordinates. Returns the top match, or null when nothing matches. */
export async function geocode(address: string): Promise<GeocodePoint | null> {
  try {
    const url = `${NOMINATIM}/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const results = (await res.json()) as Array<{ lat: string; lon: string }>;
    const top = results?.[0];
    if (!top) return null;
    return { latitude: parseFloat(top.lat), longitude: parseFloat(top.lon) };
  } catch {
    return null;
  }
}

/** Coordinates → nearest place. Returns null when lookup fails or finds nothing. */
export async function reverseGeocode(coords: GeocodePoint): Promise<ReverseGeocodePlace | null> {
  try {
    const url = `${NOMINATIM}/reverse?format=jsonv2&accept-language=en&lat=${coords.latitude}&lon=${coords.longitude}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      address?: {
        city?: string;
        town?: string;
        village?: string;
        suburb?: string;
        neighbourhood?: string;
        road?: string;
        county?: string;
        state_district?: string;
        state?: string;
      };
    };
    const a = data.address;
    if (!a) return null;
    return {
      city: a.city || a.town || a.village || null,
      subregion: a.county || a.state_district || null,
      name: a.suburb || a.neighbourhood || null,
      street: a.road || null,
      region: a.state || null,
    };
  } catch {
    return null;
  }
}
