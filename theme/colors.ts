/**
 * Semantic color tokens for MedReachPlus
 *
 * NEVER hardcode hex values in components — always import from here.
 * Structured as semantic layers: brand → surface → text → state
 */

// ─── Brand ────────────────────────────────────────────────────────────────
export const brand = {
  primary: '#0A7E8C',
  primaryLight: '#E6F7F9',
  primaryDark: '#065A64',
  primaryGlow: 'rgba(10, 126, 140, 0.15)',

  accent: '#FF6B6B',
  accentLight: '#FFF0F0',
  accentGlow: 'rgba(255, 107, 107, 0.18)',
} as const;

// ─── Trust / Status ───────────────────────────────────────────────────────
export const status = {
  success: '#25D366',
  successLight: '#E8F8EE',
  successGlow: 'rgba(37, 211, 102, 0.12)',

  warning: '#F5A623',
  warningLight: '#FFF8E7',
  warningGlow: 'rgba(245, 166, 35, 0.15)',

  error: '#EF4444',
  errorLight: '#FEF2F2',

  info: '#0A7E8C',
} as const;

// ─── Surface ──────────────────────────────────────────────────────────────
export const surface = {
  background: '#F4F8FB',
  card: '#FFFFFF',
  white: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.45)',
} as const;

// ─── Text ─────────────────────────────────────────────────────────────────
export const text = {
  primary: '#1B2838',
  secondary: '#5A6B7F',
  tertiary: '#94A3B8',
  inverse: '#FFFFFF',
  link: '#0A7E8C',
} as const;

// ─── Border ───────────────────────────────────────────────────────────────
export const border = {
  default: '#E2E8F0',
  subtle: '#F1F5F9',
} as const;

// ─── Shadow ───────────────────────────────────────────────────────────────
export const shadow = {
  light: 'rgba(15, 40, 70, 0.08)',
  medium: 'rgba(15, 40, 70, 0.16)',
} as const;

// ─── Feature-specific ────────────────────────────────────────────────────
export const feature = {
  token: '#7C3AED',
  tokenLight: '#F3EEFE',
  tokenGlow: 'rgba(124, 58, 237, 0.12)',
  gold: '#F5A623',
  goldLight: '#FFF8E7',
  goldGlow: 'rgba(245, 166, 35, 0.15)',
  upi: '#5F259F',
} as const;

// ─── Flat export for legacy consumers (Colors.ts imports from here) ────────
export const palette = {
  ...brand,
  ...surface,
  ...feature,
  text: text.primary,
  textSecondary: text.secondary,
  textLight: text.tertiary,
  border: border.default,
  borderLight: border.subtle,
  shadow: shadow.light,
  shadowDark: shadow.medium,
  error: status.error,
  errorLight: status.errorLight,
  trustGreen: status.success,
  trustGreenLight: status.successLight,
  trustGreenGlow: status.successGlow,
  gold: feature.gold,
  goldLight: feature.goldLight,
  goldGlow: feature.goldGlow,
  tokenPurple: feature.token,
  tokenPurpleLight: feature.tokenLight,
  tokenPurpleGlow: feature.tokenGlow,
  overlay: surface.overlay,
  upiPurple: feature.upi,
  warmAccent: feature.gold,
  warmAccentLight: feature.goldLight,
  tokenRed: status.error,
  tokenGreen: status.success,
  gradientStart: brand.primaryLight,
  gradientEnd: surface.white,
  // Aliases for backward compatibility
  cardBg: surface.card,
  background: surface.background,
} as const;

