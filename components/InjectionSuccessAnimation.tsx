/**
 * InjectionSuccessAnimation — the booking-confirmed moment.
 *
 * A syringe glides in from the left, reaches the patient's shoulder,
 * gives a quick "push", a soft burst blooms at the contact point, and a
 * "Booked!" check appears — then hands control back via onDone.
 *
 * Runs ONLY after the booking API succeeds (never masks errors) and lasts
 * ~2s total: long enough to land as a moment, short enough not to annoy.
 * Built with core Animated (native driver) — no new dependencies, works
 * identically on iOS, Android, and web.
 */
import { CheckCircle2, Syringe } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../constants/Colors';

interface InjectionSuccessAnimationProps {
  onDone: () => void;
}

const TRAVEL_MS = 900;
const PUSH_MS = 160;
const BURST_MS = 450;
const HOLD_MS = 650;

export default function InjectionSuccessAnimation({ onDone }: InjectionSuccessAnimationProps) {
  // 0 → 1: syringe travels from off-screen-left to the shoulder.
  const travel = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const check = useRef(new Animated.Value(0)).current;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const sequence = Animated.sequence([
      // Glide in
      Animated.timing(travel, {
        toValue: 1,
        duration: TRAVEL_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Quick plunger push: a small extra nudge forward and back
      Animated.timing(travel, {
        toValue: 1.06,
        duration: PUSH_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(travel, {
        toValue: 1,
        duration: PUSH_MS,
        useNativeDriver: true,
      }),
      // Burst at the contact point + check-in of the label
      Animated.parallel([
        Animated.timing(burst, { toValue: 1, duration: BURST_MS, useNativeDriver: true }),
        Animated.spring(check, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]),
      Animated.delay(HOLD_MS),
    ]);
    sequence.start(({ finished }) => {
      if (finished) onDoneRef.current();
    });
    return () => sequence.stop();
  }, [travel, burst, check]);

  // The syringe travels a fixed 210px lane and meets the shoulder at its end
  // (travel=1); the extra 1→1.06 leg is the plunger "push" nudge (+12px).
  // The stage is centered, so the geometry is identical at every screen width.
  const syringeX = travel.interpolate({
    inputRange: [0, 1, 1.06],
    outputRange: [-210, 0, 12],
  });

  const burstScale = burst.interpolate({ inputRange: [0, 1], outputRange: [0.3, 2.2] });
  const burstOpacity = burst.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0.55, 0],
  });
  const checkScale = check.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <View style={styles.overlay} pointerEvents="none" testID="injection-animation">
      <View style={styles.stage}>
        {/* Patient: head + shoulder silhouette, syringe meets the shoulder */}
        <View style={styles.patient}>
          <View style={styles.head} />
          <View style={styles.shoulder} />
        </View>

        {/* Burst at the contact point */}
        <Animated.View
          style={[styles.burst, { opacity: burstOpacity, transform: [{ scale: burstScale }] }]}
        />

        {/* Syringe gliding left → right into the shoulder */}
        <Animated.View style={[styles.syringeWrap, { transform: [{ translateX: syringeX }] }]}>
          <Syringe size={54} color={Colors.primary} strokeWidth={2} />
        </Animated.View>
      </View>

      <Animated.View
        style={[styles.doneRow, { opacity: check, transform: [{ scale: checkScale }] }]}
      >
        <CheckCircle2 size={22} color={Colors.trustGreen} strokeWidth={2.5} />
        <Text style={styles.doneText}>Booked!</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  stage: {
    width: 280,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patient: {
    position: 'absolute',
    right: 20,
    alignItems: 'center',
  },
  head: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2.5,
    borderColor: Colors.primary,
    marginBottom: 4,
  },
  shoulder: {
    width: 84,
    height: 58,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2.5,
    borderColor: Colors.primary,
  },
  // The syringe lane: its resting (travel=1) position touches the shoulder's
  // left edge; translateX moves it in from off-screen left.
  syringeWrap: {
    position: 'absolute',
    left: 130,
    top: 68,
    transform: [{ rotate: '0deg' }],
  },
  burst: {
    position: 'absolute',
    right: 88,
    top: 74,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryGlow,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 26,
  },
  doneText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.trustGreen,
  },
});
