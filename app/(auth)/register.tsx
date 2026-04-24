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
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import MedQLogo from '../../components/brand/MedQLogo';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LanguageToggle from '../../components/LanguageToggle';
import { registerSchema, type RegisterFormValues } from '../../utils/authSchemas';

export default function RegisterScreen() {
  const { t } = useLanguage();
  const { signup, loading } = useAuth();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: { name: '', phone: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    // No explicit navigation on success — (auth)/_layout.tsx redirects to
    // (tabs) the moment isLoggedIn flips, avoiding the race that caused
    // the React-Navigation "state.stale" crash.
    await signup({
      name: values.name.trim(),
      phone: values.phone.trim(),
      password: values.password,
      email: values.email?.trim() || undefined,
    });
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
          <View style={styles.langRow}>
            <LanguageToggle />
          </View>

          {/* Logo */}
          <View style={styles.logoSection}>
            <MedQLogo size={72} />
            <Text style={styles.appName}>{t('appName')}</Text>
            <Text style={styles.tagline}>Create your account</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.stepTitle}>Tell us about yourself</Text>
            <Text style={styles.stepDesc}>Fill in your details to get started</Text>

            {/* Name */}
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="Enter your name (min 2 characters)"
                  value={value}
                  onChangeText={onChange}
                  error={errors.name?.message}
                />
              )}
            />

            {/* Phone */}
            <Text style={styles.phoneLabel}>Mobile Number</Text>
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
                      placeholder="Enter 10-digit number"
                      value={value}
                      onChangeText={(text) => onChange(text.replace(/[^0-9]/g, '').slice(0, 10))}
                      keyboardType="phone-pad"
                      maxLength={10}
                      style={{ marginBottom: 0 }}
                      error={errors.phone?.message}
                    />
                  </View>
                </View>
              )}
            />

            {/* Email (optional) */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email (optional)"
                  placeholder="your@email.com"
                  value={value ?? ''}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email?.message}
                />
              )}
            />

            {/* Password */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Password"
                  placeholder="Create a password (min 6 characters)"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  error={errors.password?.message}
                />
              )}
            />

            {/* Confirm Password */}
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            {/* Signup Button */}
            <Button
              title="Create Account"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              disabled={!isValid || loading}
              size="large"
            />

            {/* Switch to Login */}
            <Text
              style={styles.switchLink}
              onPress={() => router.push('/(auth)/login')}
            >
              {t('alreadyHaveAccount') || 'Already have an account? Login'}
            </Text>
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
  langRow: { position: 'absolute', top: 16, right: 0 },
  logoSection: { alignItems: 'center', marginBottom: 36 },
  logo: { fontSize: 56, marginBottom: 8 },
  appName: { fontSize: 28, fontWeight: '900', color: Colors.primary, marginBottom: 4 },
  tagline: { fontSize: 15, color: Colors.textSecondary },
  formSection: { gap: 4 },
  stepTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  stepDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 20 },
  phoneLabel: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  countryCode: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  countryCodeText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  phoneInputWrapper: { flex: 1 },
  switchLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
  },
});
