import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

import storage from '../utils/storage';

export interface LocationItem {
  id: string;
  name: string;
  area: string;
  city: string;
  state: string;
  pincode?: string;
  latitude: number;
  longitude: number;
}

interface LocationContextType {
  selectedLocation: LocationItem | null;
  recentLocations: LocationItem[];
  setLocation: (location: LocationItem) => void;
  clearLocation: () => void;
  displayName: string;
  detecting: boolean;
  setDetecting: (val: boolean) => void;
}

const STORAGE_KEY = '@medreach_location';
const RECENT_KEY = '@medreach_recent_locations';

const LocationContext = createContext<LocationContextType>({
  selectedLocation: null,
  recentLocations: [],
  setLocation: () => {},
  clearLocation: () => {},
  displayName: '',
  detecting: false,
  setDetecting: () => {},
});

export function LocationProvider({ children }: { children: ReactNode }) {
  // Hydrate synchronously from MMKV in the initializer so consumers never see a
  // null-then-restored value on remount (fixes a race where the home screen
  // saw `selectedLocation = null` on the first render and auto-ran GPS detect,
  // overwriting the user's chosen location).
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(() => {
    try {
      const saved = storage.getSync(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as LocationItem) : null;
    } catch {
      return null;
    }
  });
  const [recentLocations, setRecentLocations] = useState<LocationItem[]>(() => {
    try {
      const recent = storage.getSync(RECENT_KEY);
      return recent ? (JSON.parse(recent) as LocationItem[]) : [];
    } catch {
      return [];
    }
  });
  const [detecting, setDetecting] = useState(false);

  const setLocation = useCallback((location: LocationItem) => {
    setSelectedLocation(location);
    try {
      storage.setSync(STORAGE_KEY, JSON.stringify(location));
      setRecentLocations((prev) => {
        const filtered = prev.filter((l) => l.id !== location.id);
        const updated = [location, ...filtered].slice(0, 5);
        storage.setSync(RECENT_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // ignore
    }
  }, []);

  const clearLocation = useCallback(() => {
    setSelectedLocation(null);
    try {
      storage.removeSync(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const displayName = useMemo(() => {
    if (!selectedLocation) return 'Hubli, Karnataka';
    return `${selectedLocation.area}, ${selectedLocation.city}`;
  }, [selectedLocation]);

  const value = useMemo(
    () => ({
      selectedLocation,
      recentLocations,
      setLocation,
      clearLocation,
      displayName,
      detecting,
      setDetecting,
    }),
    [selectedLocation, recentLocations, setLocation, clearLocation, displayName, detecting, setDetecting]
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

export default LocationContext;

