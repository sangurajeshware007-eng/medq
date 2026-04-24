/**
 * Core API client for MedReachPlus
 *
 * - Axios instance with base URL, timeout, content-type headers
 * - TokenManager: stores accessToken in-memory, refreshToken in AsyncStorage
 * - Request interceptor: injects Bearer token
 * - Response interceptor: unwraps { success, data, message } envelope,
 *   detects 401 → attempts silent token refresh → retries original request
 */
import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { API_URL, ENV } from '../config/environment';
import storage from '../utils/storage';
import { getAuthState } from '../store/authStore';

// ─── Axios Instance ──────────────────────────────────────────────────────
const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: ENV.requestTimeoutMs,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// ─── Token Manager ───────────────────────────────────────────────────────
// accessToken lives in memory (fast, secure, cleared on app restart)
// refreshToken lives in persistent storage (AsyncStorage on native, localStorage on web)

let inMemoryAccessToken: string | null = null;

export const TokenManager = {
    setTokens: (accessToken: string, refreshToken: string) => {
        inMemoryAccessToken = accessToken;
        // MMKV is synchronous — no await needed
        storage.setSync('refreshToken', refreshToken);
    },
    getAccessToken: (): string | null => inMemoryAccessToken,
    /** Sync read — MMKV is native-synchronous */
    getRefreshToken: (): string | null => storage.getSync('refreshToken'),
    /** Async version kept for call sites that already await it */
    getRefreshTokenAsync: async (): Promise<string | null> => storage.getSync('refreshToken'),
    clearTokens: () => {
        inMemoryAccessToken = null;
        storage.removeSync('refreshToken');
    },
};

// ─── Request Interceptor (inject auth token + log) ───────────────────────
axiosInstance.interceptors.request.use((config) => {
    const token = TokenManager.getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // ── Request Logging ──────────────────────────────────────────────
    if (ENV.enableApiLogging) {
        const method = (config.method || 'GET').toUpperCase();
        const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
        const params = config.params ? JSON.stringify(config.params) : undefined;
        const body = config.data ? JSON.stringify(config.data) : undefined;

        console.log(
            `\n🌐 ─── API REQUEST ───────────────────────────────────────\n` +
            `  ➤ ${method} ${fullUrl}\n` +
            (params ? `  📋 Params: ${params}\n` : '') +
            (body ? `  📦 Body:   ${body}\n` : '') +
            (token ? `  🔑 Auth:   Bearer ***${token.slice(-8)}\n` : '  🔓 Auth:   None\n') +
            `──────────────────────────────────────────────────────────`
        );
    }

    return config;
});

// ─── Response Interceptor ────────────────────────────────────────────────
// 1. Log the response/error
// 2. Unwrap the backend's standard envelope: { success, data, message }
// 3. On 401: attempt silent refresh, then retry the original request once

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
    refreshSubscribers.push(cb);
}

function onTokenRefreshed(newToken: string) {
    refreshSubscribers.forEach((cb) => cb(newToken));
    refreshSubscribers = [];
}

axiosInstance.interceptors.response.use(
    // Success — log + unwrap the envelope
    (response) => {
        const body = response.data;

        // ── Response Logging ─────────────────────────────────────────
        if (ENV.enableApiLogging) {
            const method = (response.config.method || 'GET').toUpperCase();
            const url = response.config.url || '';
            const status = response.status;
            const dataPreview = JSON.stringify(body)?.slice(0, 500);

            console.log(
                `\n✅ ─── API RESPONSE ──────────────────────────────────────\n` +
                `  ➤ ${method} ${url}\n` +
                `  📊 Status: ${status}\n` +
                `  📦 Data:   ${dataPreview}${(dataPreview?.length || 0) >= 500 ? '…' : ''}\n` +
                `──────────────────────────────────────────────────────────`
            );
        }

        // If the response follows { success, data, message } shape, unwrap .data
        if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
            return body.data;
        }
        // Otherwise return as-is (for non-standard endpoints)
        return body;
    },
    // Error handler
    async (error) => {
        // ── Error Logging ────────────────────────────────────────────
        if (ENV.enableApiLogging) {
            const method = (error.config?.method || 'GET').toUpperCase();
            const url = error.config?.url || 'unknown';
            const status = error.response?.status || 'NETWORK_ERROR';
            const errBody = error.response?.data;
            const errMessage = errBody?.message || error.message || 'Unknown error';
            const errPreview = errBody ? JSON.stringify(errBody).slice(0, 500) : 'N/A';

            console.error(
                `\n❌ ─── API ERROR ─────────────────────────────────────────\n` +
                `  ➤ ${method} ${url}\n` +
                `  📊 Status:  ${status}\n` +
                `  💬 Message: ${errMessage}\n` +
                `  📦 Body:    ${errPreview}\n` +
                `──────────────────────────────────────────────────────────`
            );
        }

        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // ── 401 Unauthorized → try refreshing ────────────────────────
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    const refreshToken = TokenManager.getRefreshToken(); // sync MMKV read
                    if (!refreshToken) {
                        TokenManager.clearTokens();
                        getAuthState().clearUser();
                        const sessionError: ApiError = { status: 401, message: 'Session expired. Please login again.' };
                        throw sessionError;
                    }

                    // Call refresh-token endpoint directly (bypass interceptors)
                    const refreshResponse = await axios.post(
                        `${API_URL}/api/v1/auth/refresh-token`,
                        { refreshToken },
                        { headers: { 'Content-Type': 'application/json' } },
                    );

                    const refreshData = refreshResponse.data?.data ?? refreshResponse.data;
                    const newAccessToken = refreshData.accessToken;
                    const newRefreshToken = refreshData.refreshToken;

                    TokenManager.setTokens(newAccessToken, newRefreshToken);
                    onTokenRefreshed(newAccessToken);
                } catch (refreshErr) {
                    TokenManager.clearTokens();
                    getAuthState().clearUser();
                    refreshSubscribers = [];
                    const sessionError: ApiError = { status: 401, message: 'Session expired. Please login again.' };
                    throw sessionError;
                } finally {
                    isRefreshing = false;
                }
            }

            // Queue this request until token is refreshed
            return new Promise((resolve) => {
                subscribeTokenRefresh((newToken: string) => {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    resolve(axiosInstance(originalRequest));
                });
            });
        }

        throw error;
    },
);

// ─── Types ───────────────────────────────────────────────────────────────

/** Standard backend error shape */
export interface ApiError {
    status: number;
    message: string;
    data?: unknown;
}

/** Standard backend response envelope */
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

// ─── Typed API wrapper ───────────────────────────────────────────────────

/** Typed HTTP client interface — all methods return unwrapped T directly */
export interface ApiClient {
    get: <T>(url: string, config?: AxiosRequestConfig) => Promise<T>;
    post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>;
    put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>;
    patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>;
    delete: <T>(url: string, config?: AxiosRequestConfig) => Promise<T>;
}

/**
 * Typed wrapper around axiosInstance.
 * The response interceptor unwraps the envelope, so callers receive T directly.
 */
const api: ApiClient = {
    get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
        axiosInstance.get(url, config) as unknown as Promise<T>,

    post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
        axiosInstance.post(url, data, config) as unknown as Promise<T>,

    put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
        axiosInstance.put(url, data, config) as unknown as Promise<T>,

    patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
        axiosInstance.patch(url, data, config) as unknown as Promise<T>,

    delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
        axiosInstance.delete(url, config) as unknown as Promise<T>,
};

/**
 * Raw API client — returns the FULL response body without unwrapping.
 * Use for paginated endpoints where you need both `data` and `meta`.
 *
 * The standard `api` interceptor strips the envelope, returning only `.data`.
 * `apiRaw` fetches via the same authenticated axiosInstance but
 * manually extracts `response.data` (the HTTP body) before the interceptor
 * can unwrap it further.
 */
export const apiRaw: Pick<ApiClient, 'get'> = {
    get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
        const response = await axios.get(url, {
            ...config,
            baseURL: axiosInstance.defaults.baseURL,
            timeout: axiosInstance.defaults.timeout,
            headers: {
                ...axiosInstance.defaults.headers.common,
                ...axiosInstance.defaults.headers.get,
                ...config?.headers,
                Authorization: TokenManager.getAccessToken()
                    ? `Bearer ${TokenManager.getAccessToken()}`
                    : undefined,
            } as Record<string, string | undefined>,
        });
        return response.data as T;
    },
};

export default api;
