/**
 * Auth Zustand Store
 *
 * Replaces local useState inside AuthContext.
 * AuthContext now reads/writes this store — zero breaking changes.
 *
 * Why Zustand over Context:
 *  - No re-render for the whole tree when auth state changes
 *  - Subscribable from anywhere without hooks (services, interceptors)
 *  - Zero boilerplate vs useReducer
 */
import { create } from 'zustand';

import type { AuthUser } from '../services/authService';

interface AuthState {
  isLoggedIn: boolean;
  user: AuthUser | null;
  loading: boolean;
  initializing: boolean;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setInitializing: (initializing: boolean) => void;
}

// Zustand v5: use curried create<T>()(...) for proper TypeScript inference in strict mode
export const useAuthStore = create<AuthState>()((set) => ({
  isLoggedIn: false,
  user: null,
  loading: false,
  initializing: true,

  setUser: (user: AuthUser) => set({ user, isLoggedIn: true }),
  clearUser: () => set({ user: null, isLoggedIn: false }),
  setLoading: (loading: boolean) => set({ loading }),
  setInitializing: (initializing: boolean) => set({ initializing }),
}));

/** Read auth state outside React (e.g. in Axios interceptors) */
export const getAuthState = () => useAuthStore.getState();
