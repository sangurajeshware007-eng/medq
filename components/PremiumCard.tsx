import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming, useSharedValue } from 'react-native-reanimated';
import { crossPlatformShadow } from '../utils/shadow';

interface PremiumCardProps {
  children: ReactNode;
  style?: ViewStyle;
  floating?: boolean;
  padding?: number;
}

export default function PremiumCard({ children, style, floating = false, padding = 18 }: PremiumCardProps) {
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    if (floating) {
      translateY.value = withRepeat(withTiming(-8, { duration: 1800 }), -1, true);
    }
  }, [floating]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floating ? translateY.value : 0 }],
  }));

  return (
    <Animated.View style={[styles.card, floating && animatedStyle, { padding }, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    transform: [{ translateY: -2 }], // floating illusion
    ...crossPlatformShadow({ opacity: 0.12, radius: 18, elevation: 7 }),
    borderWidth: 1,
    borderColor: '#f1f1f4',
  },
});
