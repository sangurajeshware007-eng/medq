/**
 * HoverLift — subtle hover elevation for cards on desktop web.
 *
 * Native: renders children untouched (byte-identical tree).
 * Web: wraps children in a Pressable WITHOUT onPress (so clicks pass through
 * to the inner touchable) whose style function lifts the card on hover.
 */
import React from 'react';
import { Platform, Pressable } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { shadows } from '../../theme/shadows';

interface HoverLiftProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

// RNW passes these through to CSS; unknown on native (never rendered there).
const webTransition = {
  transitionProperty: 'transform, box-shadow',
  transitionDuration: '150ms',
} as unknown as ViewStyle;

/** RNW's Pressable style-state includes `hovered`; core RN types don't. */
export function isHovered(state: unknown): boolean {
  return !!(state as { hovered?: boolean }).hovered;
}

export default function HoverLift({ children, style, disabled }: HoverLiftProps) {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }
  return (
    <Pressable
      style={(state) => [
        webTransition,
        style,
        isHovered(state) && !disabled && { transform: [{ translateY: -3 }], ...shadows.lg },
      ]}
    >
      {children}
    </Pressable>
  );
}
