import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onAction?: () => void;
}

export default function SectionHeader({ title, actionText, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionText && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.action}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginHorizontal: 4,
  },
  title: {
    fontWeight: '900',
    fontSize: 20,
    color: '#222',
  },
  action: {
    color: '#2e7d32',
    fontWeight: '700',
    fontSize: 14,
  },
});

