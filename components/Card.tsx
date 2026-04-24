import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { crossPlatformShadow } from '../utils/shadow';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export default function Card({ children, style, padding = 16 }: CardProps) {
  return (
    <View style={[styles.card, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    ...crossPlatformShadow({ color: Colors.shadowDark, offsetY: 4, opacity: 0.1, radius: 16, elevation: 5 }),
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
});

