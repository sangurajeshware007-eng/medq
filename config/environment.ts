/**
 * Environment Configuration for MedQ+
 *
 * Supports three environments: local, qa, production.
 *
 * HOW IT WORKS:
 * ─────────────
 * 1. Expo reads EXPO_PUBLIC_* vars from the active .env file
 * 2. This module picks up those values via process.env
 * 3. Falls back to sensible defaults based on __DEV__
 *
 * HOW TO SWITCH ENVIRONMENTS:
 * ───────────────────────────
 *   npm run start:local       →  uses .env.local
 *   npm run start:qa          →  uses .env.qa
 *   npm run start:production  →  uses .env.production
 */

// ─── Environment Type ────────────────────────────────────────────────
export type Environment = 'local' | 'qa' | 'production';

// ─── Per-environment configuration ───────────────────────────────────
export interface EnvironmentConfig {
  /** Current environment name */
  env: Environment;
  /** Base URL for all API requests */
  apiUrl: string;
  /** Whether to show debug info in the UI */
  enableDebug: boolean;
  /** Whether to log API requests/responses in the console */
  enableApiLogging: boolean;
  /** Request timeout in milliseconds */
  requestTimeoutMs: number;
  /** Google OAuth web client ID — audience of the ID token sent to the backend */
  googleWebClientId: string;
  /** Google OAuth iOS client ID — required by the iOS SDK when not using a Firebase plist */
  googleIosClientId: string;
  /** Whether the phone/OTP login UI is shown (hidden at launch; re-enabled when OTP goes live) */
  enableOtpLogin: boolean;
}

// ─── Config per environment ──────────────────────────────────────────
const configs: Record<Environment, EnvironmentConfig> = {
  local: {
    env: 'local',
    apiUrl: 'http://localhost:8080',
    enableDebug: true,
    enableApiLogging: true,
    requestTimeoutMs: 15_000,
    googleWebClientId: '',
    googleIosClientId: '',
    enableOtpLogin: false,
  },
  qa: {
    env: 'qa',
    apiUrl: 'https://qa-api.medreachplus.com',
    enableDebug: true,
    enableApiLogging: true,
    requestTimeoutMs: 15_000,
    googleWebClientId: '',
    googleIosClientId: '',
    enableOtpLogin: false,
  },
  production: {
    env: 'production',
    apiUrl: 'https://api.medreachplus.com',
    enableDebug: false,
    enableApiLogging: false,
    requestTimeoutMs: 10_000,
    googleWebClientId: '',
    googleIosClientId: '',
    enableOtpLogin: false,
  },
};

// ─── Resolve current environment ─────────────────────────────────────

function resolveEnvironment(): Environment {
  // 1. Prefer explicit EXPO_PUBLIC_ENV from .env file
  const envFromFile = process.env.EXPO_PUBLIC_ENV as Environment | undefined;
  if (envFromFile && configs[envFromFile]) {
    return envFromFile;
  }

  // 2. Fallback: __DEV__ → local, otherwise → production
  return __DEV__ ? 'local' : 'production';
}

function resolveConfig(): EnvironmentConfig {
  const env = resolveEnvironment();
  const config = { ...configs[env] };

  // Override apiUrl if explicitly set via EXPO_PUBLIC_API_URL
  const explicitUrl = process.env.EXPO_PUBLIC_API_URL;
  if (explicitUrl) {
    config.apiUrl = explicitUrl;
  }

  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (googleWebClientId) {
    config.googleWebClientId = googleWebClientId;
  }

  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (googleIosClientId) {
    config.googleIosClientId = googleIosClientId;
  }

  config.enableOtpLogin = process.env.EXPO_PUBLIC_ENABLE_OTP_LOGIN === 'true';

  return config;
}

// ─── Exported singleton ──────────────────────────────────────────────

/** The active environment configuration */
export const ENV: EnvironmentConfig = resolveConfig();

/** Shortcut to the current environment name */
export const CURRENT_ENV: Environment = ENV.env;

/** Shortcut to the current API base URL */
export const API_URL: string = ENV.apiUrl;

// Log environment info in dev mode
if (ENV.enableDebug) {
  console.log(`🌐 MedQ+ Environment: ${ENV.env.toUpperCase()}`);
  console.log(`🔗 API URL: ${ENV.apiUrl}`);
}

export default ENV;
