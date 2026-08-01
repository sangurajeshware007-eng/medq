import {
  MAX_END,
  applyDrag,
  clamp,
  findConflict,
  formatDuration,
  intervalsOverlap,
  minutesToTime,
  minutesToX,
  resolveDragMode,
  slotCount,
  snapToStep,
  timeToMinutes,
  xToMinutes,
} from '../utils/timeRange';

describe('time conversion', () => {
  it('parses HH:mm to minutes', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('09:30')).toBe(570);
    expect(timeToMinutes('23:45')).toBe(1425);
  });

  it('formats minutes to zero-padded HH:mm', () => {
    expect(minutesToTime(0)).toBe('00:00');
    expect(minutesToTime(5)).toBe('00:05');
    expect(minutesToTime(570)).toBe('09:30');
    expect(minutesToTime(1425)).toBe('23:45');
  });

  it('snaps to the 15-minute grid', () => {
    expect(snapToStep(7)).toBe(0);
    expect(snapToStep(8)).toBe(15);
    expect(snapToStep(570)).toBe(570);
  });

  it('clamps into range', () => {
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(200, 0, 100)).toBe(100);
  });

  it('maps minutes to track x and back', () => {
    expect(minutesToX(720, 400)).toBe(200);
    expect(xToMinutes(200, 400)).toBe(720);
    expect(xToMinutes(100, 0)).toBe(0); // unmeasured track never divides by zero
  });
});

describe('applyDrag', () => {
  const origin = { start: 540, end: 720 }; // 09:00–12:00

  it('moves the start handle and snaps', () => {
    expect(applyDrag('start', origin, -67)).toEqual({ start: 480, end: 720 });
  });

  it('start cannot cross end (min 15-minute gap)', () => {
    expect(applyDrag('start', origin, 500)).toEqual({ start: 705, end: 720 });
  });

  it('start cannot go below 00:00', () => {
    expect(applyDrag('start', origin, -9999)).toEqual({ start: 0, end: 720 });
  });

  it('moves the end handle and clamps at MAX_END', () => {
    expect(applyDrag('end', origin, 120)).toEqual({ start: 540, end: 840 });
    expect(applyDrag('end', origin, 9999)).toEqual({ start: 540, end: MAX_END });
  });

  it('end cannot cross start', () => {
    expect(applyDrag('end', origin, -500)).toEqual({ start: 540, end: 555 });
  });

  it('range drag preserves duration', () => {
    expect(applyDrag('range', origin, 120)).toEqual({ start: 660, end: 840 });
  });

  it('range drag clamps at both day edges without shrinking', () => {
    expect(applyDrag('range', origin, -9999)).toEqual({ start: 0, end: 180 });
    expect(applyDrag('range', origin, 9999)).toEqual({ start: MAX_END - 180, end: MAX_END });
  });
});

describe('resolveDragMode', () => {
  // handles at x=100 (start) and x=300 (end), radius 24
  it('grabs the handle within radius', () => {
    expect(resolveDragMode(110, 100, 300, 24)).toBe('start');
    expect(resolveDragMode(290, 100, 300, 24)).toBe('end');
  });

  it('short ranges keep a grabbable middle (radius shrinks to gap/3 inside)', () => {
    // gap 60px → inner radius 20: near-edge grabs the handle, middle drags range
    expect(resolveDragMode(115, 100, 160, 24)).toBe('start');
    expect(resolveDragMode(145, 100, 160, 24)).toBe('end');
    expect(resolveDragMode(130, 100, 160, 24)).toBe('range');
  });

  it('between handles drags the whole range', () => {
    expect(resolveDragMode(200, 100, 300, 24)).toBe('range');
  });

  it('full radius applies from outside the range', () => {
    expect(resolveDragMode(90, 100, 160, 24)).toBe('start');
    expect(resolveDragMode(170, 100, 160, 24)).toBe('end');
  });

  it('outside the range jumps the nearest handle', () => {
    expect(resolveDragMode(20, 100, 300, 24)).toBe('start');
    expect(resolveDragMode(380, 100, 300, 24)).toBe('end');
  });
});

describe('conflicts', () => {
  const blocked = [{ startMin: 540, endMin: 720, label: 'Morning OPD' }];

  it('adjacent sessions do not conflict', () => {
    expect(intervalsOverlap(720, 840, 540, 720)).toBe(false);
    expect(findConflict(720, 840, blocked)).toBeNull();
  });

  it('overlapping sessions conflict', () => {
    expect(intervalsOverlap(600, 750, 540, 720)).toBe(true);
    expect(findConflict(600, 750, blocked)?.label).toBe('Morning OPD');
  });

  it('containment conflicts both ways', () => {
    expect(findConflict(500, 800, blocked)).not.toBeNull();
    expect(findConflict(580, 600, blocked)).not.toBeNull();
  });
});

describe('summary math', () => {
  it('counts whole slots', () => {
    expect(slotCount(540, 720, 15)).toBe(12);
    expect(slotCount(540, 730, 15)).toBe(12); // partial slot floors
    expect(slotCount(540, 540, 15)).toBe(0);
    expect(slotCount(540, 720, 0)).toBe(0); // degenerate duration never divides by zero
  });

  it('formats durations', () => {
    expect(formatDuration(180)).toBe('3h');
    expect(formatDuration(150)).toBe('2h 30m');
    expect(formatDuration(45)).toBe('45m');
  });
});
