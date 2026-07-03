/**
 * 4-point spacing grid for MedQ+
 *
 * All spacing values are multiples of 4.
 * Use these tokens instead of magic numbers.
 *
 * xs  = 4   sm  = 8    md  = 12   base = 16
 * lg  = 20  xl  = 24   2xl = 32   3xl  = 40
 * 4xl = 48  5xl = 64
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xl2: 32,
  xl3: 40,
  xl4: 48,
  xl5: 64,
} as const;

export type SpacingKey = keyof typeof spacing;

