import React from 'react';
import { Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { TouchableOpacity } from 'react-native-gesture-handler';

interface SpecialtyChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function SpecialtyChip({ label, selected, onPress, style }: SpecialtyChipProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.chip, selected && styles.selected, animatedStyle, style]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={() => (scale.value = withSpring(0.95))}
        onPressOut={() => (scale.value = withSpring(1))}
        onPress={onPress}
        style={styles.touch}
      >
        <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 18,
    backgroundColor: '#f7f7fa',
    marginRight: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ececf2',
  },
  selected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  touch: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#444',
    fontWeight: '700',
    fontSize: 15,
  },
  selectedLabel: {
    color: '#1976d2',
  },
});

