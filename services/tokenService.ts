/**
 * Token Tracker API service
 *
 * Endpoints (backend: /api/v1/tokens):
 *   GET  /doctor/{id}/live      → Live queue state
 *   GET  /my-token/{bookingId}  → My token position & wait time
 *
 * WebSocket: ws://localhost:8080/ws → Subscribe: /topic/tokens/{doctorId}
 */
import api from './api';

// ─── Types ───────────────────────────────────────────────────────────────

export interface LiveQueueState {
    doctorId: number;
    doctorName: string;
    currentToken: number;
    totalTokens: number;
    estimatedWaitMinutes: number;
    lastUpdated: string;
}

export interface MyTokenPosition {
    bookingId: number;
    tokenNumber: number;
    currentToken: number;
    position: number;
    estimatedWaitMinutes: number;
    status: 'waiting' | 'next' | 'current' | 'done';
}

// ─── Constants ───────────────────────────────────────────────────────────
const BASE = '/api/v1/tokens';

// ─── Service Methods ─────────────────────────────────────────────────────

export const tokenService = {
    /** GET /api/v1/tokens/doctor/{id}/live — live queue state */
    getLiveQueue: (doctorId: number | string): Promise<LiveQueueState> =>
        api.get<LiveQueueState>(`${BASE}/doctor/${doctorId}/live`),

    /** GET /api/v1/tokens/my-token/{bookingId} — my token position */
    getMyToken: (bookingId: number | string): Promise<MyTokenPosition> =>
        api.get<MyTokenPosition>(`${BASE}/my-token/${bookingId}`),
};

export default tokenService;

