/**
 * Live Queue route — thin re-export with a role guard. The real screen lives
 * in components/doctor/QueueConsole.tsx (route files are never platform-split
 * and stay minimal so the web bundle can't pick up native-only imports).
 */
import { Redirect } from 'expo-router';
import React from 'react';

import { QueueScreen } from '../../components/doctor/QueueConsole';
import { useAuthStore } from '../../store/authStore';

export default function DoctorQueueRoute() {
  const { user, isLoggedIn } = useAuthStore();

  if (!isLoggedIn) return <Redirect href="/(auth)/login" />;
  if (user?.role !== 'DOCTOR') return <Redirect href="/(tabs)" />;

  return <QueueScreen />;
}
