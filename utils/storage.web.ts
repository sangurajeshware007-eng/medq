/**
 * Web storage utility — backed by window.localStorage
 *
 * Metro resolves this file instead of storage.ts on web, so the web bundle
 * never imports react-native-mmkv (a native-only JSI module).
 *
 * localStorage is synchronous, so getSync/setSync work on the first tick —
 * including the cold-load refresh-token read in services/api.ts.
 *
 * Falls back to an in-memory map when localStorage is unavailable
 * (Safari private mode, storage quota errors): the session then lasts
 * only for the current tab.
 */

let localStorageAvailable = false;
const memoryFallback = new Map<string, string>();

try {
  const probe = '__medq_storage_probe__';
  window.localStorage.setItem(probe, '1');
  window.localStorage.removeItem(probe);
  localStorageAvailable = true;
} catch {
  console.warn(
    '[storage] localStorage unavailable (private mode?). Falling back to in-memory storage.',
  );
}

/**
 * No-op on web: localStorage is synchronous, so there is nothing to pre-seed.
 * Kept so call sites (e.g. AuthContext) work unchanged across platforms.
 */
export async function initStorageFallback(): Promise<void> {
  // intentionally empty
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

function read(key: string): string | null {
  try {
    if (localStorageAvailable) return window.localStorage.getItem(key);
    return memoryFallback.get(key) ?? null;
  } catch (error) {
    console.warn('[storage] read failed', { key, error });
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    if (localStorageAvailable) {
      window.localStorage.setItem(key, value);
    } else {
      memoryFallback.set(key, value);
    }
  } catch (error) {
    console.warn('[storage] write failed', { key, error });
  }
}

function remove(key: string): void {
  try {
    if (localStorageAvailable) {
      window.localStorage.removeItem(key);
    } else {
      memoryFallback.delete(key);
    }
  } catch (error) {
    console.warn('[storage] remove failed', { key, error });
  }
}

const storage: StorageAdapter = {
  getItem: async (key: string) => read(key),
  setItem: async (key: string, value: string) => write(key, value),
  removeItem: async (key: string) => remove(key),
  getSync: read,
  setSync: write,
  removeSync: remove,
};

export default storage;
