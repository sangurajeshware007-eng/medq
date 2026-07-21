/**
 * Cross-platform shadow elevation scale
 *
 * Native (iOS/Android) uses shadow and elevation props; web uses CSS boxShadow.
 * Use these helpers instead of raw shadow* props.
 */
import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

import { shadow as shadowColors } from './colors';

interface ShadowOptions {
  color?: string;
  offsetY?: number;
  opacity?: number;
  radius?: number;
  elevation?: number;
}

/**
 * On native, shadowOpacity multiplies the alpha channel of shadowColor.
 * Reproduce that on web by folding the opacity into the rgba color.
 */
function toWebShadowColor(color: string, opacity: number): string {
  const match = color.match(/rgba?\(([^)]+)\)/);
  if (match && match[1]) {
    const parts = match[1].split(',').map((p) => p.trim());
    const [r, g, b] = parts;
    const alpha = parts.length > 3 ? parseFloat(parts[3] ?? '1') : 1;
    return `rgba(${r}, ${g}, ${b}, ${alpha * opacity})`;
  }
  return color;
}

export function createShadow({
  color = shadowColors.light,
  offsetY = 4,
  opacity = 1,
  radius = 16,
  elevation = 5,
}: ShadowOptions = {}): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0 ${offsetY}px ${radius}px ${toWebShadowColor(color, opacity)}`,
    } as ViewStyle;
  }
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
  sm: createShadow({ offsetY: 2, opacity: 0.08, radius: 8, elevation: 2 }),
  md: createShadow({ offsetY: 4, opacity: 0.1, radius: 12, elevation: 4 }),
  lg: createShadow({ offsetY: 6, opacity: 0.12, radius: 16, elevation: 6 }),
  xl: createShadow({ offsetY: 8, opacity: 0.16, radius: 24, elevation: 8 }),
} as const;
