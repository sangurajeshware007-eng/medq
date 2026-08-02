/**
 * My Patients route — thin re-export with a role guard. The screen lives in
 * components/doctor/PatientsList.tsx (route files stay minimal and are never
 * platform-split).
 */
import { Redirect } from 'expo-router';
import React from 'react';

import PatientsList from '../../components/doctor/PatientsList';
import { useAuthStore } from '../../store/authStore';

export default function DoctorPatientsRoute() {
  const { user, isLoggedIn } = useAuthStore();

  if (!isLoggedIn) return <Redirect href="/(auth)/login" />;
  if (user?.role !== 'DOCTOR') return <Redirect href="/(tabs)" />;

  return <PatientsList />;
}
