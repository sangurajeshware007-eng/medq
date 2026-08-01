/**
 * InjectionLoader — the Confirm Booking button's loading state.
 *
 * A syringe repeatedly travels left → right toward a patient silhouette
 * while the booking request is in flight: progress that tells the story
 * of what's happening instead of an anonymous spinner.
 *
 * Sized to live INSIDE a button row; color defaults to white for the
 * green success button.
 */
import { Syringe, UserRound } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Colors } from '../constants/Colors';

interface InjectionLoaderProps {
  color?: string;
  /** Travel lane width inside the button. */
  width?: number;
}

const CYCLE_MS = 1100;

export default function InjectionLoader({
  color = Colors.white,
  width = 110,
}: InjectionLoaderProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: CYCLE_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const lane = width - 44; // leave room for the patient icon at the right
  const translateX = progress.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [0, lane, lane], // glide, then a beat of contact before restarting
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.08, 0.9, 1],
    outputRange: [0, 1, 1, 0], // fade at the seams so the restart never pops
  });

  return (
    <View style={[styles.row, { width }]} testID="injection-loader">
      <Animated.View style={{ opacity, transform: [{ translateX }] }}>
        <Syringe size={20} color={color} strokeWidth={2.2} />
      </Animated.View>
      <View style={styles.patient}>
        <UserRound size={20} color={color} strokeWidth={2.2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  patient: {
    position: 'absolute',
    right: 0,
  },
});
