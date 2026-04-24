/**
 * Native-only shadow elevation scale
 *
 * No Platform.OS check needed — web support removed.
 * Use these helpers instead of raw shadow* props.
 */
import type { ViewStyle } from 'react-native';
import { shadow as shadowColors } from './colors';

interface ShadowOptions {
  color?: string;
  offsetY?: number;
  opacity?: number;
  radius?: number;
  elevation?: number;
}

export function createShadow({
  color = shadowColors.light,
  offsetY = 4,
  opacity = 1,
  radius = 16,
  elevation = 5,
}: ShadowOptions = {}): ViewStyle {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}

/** Preset elevation levels */
export const shadows = {
  none: {} as ViewStyle,
  sm: createShadow({ offsetY: 2, opacity: 0.08, radius: 8,  elevation: 2 }),
  md: createShadow({ offsetY: 4, opacity: 0.10, radius: 12, elevation: 4 }),
  lg: createShadow({ offsetY: 6, opacity: 0.12, radius: 16, elevation: 6 }),
  xl: createShadow({ offsetY: 8, opacity: 0.16, radius: 24, elevation: 8 }),
} as const;

