/**
 * Complete Profile Screen — shown once, for new users only.
 *
 * OTP users arrive with a verified phone and an empty name — we collect the
 * name (and optional email). Google users arrive with name/email prefilled
 * from Google but no phone — we additionally require their mobile number
 * (unverified until OTP login ships). Once submitted, the auth layout detects
 * isLoggedIn=true and redirects to /(tabs) automatically.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../components/Button';
import Input from '../../components/Input';
import { normalizePhone } from '../../services/authService';
import {
  completeProfileSchema,
  completeProfileWithPhoneSchema,
  type CompleteProfileWithPhoneFormValues,
} from '../../utils/authSchemas';

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { formColumn } from '@/theme';

export default function CompleteProfileScreen() {
  const { completeProfile, loading, pendingSocialProfile } = useAuth();

  // Google-created accounts have no phone yet — the store holds their
  // Google name/email for prefill while the phone field is required.
  const needsPhone = pendingSocialProfile !== null;

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CompleteProfileWithPhoneFormValues>({
    resolver: zodResolver(
      (needsPhone
        ? completeProfileWithPhoneSchema
        : completeProfileSchema) as typeof completeProfileWithPhoneSchema,
    ),
    mode: 'onChange',
    defaultValues: {
      name: pendingSocialProfile?.name ?? '',
      email: pendingSocialProfile?.email ?? '',
      phone: '',
    },
  });

  const onSubmit = async (values: CompleteProfileWithPhoneFormValues) => {
    await completeProfile({
      name: values.name.trim(),
      email: values.email?.trim() || undefined,
      ...(needsPhone && values.phone ? { phone: normalizePhone(values.phone) } : {}),
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
              {needsPhone
                ? 'Confirm your details and add your mobile number so hospitals can reach you.'
                : "Tell us your name so doctors know who's booking an appointment."}
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

            {needsPhone && (
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.phoneRow}>
                    <View style={styles.countryCode}>
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    <View style={styles.phoneInputWrapper}>
                      <Input
                        label="Mobile Number"
                        placeholder="10-digit mobile number"
                        value={value ?? ''}
                        onChangeText={(text) => onChange(text.replace(/[^0-9]/g, '').slice(0, 10))}
                        keyboardType="phone-pad"
                        maxLength={10}
                        error={errors.phone?.message}
                      />
                    </View>
                  </View>
                )}
              />
            )}

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
  scrollContent: { ...formColumn, flexGrow: 1, padding: 24, justifyContent: 'center' },

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
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 300,
  },

  form: { gap: 4 },
  phoneRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  countryCode: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    alignSelf: 'flex-end',
  },
  countryCodeText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  phoneInputWrapper: { flex: 1 },
  emailNote: {
    fontSize: 12,
    color: Colors.textLight,
    lineHeight: 18,
    marginTop: -8,
    marginBottom: 24,
  },
});
