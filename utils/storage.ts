/**
 * Native storage utility — backed by react-native-mmkv
 *
 * MMKV is a high-performance key-value storage (~30x faster than AsyncStorage).
 * It is synchronous on native, which eliminates async ceremony for simple reads.
 *
 * API surface intentionally matches the old AsyncStorage-backed adapter so
 * all call sites keep working without changes.
 *
 * Graceful fallback to AsyncStorage for Expo Go and Chrome remote debugging.
 * In fallback mode, getSync reads from an in-memory map that is pre-seeded from
 * AsyncStorage on startup — this preserves session across app restarts in dev.
 */
import { MMKV } from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';

let mmkv: MMKV | null = null;
const memoryFallback = new Map<string, string>();

try {
  mmkv = new MMKV({ id: 'medreachplus-storage' });
} catch (e) {
  console.warn('[storage] MMKV failed to initialize (likely Expo Go). Falling back to AsyncStorage.');
}

/**
 * Pre-seed memoryFallback from AsyncStorage so that getSync works across
 * restarts in Expo Go / dev builds where MMKV is unavailable.
 * Call once early in the app lifecycle (before auth restore).
 */
export async function initStorageFallback(): Promise<void> {
  if (mmkv) return; // MMKV available — nothing to do
  try {
    const keys = await AsyncStorage.getAllKeys();
    if (!keys || keys.length === 0) return;
    const pairs = await AsyncStorage.multiGet(keys as string[]);
    for (const [key, value] of pairs) {
      if (value !== null) memoryFallback.set(key, value);
    }
  } catch (e) {
    console.warn('[storage] initStorageFallback failed', e);
  }
}

export interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  /** Synchronous read — use this when awaiting is impractical */
  getSync: (key: string) => string | null;
  /** Synchronous write */
  setSync: (key: string, value: string) => void;
  /** Synchronous delete */
  removeSync: (key: string) => void;
}

const storage: StorageAdapter = {
  // ── Async API (Promise-wrapped for drop-in compatibility) ──────────
  getItem: async (key: string) => {
    try {
      if (mmkv) return mmkv.getString(key) ?? null;
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn('[storage] getItem failed', { key, error });
      return null;
    }
  },

  setItem: async (key: string, value: string) => {
    try {
      if (mmkv) {
        mmkv.set(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
        memoryFallback.set(key, value);
      }
    } catch (error) {
      console.warn('[storage] setItem failed', { key, error });
    }
  },

  removeItem: async (key: string) => {
    try {
      if (mmkv) {
        mmkv.delete(key);
      } else {
        await AsyncStorage.removeItem(key);
        memoryFallback.delete(key);
      }
    } catch (error) {
      console.warn('[storage] removeItem failed', { key, error });
    }
  },

  // ── Synchronous API (preferred on native for token reads) ──────────
  getSync: (key: string) => {
    try {
      if (mmkv) return mmkv.getString(key) ?? null;
      return memoryFallback.get(key) ?? null;
    } catch (error) {
      console.warn('[storage] getSync failed', { key, error });
      return null;
    }
  },

  setSync: (key: string, value: string) => {
    try {
      if (mmkv) {
        mmkv.set(key, value);
      } else {
        memoryFallback.set(key, value);
        // Fire-and-forget sync to persistent async storage
        AsyncStorage.setItem(key, value).catch(() => {});
      }
    } catch (error) {
      console.warn('[storage] setSync failed', { key, error });
    }
  },

  removeSync: (key: string) => {
    try {
      if (mmkv) {
        mmkv.delete(key);
      } else {
        memoryFallback.delete(key);
        AsyncStorage.removeItem(key).catch(() => {});
      }
    } catch (error) {
      console.warn('[storage] removeSync failed', { key, error });
    }
  },
};

export default storage;
