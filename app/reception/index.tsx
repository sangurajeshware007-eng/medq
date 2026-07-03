import { useRouter } from 'expo-router';
import {
  ClipboardList, UserPlus, ChevronRight, Activity, Briefcase,
} from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { crossPlatformShadow } from '../../utils/shadow';

const ACTIONS = [
  {
    icon: UserPlus,
    label: 'Walk-in Registration',
    desc: 'Register a patient who arrived without an appointment',
    route: '/reception/walk-in',
  },
  {
    icon: ClipboardList,
    label: 'Check-in Appointment',
    desc: 'Mark a booked patient as physically present',
    route: '/reception/check-in',
  },
  {
    icon: Activity,
    label: 'Token Queue',
    desc: 'View the live token queue for doctors today',
    route: '/reception/queue',
  },
];

export default function ReceptionDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  function handlePress(route: string) {
    if (route === '/reception/walk-in' || route === '/reception/check-in') {
      router.push(route as never);
      return;
    }
    Alert.alert('Coming soon', 'This action will be available shortly.');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronRight size={20} color={Colors.text} strokeWidth={2.5} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Reception Desk</Text>
          {user?.name && <Text style={styles.headerSub} numberOfLines={1}>Logged in as {user.name}</Text>}
        </View>
        <View style={styles.roleChip}>
          <Briefcase size={12} color={Colors.primary} strokeWidth={2.5} />
          <Text style={styles.roleChipText}>Receptionist</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Quick Actions</Text>
        {ACTIONS.map(({ icon: Icon, label, desc, route }) => (
          <TouchableOpacity
            key={route}
            activeOpacity={0.75}
            onPress={() => handlePress(route)}
            style={styles.card}
          >
            <View style={styles.cardIcon}>
              <Icon size={22} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardLabel}>{label}</Text>
              <Text style={styles.cardDesc}>{desc}</Text>
            </View>
            <ChevronRight size={18} color={Colors.textLight} strokeWidth={2} />
          </TouchableOpacity>
        ))}

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Reception duties</Text>
          <Text style={styles.tipText}>
            Use this desk to register walk-in patients, check in booked appointments, and watch the live token queue for the doctors at your hospital.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  roleChipText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 10, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.borderLight,
    ...crossPlatformShadow({ color: Colors.shadow, offsetY: 2, opacity: 1, radius: 6, elevation: 2 }),
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 17 },
  tipCard: {
    marginTop: 12, padding: 14, borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1, borderColor: Colors.primary, borderStyle: 'dashed',
  },
  tipTitle: { fontSize: 13, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  tipText: { fontSize: 12, color: Colors.text, lineHeight: 18 },
});
