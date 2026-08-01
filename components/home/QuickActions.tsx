/**
 * QuickActions — four colourful icon chips that surface the app's primary jobs.
 * Sits directly below WelcomeHero. Each chip is a soft-tinted square with a
 * coloured glyph — instantly scannable, large enough to thumb-tap one-handed.
 *
 * Desktop web: the chips become horizontal white cards with a hover lift,
 * matching web conventions; phone/native keep the tile layout.
 */
import { Search, Map, ClipboardList, Phone } from 'lucide-react-native';
import React from 'react';
import type { ComponentType } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

import { Colors } from '../../constants/Colors';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import HoverLift from '../web/HoverLift';

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
  const { isMd } = useBreakpoint();
  const wide = Platform.OS === 'web' && isMd;

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
    <View style={[styles.row, wide && styles.rowWide]}>
      {actions.map(({ key, label, Icon, tint, background, onPress }) => (
        <HoverLift key={key} style={wide ? styles.hoverWrapWide : undefined}>
          <TouchableOpacity
            style={[styles.action, wide && styles.actionWide]}
            onPress={onPress}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.iconWrap,
                wide && styles.iconWrapWide,
                { backgroundColor: background },
              ]}
            >
              <Icon size={20} color={tint} strokeWidth={2.5} />
            </View>
            <Text style={[styles.label, wide && styles.labelWide]} numberOfLines={1}>
              {label}
            </Text>
          </TouchableOpacity>
        </HoverLift>
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
  rowWide: {
    gap: 14,
    paddingHorizontal: 16,
  },
  hoverWrapWide: { flex: 1 },
  action: { flex: 1, alignItems: 'center' },
  actionWide: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconWrapWide: {
    width: 44,
    height: 44,
    borderRadius: 14,
    marginBottom: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.2,
  },
  labelWide: {
    fontSize: 14,
  },
});
