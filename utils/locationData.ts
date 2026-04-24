import { LocationItem } from '../context/LocationContext';

/**
 * Popular locations across Tier-2/3 Indian cities for autocomplete.
 * No Google API needed — fast, offline, and free.
 */
export const POPULAR_LOCATIONS: LocationItem[] = [
  // ─── Hubli-Dharwad ───────────────────────────────
  { id: 'hubli-1', name: 'Hubli', area: 'Vidyanagar', city: 'Hubli', state: 'Karnataka', pincode: '580021', latitude: 15.3647, longitude: 75.1240 },
  { id: 'hubli-2', name: 'Hubli', area: 'Keshwapur', city: 'Hubli', state: 'Karnataka', pincode: '580023', latitude: 15.3512, longitude: 75.1350 },
  { id: 'hubli-3', name: 'Hubli', area: 'Gokul Road', city: 'Hubli', state: 'Karnataka', pincode: '580030', latitude: 15.3780, longitude: 75.1280 },
  { id: 'hubli-4', name: 'Hubli', area: 'Deshpande Nagar', city: 'Hubli', state: 'Karnataka', pincode: '580029', latitude: 15.3600, longitude: 75.1150 },
  { id: 'hubli-5', name: 'Hubli', area: 'Navanagar', city: 'Hubli', state: 'Karnataka', pincode: '580025', latitude: 15.3750, longitude: 75.1450 },
  { id: 'hubli-6', name: 'Hubli', area: 'Old Hubli', city: 'Hubli', state: 'Karnataka', pincode: '580020', latitude: 15.3490, longitude: 75.1280 },
  { id: 'hubli-7', name: 'Hubli', area: 'Unkal', city: 'Hubli', state: 'Karnataka', pincode: '580031', latitude: 15.3820, longitude: 75.1050 },
  { id: 'hubli-8', name: 'Hubli', area: 'Shirur Park', city: 'Hubli', state: 'Karnataka', pincode: '580020', latitude: 15.3540, longitude: 75.1310 },
  { id: 'dharwad-1', name: 'Dharwad', area: 'Saptapur', city: 'Dharwad', state: 'Karnataka', pincode: '580001', latitude: 15.4589, longitude: 75.0078 },
  { id: 'dharwad-2', name: 'Dharwad', area: 'Court Circle', city: 'Dharwad', state: 'Karnataka', pincode: '580001', latitude: 15.4600, longitude: 75.0100 },
  { id: 'dharwad-3', name: 'Dharwad', area: 'Kalyan Nagar', city: 'Dharwad', state: 'Karnataka', pincode: '580007', latitude: 15.4450, longitude: 75.0200 },

  // ─── Belgaum (Belagavi) ──────────────────────────
  { id: 'belgaum-1', name: 'Belgaum', area: 'Camp Area', city: 'Belgaum', state: 'Karnataka', pincode: '590001', latitude: 15.8497, longitude: 74.4977 },
  { id: 'belgaum-2', name: 'Belgaum', area: 'Tilakwadi', city: 'Belgaum', state: 'Karnataka', pincode: '590006', latitude: 15.8550, longitude: 74.5100 },
  { id: 'belgaum-3', name: 'Belgaum', area: 'Shahapur', city: 'Belgaum', state: 'Karnataka', pincode: '590003', latitude: 15.8600, longitude: 74.5020 },

  // ─── Basavakalyan ─────────────────────────────────
  { id: 'basavakalyan-1', name: 'Basavakalyan', area: 'Bus Stand', city: 'Basavakalyan', state: 'Karnataka', pincode: '585327', latitude: 17.8727, longitude: 76.9507 },
  { id: 'basavakalyan-2', name: 'Basavakalyan', area: 'Gandhi Chowk', city: 'Basavakalyan', state: 'Karnataka', pincode: '585327', latitude: 17.8740, longitude: 76.9490 },
  { id: 'basavakalyan-3', name: 'Basavakalyan', area: 'Station Road', city: 'Basavakalyan', state: 'Karnataka', pincode: '585327', latitude: 17.8710, longitude: 76.9530 },
  { id: 'basavakalyan-4', name: 'Basavakalyan', area: 'Humnabad Road', city: 'Basavakalyan', state: 'Karnataka', pincode: '585327', latitude: 17.8690, longitude: 76.9460 },
  { id: 'basavakalyan-5', name: 'Basavakalyan', area: 'Udgir Road', city: 'Basavakalyan', state: 'Karnataka', pincode: '585327', latitude: 17.8760, longitude: 76.9550 },
  { id: 'basavakalyan-6', name: 'Basavakalyan', area: 'Nehru Nagar', city: 'Basavakalyan', state: 'Karnataka', pincode: '585327', latitude: 17.8735, longitude: 76.9475 },

  // ─── Bidar ──────────────────────────────────────
  { id: 'bidar-1', name: 'Bidar', area: 'Bus Stand', city: 'Bidar', state: 'Karnataka', pincode: '585401', latitude: 17.9104, longitude: 77.5199 },
  { id: 'bidar-2', name: 'Bidar', area: 'Chidri', city: 'Bidar', state: 'Karnataka', pincode: '585401', latitude: 17.9150, longitude: 77.5230 },
  { id: 'bidar-3', name: 'Bidar', area: 'Naubad', city: 'Bidar', state: 'Karnataka', pincode: '585403', latitude: 17.9080, longitude: 77.5150 },

  // ─── Humnabad ───────────────────────────────────
  { id: 'humnabad-1', name: 'Humnabad', area: 'Main Road', city: 'Humnabad', state: 'Karnataka', pincode: '585330', latitude: 17.7687, longitude: 77.1397 },
  { id: 'humnabad-2', name: 'Humnabad', area: 'Bus Stand', city: 'Humnabad', state: 'Karnataka', pincode: '585330', latitude: 17.7700, longitude: 77.1380 },

  // ─── Gulbarga (Kalaburagi) ───────────────────────
  { id: 'gulbarga-1', name: 'Kalaburagi', area: 'Supermarket', city: 'Kalaburagi', state: 'Karnataka', pincode: '585101', latitude: 17.3297, longitude: 76.8343 },
  { id: 'gulbarga-2', name: 'Kalaburagi', area: 'Jewargi Colony', city: 'Kalaburagi', state: 'Karnataka', pincode: '585102', latitude: 17.335, longitude: 76.84 },
  { id: 'gulbarga-3', name: 'Kalaburagi', area: 'Aiwan-E-Shahi', city: 'Kalaburagi', state: 'Karnataka', pincode: '585104', latitude: 17.3280, longitude: 76.8310 },
  { id: 'gulbarga-4', name: 'Kalaburagi', area: 'Sedam Road', city: 'Kalaburagi', state: 'Karnataka', pincode: '585105', latitude: 17.3400, longitude: 76.8500 },

  // ─── Bellary (Ballari) ──────────────────────────
  { id: 'bellary-1', name: 'Ballari', area: 'Gandhi Nagar', city: 'Ballari', state: 'Karnataka', pincode: '583101', latitude: 15.1394, longitude: 76.9214 },

  // ─── Davangere ──────────────────────────────────
  { id: 'davangere-1', name: 'Davangere', area: 'MCC A Block', city: 'Davangere', state: 'Karnataka', pincode: '577004', latitude: 14.4644, longitude: 75.9218 },

  // ─── Shimoga (Shivamogga) ───────────────────────
  { id: 'shimoga-1', name: 'Shivamogga', area: 'Durgigudi', city: 'Shivamogga', state: 'Karnataka', pincode: '577201', latitude: 13.9299, longitude: 75.5681 },

  // ─── Mysore ─────────────────────────────────────
  { id: 'mysore-1', name: 'Mysore', area: 'Saraswathipuram', city: 'Mysore', state: 'Karnataka', pincode: '570009', latitude: 12.3051, longitude: 76.6551 },
  { id: 'mysore-2', name: 'Mysore', area: 'Vijayanagar', city: 'Mysore', state: 'Karnataka', pincode: '570017', latitude: 12.3150, longitude: 76.6400 },

  // ─── Mangalore ──────────────────────────────────
  { id: 'mangalore-1', name: 'Mangalore', area: 'Hampankatta', city: 'Mangalore', state: 'Karnataka', pincode: '575001', latitude: 12.8714, longitude: 74.8428 },
  { id: 'mangalore-2', name: 'Mangalore', area: 'Kadri', city: 'Mangalore', state: 'Karnataka', pincode: '575002', latitude: 12.8800, longitude: 74.8500 },

  // ─── Bangalore (for users who travel) ───────────
  { id: 'bangalore-1', name: 'Bangalore', area: 'Koramangala', city: 'Bangalore', state: 'Karnataka', pincode: '560034', latitude: 12.9352, longitude: 77.6245 },
  { id: 'bangalore-2', name: 'Bangalore', area: 'Indiranagar', city: 'Bangalore', state: 'Karnataka', pincode: '560038', latitude: 12.9784, longitude: 77.6408 },
  { id: 'bangalore-3', name: 'Bangalore', area: 'Jayanagar', city: 'Bangalore', state: 'Karnataka', pincode: '560041', latitude: 12.9250, longitude: 77.5930 },
  { id: 'bangalore-4', name: 'Bangalore', area: 'Rajajinagar', city: 'Bangalore', state: 'Karnataka', pincode: '560010', latitude: 12.9900, longitude: 77.5520 },

  // ─── Pune ───────────────────────────────────────
  { id: 'pune-1', name: 'Pune', area: 'Shivajinagar', city: 'Pune', state: 'Maharashtra', pincode: '411005', latitude: 18.5314, longitude: 73.8446 },
  { id: 'pune-2', name: 'Pune', area: 'Kothrud', city: 'Pune', state: 'Maharashtra', pincode: '411038', latitude: 18.5074, longitude: 73.8077 },

  // ─── Kolhapur ───────────────────────────────────
  { id: 'kolhapur-1', name: 'Kolhapur', area: 'Rajarampuri', city: 'Kolhapur', state: 'Maharashtra', pincode: '416008', latitude: 16.7050, longitude: 74.2433 },

  // ─── Solapur ────────────────────────────────────
  { id: 'solapur-1', name: 'Solapur', area: 'Railway Lines', city: 'Solapur', state: 'Maharashtra', pincode: '413001', latitude: 17.6599, longitude: 75.9064 },

  // ─── Hyderabad ──────────────────────────────────
  { id: 'hyderabad-1', name: 'Hyderabad', area: 'Ameerpet', city: 'Hyderabad', state: 'Telangana', pincode: '500016', latitude: 17.4375, longitude: 78.4483 },
  { id: 'hyderabad-2', name: 'Hyderabad', area: 'Madhapur', city: 'Hyderabad', state: 'Telangana', pincode: '500081', latitude: 17.4484, longitude: 78.3908 },

  // ─── Goa ────────────────────────────────────────
  { id: 'goa-1', name: 'Panjim', area: 'Panaji', city: 'Panjim', state: 'Goa', pincode: '403001', latitude: 15.4989, longitude: 73.8278 },

  // ─── Raichur ────────────────────────────────────
  { id: 'raichur-1', name: 'Raichur', area: 'Station Road', city: 'Raichur', state: 'Karnataka', pincode: '584101', latitude: 16.2120, longitude: 77.3439 },

  // ─── Bijapur (Vijayapura) ───────────────────────
  { id: 'bijapur-1', name: 'Vijayapura', area: 'Gandhi Chowk', city: 'Vijayapura', state: 'Karnataka', pincode: '586101', latitude: 16.8302, longitude: 75.7100 },

  // ─── Gadag ──────────────────────────────────────
  { id: 'gadag-1', name: 'Gadag', area: 'Station Road', city: 'Gadag', state: 'Karnataka', pincode: '582101', latitude: 15.4167, longitude: 75.6167 },

  // ─── Haveri ─────────────────────────────────────
  { id: 'haveri-1', name: 'Haveri', area: 'Bus Stand', city: 'Haveri', state: 'Karnataka', pincode: '581110', latitude: 14.7951, longitude: 75.3990 },
];

/**
 * Search locations by query string.
 * Matches against area, city, state, and pincode.
 */
export function searchLocations(query: string): LocationItem[] {
  if (!query || query.trim().length < 2) return [];

  const q = query.toLowerCase().trim();

  return POPULAR_LOCATIONS.filter((loc) => {
    return (
      loc.area.toLowerCase().includes(q) ||
      loc.city.toLowerCase().includes(q) ||
      loc.state.toLowerCase().includes(q) ||
      loc.name.toLowerCase().includes(q) ||
      (loc.pincode && loc.pincode.includes(q))
    );
  }).slice(0, 10); // Max 10 results
}

/**
 * Get popular locations (for "Popular Cities" section).
 * Returns one entry per unique city.
 */
export function getPopularCities(): LocationItem[] {
  const seen = new Set<string>();
  const cities: LocationItem[] = [];

  for (const loc of POPULAR_LOCATIONS) {
    if (!seen.has(loc.city)) {
      seen.add(loc.city);
      cities.push(loc);
    }
  }
  return cities;
}

