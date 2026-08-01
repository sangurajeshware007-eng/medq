/**
 * HeartbeatBanner — the home page's living brand strip.
 *
 * A faint ECG baseline spans the row; a bright pulse travels it left → right
 * and, exactly when it reaches the end, the heart on the right performs the
 * cardiac "lub-dub" double beat with a soft glow — then the cycle repeats.
 *
 * One master Animated.Value drives everything, so the pulse arrival and the
 * heartbeat can never drift out of sync. Core Animated + react-native-svg +
 * lucide — no new dependencies; identical on iOS, Android, and web.
 */
import { Heart } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Colors } from '../constants/Colors';

const CYCLE_MS = 2600;
// Phase (0–1) at which the pulse reaches the heart and the lub-dub fires.
const ARRIVAL = 0.72;

// ECG cycle in a 160×40 viewBox — same vocabulary as EcgLoader.
const ECG_VIEW_W = 160;
const ECG_VIEW_H = 40;
const ECG_PATH = 'M0 20 H30 L38 20 L44 4 L52 36 L58 20 H86 Q92 12 98 20 H160';

function EcgStrip({ color, width, height }: { color: string; width: number; height: number }) {
  // preserveAspectRatio="none" stretches one cycle across the full strip —
  // the baseline is decorative; the traveling highlight carries the motion.
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
        duration: CYCLE_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  const PULSE_W = 96;
  const travel = Math.max(trackWidth - PULSE_W, 1);

  // Bright pulse: crosses the track during [0, ARRIVAL], then rests while
  // the heart beats.
  const pulseX = t.interpolate({
    inputRange: [0, ARRIVAL, 1],
    outputRange: [0, travel, travel],
  });
  const pulseOpacity = t.interpolate({
    inputRange: [0, 0.05, ARRIVAL - 0.05, ARRIVAL, 1],
    outputRange: [0, 1, 1, 0, 0],
  });

  // Lub-dub: two quick contractions right after arrival — the first stronger
  // (ventricular "lub"), the second lighter ("dub") — then rest.
  const heartScale = t.interpolate({
    inputRange: [0, ARRIVAL, ARRIVAL + 0.05, ARRIVAL + 0.1, ARRIVAL + 0.15, ARRIVAL + 0.2, 1],
    outputRange: [1, 1, 1.32, 1.02, 1.22, 1, 1],
  });
  const glowOpacity = t.interpolate({
    inputRange: [0, ARRIVAL, ARRIVAL + 0.06, ARRIVAL + 0.22, 1],
    outputRange: [0, 0, 0.35, 0, 0],
  });
  const glowScale = t.interpolate({
    inputRange: [0, ARRIVAL, ARRIVAL + 0.22, 1],
    outputRange: [0.6, 0.6, 1.9, 1.9],
  });

  return (
    <View style={styles.banner} testID="heartbeat-banner">
      <View
        style={styles.track}
        onLayout={(e) => setTrackWidth(Math.round(e.nativeEvent.layout.width))}
      >
        {trackWidth > 0 && (
          <>
            {/* Faint baseline across the full width */}
            <View style={StyleSheet.absoluteFill}>
              <EcgStrip color={Colors.primaryLight} width={trackWidth} height={40} />
            </View>
            {/* Bright traveling pulse — a clipped window sliding over a vivid
                copy that is counter-translated, so the highlight illuminates
                the exact segment of the same waveform (a moving spotlight). */}
            <Animated.View
              style={[
                styles.pulseWindow,
                { width: PULSE_W, opacity: pulseOpacity, transform: [{ translateX: pulseX }] },
              ]}
            >
              <Animated.View style={{ transform: [{ translateX: Animated.multiply(pulseX, -1) }] }}>
                <EcgStrip color={Colors.primary} width={trackWidth} height={40} />
              </Animated.View>
            </Animated.View>
          </>
        )}
      </View>

      {/* The heart — lub-dub on pulse arrival */}
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
  pulseWindow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
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
