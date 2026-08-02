/**
 * Onboarding group layout — wraps doctor + hospital sub-navigators
 */
import { Stack } from 'expo-router';
import React from 'react';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="doctor" />
      <Stack.Screen name="hospital" />
      <Stack.Screen name="approval-pending" />
    </Stack>
  );
}
