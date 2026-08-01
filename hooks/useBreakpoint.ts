/**
 * Responsive breakpoint hook — the single primitive for responsive layout.
 *
 * sm: phones (default, < 768)
 * md: tablets / small desktop (≥ 768)
 * lg: desktop (≥ 1024)
 *
 * Works on native too (tablets get md), but its main consumer is web.
 */
import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

export type Breakpoint = 'sm' | 'md' | 'lg';

export const BREAKPOINTS = { md: 768, lg: 1024 } as const;

export interface BreakpointInfo {
  breakpoint: Breakpoint;
  /** Window width, for ad-hoc calculations (column counts etc.) */
  width: number;
  isMd: boolean;
  isLg: boolean;
  /** Pick a value per breakpoint, falling back to the next smaller one. */
  select: <T>(values: { sm: T; md?: T; lg?: T }) => T;
}

export function useBreakpoint(): BreakpointInfo {
  const { width: liveWidth } = useWindowDimensions();
  // Hydration safety (web): the static export is prerendered at width 0
  // (phone layout). React requires the FIRST client render to match that
  // HTML — reporting the real width immediately throws hydration error
  // #418 wherever a wider layout adds/removes elements. So report `sm`
  // until after mount, then switch to the live width. No-op on native.
  const [hydrated, setHydrated] = useState(Platform.OS !== 'web');
  useEffect(() => setHydrated(true), []);
  const width = hydrated ? liveWidth : 0;
  const breakpoint: Breakpoint =
    width >= BREAKPOINTS.lg ? 'lg' : width >= BREAKPOINTS.md ? 'md' : 'sm';

  const select = <T>(values: { sm: T; md?: T; lg?: T }): T => {
    if (breakpoint === 'lg') return values.lg ?? values.md ?? values.sm;
    if (breakpoint === 'md') return values.md ?? values.sm;
    return values.sm;
  };

  return {
    breakpoint,
    width,
    isMd: breakpoint !== 'sm',
    isLg: breakpoint === 'lg',
    select,
  };
}
