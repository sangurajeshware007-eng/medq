/**
 * SkeletonCard — pulsing placeholder shown while card data loads.
 * Perceived speed: a shaped skeleton reads ~2x faster than a spinner.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Colors } from '../constants/Colors';

interface SkeletonCardProps {
  /** Rough card shape: photo card (hospital) or row card (doctor list). */
  variant?: 'card' | 'row';
  style?: StyleProp<ViewStyle>;
}

export default function SkeletonCard({ variant = 'card', style }: SkeletonCardProps) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  if (variant === 'row') {
    return (
      <Animated.View style={[styles.row, { opacity }, style]}>
        <View style={styles.avatar} />
        <View style={styles.lines}>
          <View style={[styles.line, { width: '55%' }]} />
          <View style={[styles.line, { width: '35%' }]} />
          <View style={[styles.line, { width: '70%' }]} />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.card, { opacity }, style]}>
      <View style={styles.photo} />
      <View style={[styles.line, { width: '70%', marginTop: 10 }]} />
      <View style={[styles.line, { width: '45%' }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    borderRadius: 18,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 12,
    marginRight: 14,
  },
  photo: {
    height: 96,
    borderRadius: 12,
    backgroundColor: Colors.borderLight,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.borderLight,
  },
  lines: { flex: 1, gap: 8, justifyContent: 'center' },
  line: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.borderLight,
    marginTop: 4,
  },
});
