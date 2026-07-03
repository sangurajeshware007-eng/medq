import { NotoSans_400Regular, NotoSans_700Bold } from '@expo-google-fonts/noto-sans';
import {
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_700Bold,
} from '@expo-google-fonts/noto-sans-devanagari';
import {
  NotoSansKannada_400Regular,
  NotoSansKannada_700Bold,
} from '@expo-google-fonts/noto-sans-kannada';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AnimatedSplash from '../components/AnimatedSplash';
import ErrorFallback from '../components/ErrorFallback';
import { Colors } from '../constants/Colors';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { LocationProvider } from '../context/LocationContext';

// Hide the native splash as soon as the JS bundle is ready — our animated
// splash overlay takes over for a seamless handoff. Swallow errors so dev
// reloads (where the native splash is already hidden) don't crash.
SplashScreen.hideAsync().catch(() => {});

// Expo Router automatically renders this when an unhandled error is thrown
// inside this layout's subtree (or any route below that doesn't have its own
// ErrorBoundary). It replaces the default red dev overlay with a friendly screen.
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return <ErrorFallback error={error} retry={retry} />;
}

const queryClient = new QueryClient();

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  // Multi-script fonts for English / Hindi / Kannada. Block render until
  // they're ready so the first paint never shows missing-glyph boxes.
  const [fontsLoaded] = useFonts({
    NotoSans_400Regular,
    NotoSans_700Bold,
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_700Bold,
    NotoSansKannada_400Regular,
    NotoSansKannada_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LanguageProvider>
              <LocationProvider>
                <StatusBar style="dark" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: Colors.background },
                  }}
                >
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="doctor/[id]"
                    options={{ headerShown: false, presentation: 'card' }}
                  />
                  <Stack.Screen
                    name="hospital/[id]"
                    options={{ headerShown: false, presentation: 'card' }}
                  />
                  <Stack.Screen
                    name="booking/[id]"
                    options={{ headerShown: false, presentation: 'card' }}
                  />
                  <Stack.Screen
                    name="token/[id]"
                    options={{ headerShown: false, presentation: 'card' }}
                  />
                  <Stack.Screen
                    name="nearme"
                    options={{ headerShown: false, presentation: 'card' }}
                  />
                  <Stack.Screen
                    name="location-picker"
                    options={{ headerShown: false, presentation: 'modal' }}
                  />
                  <Stack.Screen
                    name="onboarding"
                    options={{ headerShown: false, presentation: 'card' }}
                  />
                  {/* reception/* and staff/* are auto-discovered by Expo Router from
                      app/reception/*.tsx and app/staff/*.tsx — explicit Stack.Screen
                      entries with name="reception" / "staff" caused the
                      "No route named …" warnings because there is no group layout
                      at those paths. Default Stack options apply automatically. */}
                </Stack>
                {!splashDone && <AnimatedSplash onDone={() => setSplashDone(true)} />}
              </LocationProvider>
            </LanguageProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
