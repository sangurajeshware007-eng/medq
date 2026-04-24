/**
 * Hospital Onboarding Layout — wraps all 3 steps.
 *
 * On mount, fetches onboarding status + saved data from the backend.
 * If the user already completed some steps, the store is hydrated and
 * the router jumps to the correct resume step.
 */
import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { useHospitalOnboardingHydration } from '../../../hooks/useOnboardingHydration';

export default function HospitalOnboardingLayout() {
  const router = useRouter();
  const { loading, resumeStep, status } = useHospitalOnboardingHydration();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (loading || didRedirect.current) return;
    didRedirect.current = true;

    if (status === 'PENDING' || status === 'APPROVED') {
      router.replace('/onboarding/approval-pending?type=hospital');
      return;
    }

    if (resumeStep > 1 && resumeStep <= 3) {
      router.replace(
        `/onboarding/hospital/step${resumeStep}` as `/onboarding/hospital/step${1 | 2 | 3}`,
      );
    }
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
