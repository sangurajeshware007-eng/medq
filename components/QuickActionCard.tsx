import React from 'react';
import { Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { crossPlatformShadow } from '../utils/shadow';

interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
  style?: ViewStyle;
}

export default function QuickActionCard({ icon, title, onPress, style }: QuickActionCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.card, animatedStyle, style]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={() => (scale.value = withSpring(0.95))}
        onPressOut={() => (scale.value = withSpring(1))}
        onPress={onPress}
        style={styles.touch}
      >
        {icon}
        <Text style={styles.title}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    backgroundColor: '#fff',
    ...crossPlatformShadow({ opacity: 0.10, radius: 14, elevation: 4 }),
    marginRight: 16,
    minWidth: 110,
  },
  touch: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  title: {
    marginTop: 10,
    fontWeight: '700',
    fontSize: 15,
    color: '#222',
  },
});

