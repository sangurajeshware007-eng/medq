import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { LocationProvider } from '../context/LocationContext';
import { Colors } from '../constants/Colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const queryClient = new QueryClient();

export default function RootLayout() {
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
                </Stack>
              </LocationProvider>
            </LanguageProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
