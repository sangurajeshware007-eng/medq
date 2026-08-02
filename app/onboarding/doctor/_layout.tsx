/**
 * Doctor Onboarding Layout — wraps all 4 steps.
 *
 * On mount, fetches onboarding status + saved data from the backend.
 * If the user already completed some steps, the store is hydrated and
 * the router jumps to the correct resume step.
 */
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { Colors } from '../../../constants/Colors';
import { useDoctorOnboardingHydration } from '../../../hooks/useOnboardingHydration';

export default function DoctorOnboardingLayout() {
  const router = useRouter();
  const { loading, resumeStep, status } = useDoctorOnboardingHydration();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (loading || didRedirect.current) return;
    didRedirect.current = true;

    // Redirect to approval-pending if already submitted
    if (status === 'PENDING' || status === 'APPROVED') {
      router.replace('/onboarding/approval-pending?type=doctor');
      return;
    }

    // Resume at the correct step (skip step 1 if already done)
    if (resumeStep > 1 && resumeStep <= 4) {
      router.replace(
        `/onboarding/doctor/step${resumeStep}` as `/onboarding/doctor/step${1 | 2 | 3 | 4}`,
      );
    }
    // Otherwise the default Stack renders step1
  }, [loading, resumeStep, status, router]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="step1" />
      <Stack.Screen name="step2" />
      <Stack.Screen name="step3" />
      <Stack.Screen name="step4" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
