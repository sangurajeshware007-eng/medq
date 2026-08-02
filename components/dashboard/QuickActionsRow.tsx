/**
 * QuickActionsRow — four navigation tiles on the doctor dashboard:
 * Live Queue, My Patients, Time Off, Edit Profile.
 */
import { useRouter } from 'expo-router';
import { ListOrdered, Users, CalendarOff, UserCog } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { Colors } from '../../constants/Colors';

const ACTIONS = [
  { label: 'Queue', href: '/doctor/queue' as const, Icon: ListOrdered },
  { label: 'Patients', href: '/doctor/patients' as const, Icon: Users },
  { label: 'Time Off', href: '/doctor/time-off' as const, Icon: CalendarOff },
  { label: 'Profile', href: '/doctor/edit-profile' as const, Icon: UserCog },
];

export default function QuickActionsRow() {
  const router = useRouter();
  return (
    <View style={styles.row}>
      {ACTIONS.map(({ label, href, Icon }) => (
        <TouchableOpacity
          key={href}
          style={styles.tile}
          onPress={() => router.push(href)}
          activeOpacity={0.75}
        >
          <Icon size={18} color={Colors.primary} strokeWidth={2.2} />
          <Text style={styles.tileText}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tileText: { fontSize: 11, fontWeight: '600', color: Colors.text },
});
