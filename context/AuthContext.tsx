import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import { Alert } from 'react-native';

import { TokenManager } from '../services/api';
import authService, { AuthError } from '../services/authService';
import type {
  AuthUser,
  CompleteProfileRequest,
  UpdateProfileRequest,
} from '../services/authService';
import { nativeGoogleSignIn, nativeGoogleSignOut } from '../services/googleAuthService';
import { useAuthStore } from '../store/authStore';
import { initStorageFallback } from '../utils/storage';

// ─── Helper ────────────────────────────────────────────────────────────────────
function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AuthError) {
    if (err.status === 423 && err.retryAfterSeconds) {
      return `Too many attempts. Try again in ${err.retryAfterSeconds} seconds.`;
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

// ─── Context type ──────────────────────────────────────────────────────────────
interface AuthContextType {
  isLoggedIn: boolean;
  user: AuthUser | null;
  loading: boolean;
  initializing: boolean;
  pendingPhone: string | null;
  pendingIsTestMode: boolean;
  pendingSocialProfile: { name: string; email?: string } | null;

  // OTP flow (primary)
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (otp: string) => Promise<{ success: boolean; isNewUser?: boolean; error?: string }>;
  completeProfile: (data: CompleteProfileRequest) => Promise<boolean>;

  // Google flow
  signInWithGoogle: () => Promise<{
    success: boolean;
    isNewUser?: boolean;
    cancelled?: boolean;
    error?: string;
  }>;

  // Shared
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<boolean>;
  refreshProfile: () => Promise<void>;

  // Legacy (kept for admin screens)
  signup: (data: {
    name: string;
    phone: string;
    password: string;
    email?: string;
  }) => Promise<boolean>;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  loading: false,
  initializing: true,
  pendingPhone: null,
  pendingIsTestMode: false,
  pendingSocialProfile: null,
  sendOtp: async () => ({ success: false }),
  verifyOtp: async () => ({ success: false }),
  completeProfile: async () => false,
  signInWithGoogle: async () => ({ success: false }),
  logout: async () => {},
  updateProfile: async () => false,
  refreshProfile: async () => {},
  signup: async () => false,
  login: async () => ({ success: false }),
});

// ─── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const {
    isLoggedIn,
    user,
    loading,
    initializing,
    pendingPhone,
    pendingIsTestMode,
    pendingSocialProfile,
    setUser,
    clearUser,
    setLoading,
    setInitializing,
    setPendingOtp,
    clearPendingOtp,
    setPendingSocialProfile,
    clearPendingSocialProfile,
  } = useAuthStore();

  // ── Session restore on app launch ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        // Pre-seed in-memory fallback from AsyncStorage before the sync read below.
        // Required in Expo Go / dev builds where MMKV is unavailable.
        await initStorageFallback();
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

  // ── OTP flow ───────────────────────────────────────────────────────────────

  const sendOtp = useCallback(
    async (phone: string): Promise<{ success: boolean; error?: string }> => {
      setLoading(true);
      try {
        const response = await authService.sendOtp(phone);
        setPendingOtp(phone, response.sessionId, response.isTestMode);
        return { success: true };
      } catch (err: unknown) {
        return {
          success: false,
          error: getErrorMessage(err, 'Unable to send OTP. Please try again.'),
        };
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setPendingOtp],
  );

  const verifyOtp = useCallback(
    async (otp: string): Promise<{ success: boolean; isNewUser?: boolean; error?: string }> => {
      const { pendingPhone: phone, pendingSessionId: sessionId } = useAuthStore.getState();
      if (!phone)
        return { success: false, error: 'Session expired. Please re-enter your phone number.' };

      setLoading(true);
      try {
        const response = await authService.verifyOtp(phone, otp, sessionId ?? undefined);
        clearPendingOtp();

        if (!response.isNewUser) {
          // Returning user — set auth state immediately; layout redirects to tabs
          await new Promise<void>((resolve) => setTimeout(resolve, 0));
          setUser(response.user);
        }
        // New user: tokens stored in TokenManager; caller navigates to complete-profile

        return { success: true, isNewUser: response.isNewUser };
      } catch (err: unknown) {
        const msg = getErrorMessage(err, 'Invalid OTP. Please try again.');
        return { success: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [setLoading, clearPendingOtp, setUser],
  );

  const completeProfile = useCallback(
    async (data: CompleteProfileRequest): Promise<boolean> => {
      setLoading(true);
      try {
        const updated = await authService.completeProfile(data);
        clearPendingSocialProfile();
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
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
        const title =
          err instanceof AuthError && err.code === 'PHONE_ALREADY_EXISTS'
            ? 'Phone Already Registered'
            : 'Profile Error';
        Alert.alert(title, getErrorMessage(err, 'Unable to save profile. Please try again.'));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setUser, clearPendingSocialProfile],
  );

  // ── Google flow ────────────────────────────────────────────────────────────

  const signInWithGoogle = useCallback(async (): Promise<{
    success: boolean;
    isNewUser?: boolean;
    cancelled?: boolean;
    error?: string;
  }> => {
    setLoading(true);
    try {
      const result = await nativeGoogleSignIn();
      if (result.status === 'cancelled') return { success: false, cancelled: true };
      if (result.status === 'error') return { success: false, error: result.message };

      const response = await authService.googleLogin(result.idToken);

      if (response.isNewUser) {
        // Prefill complete-profile with what Google gave us; the caller
        // navigates there. Tokens are already stored by googleLogin.
        setPendingSocialProfile({ name: response.user.name, email: response.user.email });
      } else {
        // Returning user — set auth state; layout redirects to tabs
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        setUser(response.user);
      }

      return { success: true, isNewUser: response.isNewUser };
    } catch (err: unknown) {
      return { success: false, error: getErrorMessage(err, 'Unable to sign in with Google.') };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setUser, setPendingSocialProfile]);

  // ── Shared ─────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    // Sign out of Google too so the account picker shows on next login.
    await nativeGoogleSignOut();
    await authService.logout();
    clearUser();
  }, [clearUser]);

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

  // ── Legacy (password-based) ────────────────────────────────────────────────

  const signup = useCallback(
    async (data: {
      name: string;
      phone: string;
      password: string;
      email?: string;
    }): Promise<boolean> => {
      setLoading(true);
      try {
        const response = await authService.signup(data);
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        setUser(response.user);
        return true;
      } catch (err: unknown) {
        const status = err instanceof AuthError ? err.status : 0;
        const title = status === 409 ? 'Phone Already Registered' : 'Signup Failed';
        Alert.alert(title, getErrorMessage(err, 'Unable to create account.'));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setUser],
  );

  const login = useCallback(
    async (phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setLoading(true);
      try {
        const response = await authService.login({ phone, password });
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        setUser(response.user);
        return { success: true };
      } catch (err: unknown) {
        const status = err instanceof AuthError ? err.status : 0;
        const msg =
          status === 423
            ? getErrorMessage(err, 'Too many attempts. Please try again later.')
            : 'Invalid phone number or password.';
        return { success: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setUser],
  );

  const value = useMemo(
    () => ({
      isLoggedIn,
      user,
      loading,
      initializing,
      pendingPhone,
      pendingIsTestMode,
      pendingSocialProfile,
      sendOtp,
      verifyOtp,
      completeProfile,
      signInWithGoogle,
      logout,
      updateProfile,
      refreshProfile,
      signup,
      login,
    }),
    [
      isLoggedIn,
      user,
      loading,
      initializing,
      pendingPhone,
      pendingIsTestMode,
      pendingSocialProfile,
      sendOtp,
      verifyOtp,
      completeProfile,
      signInWithGoogle,
      logout,
      updateProfile,
      refreshProfile,
      signup,
      login,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
