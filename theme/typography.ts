/**
 * Typography scale for MedQ+
 *
 * Based on a modular scale (major third: 1.25x)
 * Display → Heading → Body → Caption → Label
 */

export const fontFamily = {
  regular: undefined,   // System default (San Francisco / Roboto)
  medium: undefined,
  bold: undefined,
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
  black: '900' as const,
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
} as const;

/** Predefined text styles for consistent typography across the app */
export const textStyles = {
  display: { fontSize: fontSize['5xl'], fontWeight: fontWeight.black, lineHeight: 38 },
  h1:      { fontSize: fontSize['4xl'], fontWeight: fontWeight.bold,      lineHeight: 34 },
  h2:      { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold,      lineHeight: 30 },
  h3:      { fontSize: fontSize['2xl'], fontWeight: fontWeight.semiBold,  lineHeight: 26 },
  h4:      { fontSize: fontSize.xl,    fontWeight: fontWeight.semiBold,  lineHeight: 24 },
  bodyLg:  { fontSize: fontSize.md,    fontWeight: fontWeight.regular,   lineHeight: 22 },
  body:    { fontSize: fontSize.base,  fontWeight: fontWeight.regular,   lineHeight: 20 },
  bodySm:  { fontSize: fontSize.sm,    fontWeight: fontWeight.regular,   lineHeight: 18 },
  caption: { fontSize: fontSize.xs,    fontWeight: fontWeight.regular,   lineHeight: 16 },
  label:   { fontSize: fontSize.sm,    fontWeight: fontWeight.medium,    lineHeight: 18 },
  button:  { fontSize: fontSize.md,    fontWeight: fontWeight.bold,      lineHeight: 22 },
} as const;

