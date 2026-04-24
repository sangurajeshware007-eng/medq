/**
 * Environment Configuration for MedReachPlus
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
}

// ─── Config per environment ──────────────────────────────────────────
const configs: Record<Environment, EnvironmentConfig> = {
    local: {
        env: 'local',
        apiUrl: 'http://localhost:8080',
        enableDebug: true,
        enableApiLogging: true,
        requestTimeoutMs: 15_000,
    },
    qa: {
        env: 'qa',
        apiUrl: 'https://qa-api.medreachplus.com',
        enableDebug: true,
        enableApiLogging: true,
        requestTimeoutMs: 15_000,
    },
    production: {
        env: 'production',
        apiUrl: 'https://api.medreachplus.com',
        enableDebug: false,
        enableApiLogging: false,
        requestTimeoutMs: 10_000,
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
    console.log(`🌐 MedReachPlus Environment: ${ENV.env.toUpperCase()}`);
    console.log(`🔗 API URL: ${ENV.apiUrl}`);
}

export default ENV;
