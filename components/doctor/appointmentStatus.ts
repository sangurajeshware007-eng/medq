/**
 * Shared booking-status display helpers for doctor-side screens
 * (dashboard, live queue, patient history).
 */
import { Colors } from '../../constants/Colors';

export function statusColor(s: string): string {
  switch (s) {
    case 'CONFIRMED':
      return Colors.trustGreen;
    case 'COMPLETED':
      return Colors.primary;
    case 'CANCELLED':
      return Colors.error;
    case 'NO_SHOW':
      return Colors.gold;
    default:
      return Colors.textSecondary;
  }
}

export function statusBg(s: string): string {
  switch (s) {
    case 'CONFIRMED':
      return Colors.trustGreenLight;
    case 'COMPLETED':
      return Colors.primaryLight;
    case 'CANCELLED':
      return Colors.errorLight;
    case 'NO_SHOW':
      return Colors.goldLight;
    default:
      return Colors.borderLight;
  }
}

export function statusLabel(s: string): string {
  switch (s) {
    case 'CONFIRMED':
      return 'Confirmed';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    case 'NO_SHOW':
      return 'No Show';
    default:
      return s;
  }
}

/** Strip non-digits but keep a leading + (Linking accepts either). */
export const sanitizePhone = (raw: string): string => raw.replace(/[^\d+]/g, '');
