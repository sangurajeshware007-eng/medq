import React, { createContext, useContext, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import { Alert } from 'react-native';

import authService, { AuthError, extractErrorCode } from '../services/authService';
import type { AuthUser, SignupRequest, UpdateProfileRequest } from '../services/authService';
import { TokenManager } from '../services/api';
import { useAuthStore } from '../store/authStore';

// ─── Helper ───────────────────────────────────────────────────────────────
function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AuthError) {
    if (err.status === 423 && err.retryAfterSeconds) {
      return `Too many attempts. Try again in ${err.retryAfterSeconds} seconds.`;
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return fallback;
}

// ─── Context type ─────────────────────────────────────────────────────────
interface AuthContextType {
  isLoggedIn: boolean;
  user: AuthUser | null;
  loading: boolean;
  initializing: boolean;
  signup: (data: SignupRequest) => Promise<boolean>;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  loading: false,
  initializing: true,
  signup: async () => false,
  login: async () => ({ success: false }),
  logout: async () => {},
  updateProfile: async () => false,
  refreshProfile: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────
export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  // Read/write Zustand store — no local useState needed
  const { isLoggedIn, user, loading, initializing, setUser, clearUser, setLoading, setInitializing } =
    useAuthStore();

  // ── Restore session on mount ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const refreshToken = await TokenManager.getRefreshToken();
        if (!refreshToken) return;
        await authService.refreshToken();
        const profile = await authService.getProfile();
        setUser({
          id: profile.id,
          name: profile.name,
          phone: profile.phone,
          email: profile.email,
          role: profile.role,
          preferredLanguage: profile.preferredLanguage,
        });
      } catch {
        await TokenManager.clearTokens();
      } finally {
        setInitializing(false);
      }
    })();
  }, [setUser, setInitializing]);

  // ── Signup ────────────────────────────────────────────────────────
  const signup = useCallback(
    async (data: SignupRequest): Promise<boolean> => {
      setLoading(true);
      try {
        const response = await authService.signup(data);
        setUser(response.user);
        return true;
      } catch (err: unknown) {
        const status = err instanceof AuthError ? err.status : 0;
        const title = status === 409 ? 'Phone Already Registered' : 'Signup Failed';
        Alert.alert(title, getErrorMessage(err, 'Unable to create account. Please try again.'));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setUser],
  );

  // ── Login ─────────────────────────────────────────────────────────
  const login = useCallback(
    async (phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setLoading(true);
      try {
        const response = await authService.login({ phone, password });
        setUser(response.user);
        return { success: true };
      } catch (err: unknown) {
        const status = err instanceof AuthError ? err.status : 0;
        let errorMsg = getErrorMessage(err, 'Invalid phone number or password.');
        if (status === 423) errorMsg = getErrorMessage(err, 'Too many attempts. Please try again later.');
        else if (status === 401) errorMsg = 'Invalid phone number or password. Please try again.';
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setUser],
  );

  // ── Logout ────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authService.logout();
    clearUser();
  }, [clearUser]);

  // ── Update Profile ────────────────────────────────────────────────
  const updateProfile = useCallback(
    async (data: UpdateProfileRequest): Promise<boolean> => {
      setLoading(true);
      try {
        const updated = await authService.updateProfile(data);
        setUser({
          id: updated.id,
          name: updated.name,
          phone: updated.phone,
          email: updated.email,
          role: updated.role,
          preferredLanguage: updated.preferredLanguage,
        });
        return true;
      } catch (err: unknown) {
        Alert.alert('Update Failed', getErrorMessage(err, 'Unable to update profile.'));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setUser],
  );

  // ── Refresh Profile ───────────────────────────────────────────────
  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      setUser({
        id: profile.id,
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        role: profile.role,
        preferredLanguage: profile.preferredLanguage,
      });
    } catch {
      // Silently fail — user sees stale data
    }
  }, [setUser]);

  const value = useMemo(
    () => ({ isLoggedIn, user, loading, initializing, signup, login, logout, updateProfile, refreshProfile }),
    [isLoggedIn, user, loading, initializing, signup, login, logout, updateProfile, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
