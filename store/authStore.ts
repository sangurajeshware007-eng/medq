import { create } from 'zustand';
import type { AuthUser } from '../services/authService';

interface AuthState {
  // ── Session state ─────────────────────────────────────────────────────────
  isLoggedIn: boolean;
  user: AuthUser | null;
  loading: boolean;
  initializing: boolean;

  // ── OTP flow — transient state while the user is mid-authentication ────────
  // Cleared as soon as verifyOtp completes (success or failure).
  pendingPhone: string | null;
  pendingSessionId: string | null;
  pendingIsTestMode: boolean;

  // ── Actions ───────────────────────────────────────────────────────────────
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setInitializing: (initializing: boolean) => void;
  setPendingOtp: (phone: string, sessionId: string, isTestMode: boolean) => void;
  clearPendingOtp: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isLoggedIn: false,
  user: null,
  loading: false,
  initializing: true,

  pendingPhone: null,
  pendingSessionId: null,
  pendingIsTestMode: false,

  setUser: (user) => set({ user, isLoggedIn: true }),
  clearUser: () => set({ user: null, isLoggedIn: false }),
  setLoading: (loading) => set({ loading }),
  setInitializing: (initializing) => set({ initializing }),

  setPendingOtp: (phone, sessionId, isTestMode) =>
    set({ pendingPhone: phone, pendingSessionId: sessionId, pendingIsTestMode: isTestMode }),
  clearPendingOtp: () =>
    set({ pendingPhone: null, pendingSessionId: null, pendingIsTestMode: false }),
}));

/** Read auth state outside React (e.g. in Axios interceptors) */
export const getAuthState = () => useAuthStore.getState();
