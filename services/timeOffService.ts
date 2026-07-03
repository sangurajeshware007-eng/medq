/**
 * Doctor time-off API service.
 *
 * Endpoints:
 *   GET    /api/v1/doctor/profile/time-off
 *   POST   /api/v1/doctor/profile/time-off
 *   DELETE /api/v1/doctor/profile/time-off/:id
 *
 * Auth: doctor role required (server-enforced via @PreAuthorize).
 */
import api from './api';

const BASE = '/api/v1/doctor/profile/time-off';

export interface TimeOffEntry {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  reason?: string | null;
  affectedBookingsCount: number;
}

export interface CreateTimeOffRequest {
  startDate: string;
  endDate: string;
  reason?: string;
}

export const timeOffService = {
  list: (): Promise<TimeOffEntry[]> => api.get<TimeOffEntry[]>(BASE),

  create: (data: CreateTimeOffRequest): Promise<TimeOffEntry> =>
    api.post<TimeOffEntry>(BASE, data),

  remove: (id: string): Promise<void> => api.delete<void>(`${BASE}/${id}`),
};

export default timeOffService;
