/**
 * EcgLoader — the app's loading indicator: a scrolling heart-monitor trace.
 *
 * A seamless ECG waveform slides right-to-left inside a clipped window,
 * exactly like a bedside monitor. Two copies of the same cycle sit side by
 * side and loop by one cycle-width, so the motion never jumps.
 *
 * Core Animated + react-native-svg (both already in the app) — identical on
 * iOS, Android, and web.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Colors } from '../constants/Colors';

// Animated.loop doesn't iterate with the native driver on react-native-web —
// JS driver on web (loops fine there), native driver elsewhere.
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface EcgLoaderProps {
  /** Visible window width. */
  width?: number;
  height?: number;
  color?: string;
  /** One full sweep duration (ms). */
  speed?: number;
}

// One ECG cycle in a 160×40 viewBox: baseline → QRS spike → small T-wave.
const CYCLE_W = 160;
const CYCLE_H = 40;
const ECG_PATH = 'M0 20 H30 L38 20 L44 4 L52 36 L58 20 H86 Q92 12 98 20 H160';

function Cycle({ color, height }: { color: string; height: number }) {
  const width = (CYCLE_W / CYCLE_H) * height;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${CYCLE_W} ${CYCLE_H}`}>
      <Path d={ECG_PATH} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export default function EcgLoader({
  width = 120,
  height = 32,
  color = Colors.primary,
  speed = 1100,
}: EcgLoaderProps) {
  const scroll = useRef(new Animated.Value(0)).current;
  const cycleWidth = (CYCLE_W / CYCLE_H) * height;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(scroll, {
        toValue: 1,
        duration: speed,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [scroll, speed]);

  const translateX = scroll.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -cycleWidth],
  });

  // Enough cycles to cover the window plus the one that scrolls out.
  const copies = Math.ceil(width / cycleWidth) + 1;

  return (
    <View style={[styles.window, { width, height }]} testID="ecg-loader">
      <Animated.View style={[styles.strip, { transform: [{ translateX }] }]}>
        {Array.from({ length: copies }, (_, i) => (
          <Cycle key={i} color={color} height={height} />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  window: {
    overflow: 'hidden',
    alignSelf: 'center',
  },
  strip: {
    flexDirection: 'row',
  },
});
