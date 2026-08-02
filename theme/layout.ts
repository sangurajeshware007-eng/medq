/**
 * Layout tokens — content-width columns for wide (desktop web) viewports.
 *
 * Pure-CSS approach: maxWidth never binds on phone widths, so spreading these
 * into a container style is a no-op on native and needs no breakpoint branch
 * (which would flip after hydration on the static web export).
 *
 * Tiers:
 *  - FORM (560): single-column forms and focused flows (auth, onboarding,
 *    time-off, walk-in…)
 *  - CONTENT (900): lists, consoles, detail pages, dashboards — readable
 *    column that still breathes.
 * Browsing grids (Home, Search, Hospitals) stay fluid — do not apply these.
 */
import type { ViewStyle } from 'react-native';

export const FORM_MAX_WIDTH = 560;
export const CONTENT_MAX_WIDTH = 900;

/** Centered narrow column for form screens. Spread into a container style. */
export const formColumn = {
  maxWidth: FORM_MAX_WIDTH,
  width: '100%',
  alignSelf: 'center',
} as const satisfies ViewStyle;

/** Centered reading column for lists / consoles / detail pages. */
export const contentColumn = {
  maxWidth: CONTENT_MAX_WIDTH,
  width: '100%',
  alignSelf: 'center',
} as const satisfies ViewStyle;
