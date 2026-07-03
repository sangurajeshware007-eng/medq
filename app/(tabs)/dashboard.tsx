/**
 * Doctor Dashboard tab — visible only when the signed-in user has role=DOCTOR.
 * The tab is hidden for everyone else via `href: null` in _layout.tsx; the
 * runtime guards below are belt-and-braces for deep links and stale state.
 */
import React from 'react';
import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import DoctorDashboard from '../../components/dashboard/DoctorDashboard';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/Colors';

export default function DashboardTab() {
  const { user, isLoggedIn } = useAuthStore();

  if (!isLoggedIn) return <Redirect href="/(auth)/login" />;
  if (user?.role !== 'DOCTOR') return <Redirect href="/(tabs)" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <DoctorDashboard />
    </SafeAreaView>
  );
}
