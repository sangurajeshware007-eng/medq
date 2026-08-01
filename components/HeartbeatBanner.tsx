/**
 * HeartbeatBanner — the home page's living brand strip.
 *
 * A continuous heart-monitor feed: the ECG trace scrolls right-to-left
 * forever (never pauses), with exactly PULSES_VISIBLE complexes on screen
 * at any width. The strip advances one full complex per BEAT_MS, and the
 * heart on the right performs its lub-dub on the same master timeline —
 * one beat per passing pulse, always in sync.
 *
 * Core Animated + react-native-svg — no new dependencies; native-driver
 * transforms only; identical on iOS, Android, and web.
 */
import { Heart } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Colors } from '../constants/Colors';

/** One new pulse reaches the heart every beat. */
// Animated.loop doesn't iterate with the native driver on react-native-web —
// JS driver on web (loops fine there), native driver elsewhere.
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const BEAT_MS = 1800;
/** ECG complexes visible across the strip at any screen width. */
const PULSES_VISIBLE = 5;

// One ECG complex in a 160×40 viewBox: baseline → QRS spike → T-wave.
const ECG_VIEW_W = 160;
const ECG_VIEW_H = 40;
const ECG_PATH = 'M0 20 H30 L38 20 L44 4 L52 36 L58 20 H86 Q92 12 98 20 H160';

function EcgCycle({ color, width, height }: { color: string; width: number; height: number }) {
  // preserveAspectRatio="none" lets one complex be exactly trackWidth/5 wide.
  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${ECG_VIEW_W} ${ECG_VIEW_H}`}
      preserveAspectRatio="none"
    >
      <Path d={ECG_PATH} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export default function HeartbeatBanner() {
  const t = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: BEAT_MS,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  const cycleWidth = trackWidth > 0 ? trackWidth / PULSES_VISIBLE : 0;

  // Seamless infinite scroll: shift left by exactly one complex per loop —
  // frame N+1 of one cycle is identical to frame 0 of the next.
  const translateX = t.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -cycleWidth],
  });

  // Lub-dub, one per passing pulse: strong first contraction, lighter second.
  const heartScale = t.interpolate({
    inputRange: [0, 0.08, 0.18, 0.28, 0.38, 1],
    outputRange: [1, 1.3, 1.04, 1.2, 1, 1],
  });
  const glowOpacity = t.interpolate({
    inputRange: [0, 0.08, 0.38, 1],
    outputRange: [0, 0.35, 0, 0],
  });
  const glowScale = t.interpolate({
    inputRange: [0, 0.38, 1],
    outputRange: [0.6, 1.9, 1.9],
  });

  return (
    <View style={styles.banner} testID="heartbeat-banner">
      <View
        style={styles.track}
        onLayout={(e) => setTrackWidth(Math.round(e.nativeEvent.layout.width))}
      >
        {cycleWidth > 0 && (
          <Animated.View style={[styles.strip, { transform: [{ translateX }] }]}>
            {Array.from({ length: PULSES_VISIBLE + 2 }, (_, i) => (
              <EcgCycle key={i} color={Colors.primary} width={cycleWidth} height={40} />
            ))}
          </Animated.View>
        )}
      </View>

      {/* The heart — lub-dub for every pulse that reaches it */}
      <View style={styles.heartSlot}>
        <Animated.View
          style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}
        />
        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
          <Heart size={26} color={Colors.accent} fill={Colors.accent} strokeWidth={1.5} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  track: {
    flex: 1,
    height: 40,
    overflow: 'hidden',
  },
  strip: {
    flexDirection: 'row',
  },
  heartSlot: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.accentLight,
  },
});
