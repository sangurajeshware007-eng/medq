import { useRouter } from 'expo-router';
import { AlertTriangle, RotateCcw, Home, LogOut } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../constants/Colors';
import { useAuthStore } from '../store/authStore';

interface Props {
  error: Error;
  retry?: () => void;
}

export default function ErrorFallback({ error, retry }: Props) {
  const router = useRouter();
  const { clearUser } = useAuthStore();

  function handleHome() {
    try {
      router.replace('/');
    } catch {
      // navigation may not yet be ready — caller can press Try again
    }
  }

  async function handleSignOut() {
    try {
      clearUser();
      router.replace('/(auth)/login');
    } catch {
      // ignore — last-resort path
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconWrap}>
          <AlertTriangle size={56} color={Colors.error} strokeWidth={1.5} />
        </View>

        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>
          The app hit an unexpected error. You can try again, or go back home.
        </Text>

        {error?.message ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorLabel}>Details</Text>
            <Text style={styles.errorMessage}>{error.message}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {retry && (
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={retry} activeOpacity={0.8}>
              <RotateCcw size={16} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.btnPrimaryText}>Try Again</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={handleHome} activeOpacity={0.8}>
            <Home size={16} color={Colors.primary} strokeWidth={2.5} />
            <Text style={styles.btnOutlineText}>Go to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={handleSignOut} activeOpacity={0.8}>
            <LogOut size={14} color={Colors.textSecondary} strokeWidth={2} />
            <Text style={styles.btnGhostText}>Sign out & return to login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flexGrow: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28, paddingVertical: 32,
  },
  iconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.errorLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '900', color: Colors.text, textAlign: 'center' },
  subtitle: {
    fontSize: 14, color: Colors.textSecondary, textAlign: 'center',
    lineHeight: 20, marginTop: 8, maxWidth: 320,
  },
  errorBox: {
    width: '100%', marginTop: 22, padding: 14, borderRadius: 12,
    backgroundColor: Colors.errorLight,
    borderWidth: 1, borderColor: Colors.error, borderStyle: 'dashed',
  },
  errorLabel: {
    fontSize: 11, fontWeight: '800', color: Colors.error,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  errorMessage: { fontSize: 12, color: Colors.text, lineHeight: 18 },
  actions: { width: '100%', marginTop: 24, gap: 10 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 13, borderRadius: 12,
  },
  btnPrimary: { backgroundColor: Colors.primary },
  btnPrimaryText: { fontSize: 14, fontWeight: '800', color: Colors.white },
  btnOutline: {
    borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.white,
  },
  btnOutlineText: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  btnGhost: { paddingVertical: 8 },
  btnGhostText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
});
