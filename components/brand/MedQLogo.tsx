/**
 * MedQ+ brand mark — "The Token Cross".
 *
 * Geometry:
 *   • Teal filled circle   → the queue token (stable, trustworthy)
 *   • White medical plus   → healthcare marker
 *   • Gold arc tail        → turns the circle into a "Q" and signals
 *                             motion / "your turn is coming"
 *
 * Three variants:
 *   icon      → glyph only — tab bars, cards, favicons (default)
 *   wordmark  → glyph + "MedQ+" text — headers, splash
 *   mono      → single-colour glyph — dark backgrounds, inverse UIs
 *
 * All variants are pure geometry (no image assets) so they scale crisply
 * from 16 px to full-screen splash without a second resource.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Rect, Path } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

type Variant = 'icon' | 'wordmark' | 'mono';

interface MedQLogoProps {
  /** Height of the glyph (width is derived for wordmark). */
  size?: number;
  variant?: Variant;
  /** Override the glyph's primary colour (teal by default). */
  tint?: string;
  /** Override the accent tail colour (gold by default). */
  accent?: string;
  /** Override the cross colour (white by default). */
  crossColor?: string;
  /** Hide the accent tail (cleaner look when the card already has a lot going on). */
  hideTail?: boolean;
}

export default function MedQLogo({
  size = 32,
  variant = 'icon',
  tint,
  accent,
  crossColor,
  hideTail = false,
}: Readonly<MedQLogoProps>) {
  const isMono = variant === 'mono';
  const primary = tint ?? (isMono ? Colors.white : Colors.primary);
  const tail = accent ?? (isMono ? Colors.white : Colors.gold);
  const crossFill = crossColor ?? (isMono ? Colors.primary : Colors.white);

  const glyph = (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Token circle */}
      <Circle cx={32} cy={32} r={26} fill={primary} />
      {/* Medical plus — vertical stroke */}
      <Rect x={28.5} y={15} width={7} height={34} rx={2.5} fill={crossFill} />
      {/* Medical plus — horizontal stroke */}
      <Rect x={15} y={28.5} width={34} height={7} rx={2.5} fill={crossFill} />
      {/* Q-tail — turns the circle into a "Q" and hints at forward motion */}
      {!hideTail && (
        <Path
          d="M 50 48 Q 58 52 60 60"
          stroke={tail}
          strokeWidth={5.5}
          strokeLinecap="round"
          fill="none"
        />
      )}
    </Svg>
  );

  if (variant === 'wordmark') {
    const textColor = tint ?? Colors.primary;
    const plusColor = accent ?? Colors.gold;
    return (
      <View style={styles.wordmarkRow}>
        {glyph}
        <Text style={[styles.wordmarkText, { color: textColor, fontSize: size * 0.78 }]}>
          MedQ<Text style={{ color: plusColor }}>+</Text>
        </Text>
      </View>
    );
  }

  return glyph;
}

const styles = StyleSheet.create({
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordmarkText: {
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
