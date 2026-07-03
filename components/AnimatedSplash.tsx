/**
 * AnimatedSplash — replaces the static splash with an animated logo entrance.
 *
 * Sequence:
 *   1. Halo ring expands + fades (continuous, "breathing")
 *   2. Logo fades in + scales from 0.85 → 1.05 → 1.0 (overshoot)
 *   3. After `holdMs`, the whole component fades out and calls `onDone`
 *
 * Uses react-native-reanimated for 60fps native-driven animation.
 */
import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

const LOGO = require('../assets/logo/new/logo-icon.png');

interface Props {
  /** Called after the exit animation completes. */
  onDone?: () => void;
  /** How long to hold the logo before fading out. Default 1100ms. */
  holdMs?: number;
}

export default function AnimatedSplash({ onDone, holdMs = 1100 }: Props) {
  const containerOpacity = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);
  const haloOpacity = useSharedValue(0);
  const haloScale = useSharedValue(0.8);

  useEffect(() => {
    // Logo entrance — fade in + slight overshoot scale.
    logoOpacity.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSequence(
      withTiming(1.06, { duration: 480, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }),
    );

    // Halo — soft pulsing ring behind the logo so the screen feels alive.
    haloOpacity.value = withDelay(
      280,
      withRepeat(
        withSequence(
          withTiming(0.45, { duration: 900, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 900, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
    haloScale.value = withDelay(
      280,
      withRepeat(
        withSequence(
          withTiming(1.45, { duration: 1800, easing: Easing.out(Easing.ease) }),
          withTiming(0.8, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );

    // Schedule exit: fade out container, then notify parent.
    const exitDelay = 420 + holdMs;
    containerOpacity.value = withDelay(
      exitDelay,
      withTiming(0, { duration: 360, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished && onDone) runOnJS(onDone)();
      }),
    );
    // We don't need cleanup — Reanimated cancels when the node unmounts.
  }, [holdMs, onDone, containerOpacity, logoOpacity, logoScale, haloOpacity, haloScale]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: haloOpacity.value,
    transform: [{ scale: haloScale.value }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.container, containerStyle]}>
      <View style={styles.center}>
        <Animated.View style={[styles.halo, haloStyle]} />
        <Animated.View style={logoStyle}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.white,
    zIndex: 9999,
    elevation: 9999,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.primary,
  },
  logo: {
    width: 140,
    height: 140,
  },
});
