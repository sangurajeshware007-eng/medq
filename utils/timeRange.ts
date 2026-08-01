/**
 * timeRange — pure math for the draggable session time-range slider.
 *
 * Values are minutes-since-midnight snapped to a 15-minute grid; "HH:mm"
 * strings only exist at the component boundary. No React Native imports —
 * everything here is unit-testable in isolation.
 */

export const STEP = 15;
export const DAY_MINUTES = 1440;
/** Latest representable end — Java LocalTime can't parse "24:00", and 23:45 stays on-grid. */
export const MAX_END = 1425;
export const MIN_DURATION = 15;

export type DragMode = 'start' | 'end' | 'range';

export interface RangeMin {
  start: number;
  end: number;
}

export interface BlockedInterval {
  startMin: number;
  endMin: number;
  label: string;
  hospitalName?: string;
}

/** "09:30" → 570 */
export const timeToMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** 570 → "09:30" (zero-padded) */
export const minutesToTime = (m: number): string => {
  const h = Math.floor(m / 60)
    .toString()
    .padStart(2, '0');
  const mm = (m % 60).toString().padStart(2, '0');
  return `${h}:${mm}`;
};

export const snapToStep = (m: number, step: number = STEP): number => Math.round(m / step) * step;

export const clamp = (m: number, lo: number, hi: number): number => Math.min(Math.max(m, lo), hi);

/** Minutes → x offset on a track spanning the full 24h domain. */
export const minutesToX = (m: number, trackWidth: number): number => (m / DAY_MINUTES) * trackWidth;

/** x offset → minutes (unsnapped). */
export const xToMinutes = (x: number, trackWidth: number): number =>
  trackWidth > 0 ? (x / trackWidth) * DAY_MINUTES : 0;

/**
 * The drag brain. `origin` is the range at gesture grant; `deltaMin` is the
 * pointer travel converted to minutes. Handles can never cross (MIN_DURATION
 * gap enforced) and 'range' mode preserves duration while clamping to the day.
 */
export const applyDrag = (mode: DragMode, origin: RangeMin, deltaMin: number): RangeMin => {
  if (mode === 'start') {
    const start = clamp(snapToStep(origin.start + deltaMin), 0, origin.end - MIN_DURATION);
    return { start, end: origin.end };
  }
  if (mode === 'end') {
    const end = clamp(snapToStep(origin.end + deltaMin), origin.start + MIN_DURATION, MAX_END);
    return { start: origin.start, end };
  }
  const duration = origin.end - origin.start;
  const start = clamp(snapToStep(origin.start + deltaMin), 0, MAX_END - duration);
  return { start, end: start + duration };
};

/**
 * Grant-time hit test: within `hitRadius` of a handle grabs that handle
 * (nearer one wins), between the handles drags the whole range, outside the
 * range grabs the nearest handle (tap-to-jump).
 *
 * For touches BETWEEN the handles the radius shrinks to a third of the gap,
 * so short sessions keep a grabbable middle instead of the two handle zones
 * swallowing the entire range. Outside the range the full radius applies.
 */
export const resolveDragMode = (
  touchX: number,
  startX: number,
  endX: number,
  hitRadius: number,
): DragMode => {
  const inner = touchX > startX && touchX < endX;
  const r = inner ? Math.min(hitRadius, (endX - startX) / 3) : hitRadius;
  const dStart = Math.abs(touchX - startX);
  const dEnd = Math.abs(touchX - endX);
  if (dStart <= r && dStart <= dEnd) return 'start';
  if (dEnd <= r) return 'end';
  if (inner) return 'range';
  return touchX < startX ? 'start' : 'end';
};

/** Half-open overlap — adjacency (e1 === s2) is NOT a conflict. */
export const intervalsOverlap = (s1: number, e1: number, s2: number, e2: number): boolean =>
  s1 < e2 && e1 > s2;

export const findConflict = (
  start: number,
  end: number,
  blocked: BlockedInterval[],
): BlockedInterval | null =>
  blocked.find((b) => intervalsOverlap(start, end, b.startMin, b.endMin)) ?? null;

export const slotCount = (start: number, end: number, slotDur: number): number =>
  slotDur > 0 ? Math.max(0, Math.floor((end - start) / slotDur)) : 0;

/** 180 → "3h", 150 → "2h 30m", 45 → "45m" */
export const formatDuration = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};
