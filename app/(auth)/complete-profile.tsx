/**
 * Complete Profile Screen — shown once, for new users only.
 *
 * After OTP verification the backend creates the account with an empty name.
 * This screen collects the required full name (and optional email) before
 * the user can access the app. Once submitted, the auth layout detects
 * isLoggedIn=true and redirects to /(tabs) automatically.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { completeProfileSchema, type CompleteProfileFormValues } from '../../utils/authSchemas';

export default function CompleteProfileScreen() {
  const { completeProfile, loading } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CompleteProfileFormValues>({
    resolver: zodResolver(completeProfileSchema),
    mode: 'onChange',
    defaultValues: { name: '', email: '' },
  });

  const onSubmit = async (values: CompleteProfileFormValues) => {
    await completeProfile({
      name: values.name.trim(),
      email: values.email?.trim() || undefined,
    });
    // On success, AuthContext calls setUser() → isLoggedIn becomes true →
    // (auth)/_layout.tsx redirects to /(tabs) automatically.
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>👤</Text>
            </View>
            <Text style={styles.title}>Almost there!</Text>
            <Text style={styles.subtitle}>
              Tell us your name so doctors know who's booking an appointment.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="e.g. Ravi Kumar"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="words"
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email address (optional)"
                  placeholder="your@email.com"
                  value={value ?? ''}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email?.message}
                />
              )}
            />

            <Text style={styles.emailNote}>
              Email is used for appointment confirmations and receipts.
            </Text>

            <Button
              title="Continue to MedQ"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              disabled={!isValid || loading}
              size="large"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },

  header: { alignItems: 'center', marginBottom: 40 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: { fontSize: 36 },
  title: { fontSize: 26, fontWeight: '900', color: Colors.text, marginBottom: 10, textAlign: 'center' },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 300,
  },

  form: { gap: 4 },
  emailNote: {
    fontSize: 12,
    color: Colors.textLight,
    lineHeight: 18,
    marginTop: -8,
    marginBottom: 24,
  },
});
