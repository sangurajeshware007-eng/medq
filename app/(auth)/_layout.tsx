import { Redirect, Stack } from 'expo-router';
import React from 'react';

import { useAuthStore } from '../../store/authStore';

/**
 * Auth stack layout guard.
 *
 * Three states:
 *  1. initializing      → render nothing (splash stays up) to avoid flicker
 *  2. isLoggedIn        → redirect to (tabs); stack is not mounted
 *  3. not logged in     → render the auth stack (login → otp → complete-profile)
 *
 * Navigation within the OTP flow is imperative (router.push) from each screen.
 * The only declarative exit is the <Redirect> below — screens must NOT call
 * router.replace('/(tabs)') themselves to avoid the React Navigation "stale"
 * state crash during the auth → tabs transition.
 */
export default function AuthLayout() {
  const { isLoggedIn, initializing } = useAuthStore();

  if (initializing) return null;

  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="complete-profile" />
    </Stack>
  );
}
