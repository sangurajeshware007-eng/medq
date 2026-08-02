/**
 * Patient visit-history route — thin re-export with a role guard. The screen
 * lives in components/doctor/PatientHistory.tsx.
 */
import { Redirect } from 'expo-router';
import React from 'react';

import PatientHistory from '../../../components/doctor/PatientHistory';
import { useAuthStore } from '../../../store/authStore';

export default function DoctorPatientHistoryRoute() {
  const { user, isLoggedIn } = useAuthStore();

  if (!isLoggedIn) return <Redirect href="/(auth)/login" />;
  if (user?.role !== 'DOCTOR') return <Redirect href="/(tabs)" />;

  return <PatientHistory />;
}
