/**
 * Hospital Onboarding Layout — wraps all 3 steps.
 *
 * On mount, fetches onboarding status + saved data from the backend.
 * If the user already completed some steps, the store is hydrated and
 * the router jumps to the correct resume step.
 */
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { Colors } from '../../../constants/Colors';
import { useHospitalOnboardingHydration } from '../../../hooks/useOnboardingHydration';

export default function HospitalOnboardingLayout() {
  const router = useRouter();
  // ?mode=edit signals "owner re-editing an approved hospital" — bypass the
  // PENDING/APPROVED redirect and hydrate the existing data into the form.
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === 'edit';
  const { loading, resumeStep, status } = useHospitalOnboardingHydration(isEditMode);
  const didRedirect = useRef(false);

  useEffect(() => {
    if (loading || didRedirect.current) return;
    didRedirect.current = true;

    // In edit mode, never redirect — let the owner stay on whichever step they
    // navigated to. In normal onboarding, PENDING/APPROVED users get bounced
    // to the approval-pending screen.
    if (!isEditMode && (status === 'PENDING' || status === 'APPROVED')) {
      router.replace('/onboarding/approval-pending?type=hospital');
      return;
    }

    if (!isEditMode && resumeStep > 1 && resumeStep <= 3) {
      router.replace(
        `/onboarding/hospital/step${resumeStep}` as `/onboarding/hospital/step${1 | 2 | 3}`,
      );
    }
  }, [loading, resumeStep, status, router, isEditMode]);

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
