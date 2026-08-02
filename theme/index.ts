/**
 * Theme barrel export — single import point for all design tokens.
 *
 * Usage:
 *   import { palette, spacing, shadows, radius, textStyles } from '@theme';
 */
export { brand, status, surface, text, border, shadow, feature, palette } from './colors';
export { fontSize, fontWeight, fontFamily, lineHeight, textStyles } from './typography';
export { spacing } from './spacing';
export { radius } from './radius';
export { createShadow, shadows } from './shadows';
export { FORM_MAX_WIDTH, CONTENT_MAX_WIDTH, formColumn, contentColumn } from './layout';

export type { SpacingKey } from './spacing';
