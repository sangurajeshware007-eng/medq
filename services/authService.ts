/**
 * Authentication API service — Password-based flow
 *
 * Endpoints (backend: /api/v1/auth):
 *   POST /signup          → Register with name + phone + password
 *   POST /login           → Login with phone + password
 *   POST /refresh-token   → Refresh access token (handled by interceptor)
 *   GET  /me              → Get current user profile
 *   PUT  /profile         → Update user profile
 *   POST /logout          → Logout, invalidate token
 *
 * Response envelope: { success: boolean, data: T, message: string }
 * (envelope is unwrapped by the api.ts interceptor — callers receive T directly)
 *
 * All calls go directly to the backend.
 */
import api, { TokenManager } from './api';
import { API_URL } from '../config/environment';

// ─── Constants ───────────────────────────────────────────────────────────
const BASE = '/api/v1/auth';

// ─── Types ───────────────────────────────────────────────────────────────

export interface SignupRequest {
    name: string;        // 2–100 chars
    phone: string;       // +91XXXXXXXXXX
    password: string;    // min 6 chars
    email?: string;
}

export interface LoginRequest {
    phone: string;
    password: string;
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

export interface RefreshTokenRequest {
    refreshToken: string;
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

export interface UpdateProfileRequest {
    name?: string;
    email?: string;
    preferredLanguage?: 'en' | 'hi' | 'kn';
    locationLat?: number;
    locationLng?: number;
}

// ─── Auth Error ──────────────────────────────────────────────────────────

export class AuthError extends Error {
    status: number;
    /** Seconds until account is unlocked (423 locked) */
    retryAfterSeconds?: number;

    constructor(status: number, message: string, retryAfterSeconds?: number) {
        super(message);
        this.name = 'AuthError';
        this.status = status;
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

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

/** Extracts a user-friendly message from an Axios error */
function extractErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof AuthError) return err.message;
    const axiosErr = err as ApiErrorEnvelope;
    // API envelope: { success, error: { code, message } }
    if (axiosErr.response?.data?.error?.message) return axiosErr.response.data.error.message;
    if (axiosErr.response?.data?.message) return axiosErr.response.data.message;
    if (axiosErr.code === 'ERR_NETWORK') return 'Cannot reach server. Please check your internet connection.';
    if (axiosErr.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
    if (err instanceof Error) return err.message;
    return fallback;
}

/** Extracts the API error code (e.g. PHONE_ALREADY_EXISTS) from an Axios error */
export function extractErrorCode(err: unknown): string | undefined {
    return (err as ApiErrorEnvelope).response?.data?.error?.code;
}

/** Wraps an API call and converts errors to AuthError with proper status codes */
async function authCall<T>(fn: () => Promise<T>, fallbackMsg: string): Promise<T> {
    try {
        return await fn();
    } catch (err: unknown) {
        const axiosErr = err as ApiErrorEnvelope;
        const status = axiosErr.response?.status ?? 0;
        const retryAfter = axiosErr.response?.data?.data?.retryAfterSeconds;
        throw new AuthError(status, extractErrorMessage(err, fallbackMsg), retryAfter);
    }
}

/**
 * Normalizes a phone number to +91XXXXXXXXXX format.
 * Input: "9999999999" | "919999999999" | "+919999999999"
 */
function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
    if (digits.length === 10) return `+91${digits}`;
    return phone.startsWith('+') ? phone : `+${digits}`;
}

// ─── Service Methods ─────────────────────────────────────────────────────

export const authService = {
    /**
     * POST /api/v1/auth/signup
     * Creates a new account. Stores tokens on success.
     *
     * Errors: 400 validation, 409 phone already registered
     */
    signup: async (data: SignupRequest): Promise<AuthResponse> => {
        const payload = { ...data, phone: normalizePhone(data.phone) };
        const response = await authCall(
            () => api.post<AuthResponse>(`${BASE}/signup`, payload),
            'Unable to create account. Please try again.',
        );
        await TokenManager.setTokens(response.accessToken, response.refreshToken);
        return response;
    },

    /**
     * POST /api/v1/auth/login
     * Logs in with phone + password. Stores tokens on success.
     *
     * Errors: 400 validation, 401 wrong credentials, 423 account locked (5 attempts)
     */
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const payload = { ...data, phone: normalizePhone(data.phone) };
        const response = await authCall(
            () => api.post<AuthResponse>(`${BASE}/login`, payload),
            'Invalid phone number or password.',
        );
        await TokenManager.setTokens(response.accessToken, response.refreshToken);
        return response;
    },

    /**
     * POST /api/v1/auth/refresh-token
     * Exchanges refreshToken for new token pair.
     * NOTE: Usually called automatically by the 401 interceptor in api.ts.
     */
    refreshToken: async (): Promise<RefreshTokenResponse> => {
        const currentRefresh = await TokenManager.getRefreshToken();
        if (!currentRefresh) throw new AuthError(401, 'No refresh token available.');
        const response = await authCall(
            () => api.post<RefreshTokenResponse>(`${BASE}/refresh-token`, { refreshToken: currentRefresh }),
            'Session expired. Please login again.',
        );
        await TokenManager.setTokens(response.accessToken, response.refreshToken);
        return response;
    },

    /**
     * GET /api/v1/auth/me
     * Returns current user profile. Requires auth.
     */
    getProfile: (): Promise<UserProfile> =>
        authCall(() => api.get<UserProfile>(`${BASE}/me`), 'Unable to fetch profile.'),

    /**
     * PUT /api/v1/auth/profile
     * Updates user profile fields. Requires auth.
     */
    updateProfile: (data: UpdateProfileRequest): Promise<UserProfile> =>
        authCall(() => api.put<UserProfile>(`${BASE}/profile`, data), 'Unable to update profile.'),

    /**
     * POST /api/v1/auth/logout
     * Invalidates refresh token on server, clears tokens locally.
     * Uses raw axios (bypasses interceptors) to avoid 401 refresh loops.
     */
    logout: async (): Promise<void> => {
        const refreshToken = await TokenManager.getRefreshToken();
        // Clear tokens locally FIRST — ensures the user is logged out even if the API call fails
        await TokenManager.clearTokens();
        // Then try to invalidate on the server (best-effort, bypass interceptors)
        if (refreshToken) {
            try {
                const axios = (await import('axios')).default;
                await axios.post(
                    `${API_URL}${BASE}/logout`,
                    { refreshToken },
                    { headers: { 'Content-Type': 'application/json' }, timeout: 5000 },
                );
            } catch {
                // Silently ignore — tokens are already cleared locally
            }
        }
    },
};

export default authService;

// ─── Future: OTP-based authentication ────────────────────────────────────
// These endpoints exist on the backend but are not implemented yet.
// Uncomment and implement when OTP flow is needed.
//
// /** POST /api/v1/auth/send-otp */
// sendOtp: async (phone: string): Promise<{ message: string; sessionId?: string }> => {
//     return authCall(
//         () => api.post(`${BASE}/send-otp`, { phone: normalizePhone(phone) }),
//         'Unable to send OTP.',
//     );
// },
//
// /** POST /api/v1/auth/verify-otp */
// verifyOtp: async (phone: string, otp: string): Promise<AuthResponse> => {
//     const response = await authCall(
//         () => api.post<AuthResponse>(`${BASE}/verify-otp`, { phone: normalizePhone(phone), otp }),
//         'Invalid OTP.',
//     );
//     await TokenManager.setTokens(response.accessToken, response.refreshToken);
//     return response;
// },

