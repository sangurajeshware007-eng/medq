import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

/**
 * Guard mirroring (tabs)/_layout.tsx: if the session is already
 * authenticated, send the user straight into the app. This is the single
 * declarative exit path for auth screens — login.tsx / register.tsx must
 * NOT call `router.replace('/(tabs)')` themselves (doing so races the
 * root layout's mount and surfaces "Cannot read property 'stale' of
 * undefined" from inside React Navigation).
 */
export default function AuthLayout() {
  const { isLoggedIn, initializing } = useAuthStore();

  if (!initializing && isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
