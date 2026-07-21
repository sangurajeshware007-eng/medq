/**
 * Geocoding utility — native implementation (expo-location)
 *
 * Single home for forward/reverse geocoding so call sites don't deal with
 * expo-location's incomplete bundled typings, and so web (where expo-location
 * geocoding is unimplemented) can swap in geocode.web.ts via Metro.
 */
import * as ExpoLocation from 'expo-location';

// expo-location v19 ships geocodeAsync/reverseGeocodeAsync at runtime but its
// bundled .d.ts is missing the exports — cast through to keep TS happy.
const Location = ExpoLocation as typeof ExpoLocation & {
  geocodeAsync: (address: string) => Promise<Array<{ latitude: number; longitude: number }>>;
  reverseGeocodeAsync: (location: { latitude: number; longitude: number }) => Promise<
    Array<{
      city?: string | null;
      subregion?: string | null;
      name?: string | null;
      street?: string | null;
      region?: string | null;
    }>
  >;
};

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
  const results = await Location.geocodeAsync(address);
  const top = results?.[0];
  return top ? { latitude: top.latitude, longitude: top.longitude } : null;
}

/** Coordinates → nearest place. Returns null when lookup fails or finds nothing. */
export async function reverseGeocode(coords: GeocodePoint): Promise<ReverseGeocodePlace | null> {
  const results = await Location.reverseGeocodeAsync(coords);
  return results?.[0] ?? null;
}
