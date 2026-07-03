/**
 * Authentication API service
 *
 * Primary flow  (OTP-based):
 *   POST /send-otp          → Send OTP to phone number
 *   POST /verify-otp        → Verify OTP; returns isNewUser flag + JWT tokens
 *   PUT  /complete-profile  → New users supply name + email after first login
 *
 * Shared:
 *   POST /refresh-token     → Rotate JWT pair (called by 401 interceptor)
 *   GET  /me                → Current user profile
 *   PUT  /profile           → Update profile fields
 *   POST /logout            → Invalidate refresh token
 *
 * Legacy (kept for admin/backward compat):
 *   POST /signup            → Register with phone + password
 *   POST /login             → Login with phone + password
 */
import { API_URL } from '../config/environment';

import api, { TokenManager } from './api';

const BASE = '/api/v1/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendOtpResponse {
  sessionId: string;
  message: string;
  isTestMode: boolean;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
  sessionId?: string;
}

export interface CompleteProfileRequest {
  name: string;
  email?: string;
  preferredLanguage?: 'en' | 'hi' | 'kn';
  /** Required for Google-created accounts (they sign in without a phone). */
  phone?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  preferredLanguage: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  user: AuthUser;
}

export interface SignupRequest {
  name: string;
  phone: string;
  password: string;
  email?: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  preferredLanguage: string;
  locationLat?: number;
  locationLng?: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  preferredLanguage?: 'en' | 'hi' | 'kn';
  locationLat?: number;
  locationLng?: number;
}

// ─── Auth Error ───────────────────────────────────────────────────────────────

export class AuthError extends Error {
  status: number;
  code?: string;
  retryAfterSeconds?: number;

  constructor(status: number, message: string, code?: string, retryAfterSeconds?: number) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

type ApiErrorEnvelope = {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: { code?: string; message?: string };
      data?: { retryAfterSeconds?: number };
    };
  };
  code?: string;
};

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AuthError) return err.message;
  const axiosErr = err as ApiErrorEnvelope;
  if (axiosErr.response?.data?.error?.message) return axiosErr.response.data.error.message;
  if (axiosErr.response?.data?.message) return axiosErr.response.data.message;
  if (axiosErr.code === 'ERR_NETWORK')
    return 'Cannot reach server. Check your internet connection.';
  if (axiosErr.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
  if (err instanceof Error) return err.message;
  return fallback;
}

function extractErrorCode(err: unknown): string | undefined {
  return (err as ApiErrorEnvelope).response?.data?.error?.code;
}

async function authCall<T>(fn: () => Promise<T>, fallbackMsg: string): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const axiosErr = err as ApiErrorEnvelope;
    const status = axiosErr.response?.status ?? 0;
    const code = extractErrorCode(err);
    const retryAfter = axiosErr.response?.data?.data?.retryAfterSeconds;
    throw new AuthError(status, extractErrorMessage(err, fallbackMsg), code, retryAfter);
  }
}

/**
 * Sentinel phones ("PENDING-…" for Google users mid-onboarding,
 * "DELETED-…" for anonymized accounts) are not real numbers — hide them.
 */
export function displayPhone(phone?: string): string | null {
  if (!phone || phone.startsWith('PENDING-') || phone.startsWith('DELETED-')) return null;
  return phone;
}

/** Normalizes any phone input to +91XXXXXXXXXX */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return phone.startsWith('+') ? phone : `+${digits}`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const authService = {
  // ── OTP flow ────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/auth/send-otp
   * Sends a 6-digit OTP via SMS. Works for new and returning users.
   * Returns isTestMode=true in dev/local or for the test bypass number.
   */
  sendOtp: (phone: string): Promise<SendOtpResponse> =>
    authCall(
      () => api.post<SendOtpResponse>(`${BASE}/send-otp`, { phone: normalizePhone(phone) }),
      'Unable to send OTP. Please try again.',
    ),

  /**
   * POST /api/v1/auth/verify-otp
   * Verifies the OTP. Stores JWT tokens on success.
   * isNewUser=true → call completeProfile() next.
   * isNewUser=false → user is fully logged in.
   */
  verifyOtp: async (phone: string, otp: string, sessionId?: string): Promise<AuthResponse> => {
    const response = await authCall(
      () =>
        api.post<AuthResponse>(`${BASE}/verify-otp`, {
          phone: normalizePhone(phone),
          otp,
          ...(sessionId ? { sessionId } : {}),
        }),
      'Invalid OTP. Please try again.',
    );
    await TokenManager.setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  // ── Social (Google) flow ────────────────────────────────────────────────────

  /**
   * POST /api/v1/auth/social/google
   * Exchanges a Google ID token for our JWT pair. Stores tokens on success.
   * isNewUser=true → call completeProfile() with name + phone next.
   */
  googleLogin: async (idToken: string): Promise<AuthResponse> => {
    const response = await authCall(
      () => api.post<AuthResponse>(`${BASE}/social/google`, { idToken }),
      'Unable to sign in with Google. Please try again.',
    );
    await TokenManager.setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  /**
   * PUT /api/v1/auth/complete-profile
   * Called once after a new user's first login (OTP or Google).
   * Google users must include their phone. Requires auth.
   */
  completeProfile: (data: CompleteProfileRequest): Promise<UserProfile> =>
    authCall(
      () => api.put<UserProfile>(`${BASE}/complete-profile`, data),
      'Unable to save profile. Please try again.',
    ),

  // ── Shared ──────────────────────────────────────────────────────────────────

  refreshToken: async (): Promise<RefreshTokenResponse> => {
    const currentRefresh = await TokenManager.getRefreshToken();
    if (!currentRefresh) throw new AuthError(401, 'No refresh token available.');
    const response = await authCall(
      () =>
        api.post<RefreshTokenResponse>(`${BASE}/refresh-token`, { refreshToken: currentRefresh }),
      'Session expired. Please login again.',
    );
    await TokenManager.setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  getProfile: (): Promise<UserProfile> =>
    authCall(() => api.get<UserProfile>(`${BASE}/me`), 'Unable to fetch profile.'),

  updateProfile: (data: UpdateProfileRequest): Promise<UserProfile> =>
    authCall(() => api.put<UserProfile>(`${BASE}/profile`, data), 'Unable to update profile.'),

  logout: async (): Promise<void> => {
    const refreshToken = await TokenManager.getRefreshToken();
    await TokenManager.clearTokens();
    if (refreshToken) {
      try {
        const axios = (await import('axios')).default;
        await axios.post(
          `${API_URL}${BASE}/logout`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' }, timeout: 5000 },
        );
      } catch {
        // Silently ignore — tokens already cleared locally
      }
    }
  },

  // ── Self-service lifecycle ──────────────────────────────────────────────────

  /**
   * POST /api/v1/auth/deactivate-profile
   * Reversible: server hides account + Doctor row, cancels upcoming bookings,
   * revokes all refresh tokens. Logging in again restores the account.
   */
  deactivateProfile: (reason?: string): Promise<void> =>
    authCall(
      () => api.post<void>(`${BASE}/deactivate-profile`, { reason }),
      'Unable to deactivate account. Please try again.',
    ),

  /**
   * POST /api/v1/auth/delete-profile
   * Irreversible: server anonymizes personal fields and marks account inactive.
   * `confirmPhone` must match the current user's phone (server enforces).
   */
  deleteProfile: (confirmPhone: string, reason?: string): Promise<void> =>
    authCall(
      () => api.post<void>(`${BASE}/delete-profile`, { confirmPhone, reason }),
      'Unable to delete account. Please try again.',
    ),

  // ── Legacy (password-based) ──────────────────────────────────────────────────

  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const payload = { ...data, phone: normalizePhone(data.phone) };
    const response = await authCall(
      () => api.post<AuthResponse>(`${BASE}/signup`, payload),
      'Unable to create account. Please try again.',
    );
    await TokenManager.setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const payload = { ...data, phone: normalizePhone(data.phone) };
    const response = await authCall(
      () => api.post<AuthResponse>(`${BASE}/login`, payload),
      'Invalid phone number or password.',
    );
    await TokenManager.setTokens(response.accessToken, response.refreshToken);
    return response;
  },
};

export default authService;
