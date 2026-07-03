/**
 * QuickActions — four colourful icon chips that surface the app's primary jobs.
 * Sits directly below WelcomeHero. Each chip is a soft-tinted square with a
 * coloured glyph — instantly scannable, large enough to thumb-tap one-handed.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Search, Map, ClipboardList, Phone } from 'lucide-react-native';
import type { ComponentType } from 'react';

import { Colors } from '../../constants/Colors';

interface Action {
  key: string;
  label: string;
  Icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  tint: string;
  background: string;
  onPress: () => void;
}

interface QuickActionsProps {
  onFindDoctor: () => void;
  onNearMe: () => void;
  onMyBookings: () => void;
  onEmergency: () => void;
}

export default function QuickActions({
  onFindDoctor,
  onNearMe,
  onMyBookings,
  onEmergency,
}: QuickActionsProps) {
  const actions: Action[] = [
    {
      key: 'find',
      label: 'Find Doctor',
      Icon: Search,
      tint: Colors.primary,
      background: Colors.primaryLight,
      onPress: onFindDoctor,
    },
    {
      key: 'near',
      label: 'Near Me',
      Icon: Map,
      tint: '#7C3AED',
      background: '#F3EEFE',
      onPress: onNearMe,
    },
    {
      key: 'bookings',
      label: 'Bookings',
      Icon: ClipboardList,
      tint: '#F5A623',
      background: '#FFF8E7',
      onPress: onMyBookings,
    },
    {
      key: 'emergency',
      label: 'Emergency',
      Icon: Phone,
      tint: '#EF4444',
      background: '#FEF2F2',
      onPress: onEmergency,
    },
  ];

  return (
    <View style={styles.row}>
      {actions.map(({ key, label, Icon, tint, background, onPress }) => (
        <TouchableOpacity key={key} style={styles.action} onPress={onPress} activeOpacity={0.75}>
          <View style={[styles.iconWrap, { backgroundColor: background }]}>
            <Icon size={20} color={tint} strokeWidth={2.5} />
          </View>
          <Text style={styles.label} numberOfLines={1}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginTop: 18,
    marginBottom: 4,
  },
  action: { flex: 1, alignItems: 'center' },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.2,
  },
});
