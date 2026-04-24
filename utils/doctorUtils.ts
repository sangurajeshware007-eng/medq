import { format, addDays, isSameDay, parse, isAfter } from 'date-fns';

export interface DoctorSession {
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isAvailable: boolean;
  sessionName: string;
  sessionType: string;
  hospitalId: string;
  hospitalName: string;
}

export interface DoctorSlot {
  time: string;
  isAvailable: boolean;
  hospitalId: string;
  sessionName: string;
}

/**
 * Generates slots for a given session.
 */
export function generateSlotsFromSession(session: DoctorSession): DoctorSlot[] {
  if (!session.isAvailable) return [];
  
  const slots: DoctorSlot[] = [];
  const start = parse(session.startTime, 'HH:mm', new Date());
  const end = parse(session.endTime, 'HH:mm', new Date());
  
  let current = start;
  while (current < end) {
    slots.push({
      time: format(current, 'HH:mm'),
      isAvailable: true, // For now, assume all slots in an available session are free
      hospitalId: session.hospitalId,
      sessionName: session.sessionName,
    });
    current = addDays(current, 0); // Resetting date part just in case
    current.setMinutes(current.getMinutes() + session.slotDurationMinutes);
  }
  
  return slots;
}

/**
 * Finds the next available slot starting from today.
 */
export function getNextAvailableSlot(sessions: DoctorSession[]): { date: Date; slot: DoctorSlot } | null {
  if (!sessions || sessions.length === 0) return null;

  const today = new Date();
  
  // Check next 7 days
  for (let i = 0; i < 7; i++) {
    const checkDate = addDays(today, i);
    const dayOfWeek = checkDate.getDay();
    
    const daySessions = sessions.filter(s => s.dayOfWeek === dayOfWeek && s.isAvailable);
    
    if (daySessions.length > 0) {
      // Sort sessions by start time
      const sortedSessions = daySessions.sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      for (const session of sortedSessions) {
        const slots = generateSlotsFromSession(session);
        
        // If it's today, only include future slots
        if (i === 0) {
          const nowStr = format(today, 'HH:mm');
          const futureSlots = slots.filter(s => s.time > nowStr);
          if (futureSlots.length > 0) {
            return { date: checkDate, slot: futureSlots[0] };
          }
        } else if (slots.length > 0) {
          return { date: checkDate, slot: slots[0] };
        }
      }
    }
  }
  
  return null;
}

/**
 * Gets slots for a specific date from the available sessions.
 */
export function getSlotsForDate(sessions: DoctorSession[], date: Date): DoctorSlot[] {
  const dayOfWeek = date.getDay();
  const daySessions = sessions.filter(s => s.dayOfWeek === dayOfWeek && s.isAvailable);
  
  const allSlots: DoctorSlot[] = [];
  daySessions.forEach(session => {
    allSlots.push(...generateSlotsFromSession(session));
  });
  
  // If date is today, filter out past slots
  if (isSameDay(date, new Date())) {
    const nowStr = format(new Date(), 'HH:mm');
    return allSlots.filter(s => s.time > nowStr).sort((a, b) => a.time.localeCompare(b.time));
  }
  
  return allSlots.sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Formats experience years into a reader-friendly string.
 */
export function formatExperience(years: number): string {
  return `${years}+ Years Experience`;
}

/**
 * Derives patient count from reviews if not explicitly provided.
 */
export function derivePatientsCount(reviewsCount: number, yearsExp: number): string {
  const base = reviewsCount * 12; // Just a rough heuristic for "premium" feel
  if (base > 1000) return '1,000+';
  if (base > 500) return '500+';
  if (base > 100) return '100+';
  return 'Many Happy Patients';
}
