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

import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import MedQLogo from '../../components/brand/MedQLogo';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LanguageToggle from '../../components/LanguageToggle';
import { loginSchema, type LoginFormValues } from '../../utils/authSchemas';

export default function LoginScreen() {
  const { t } = useLanguage();
  const { login, loading } = useAuth();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { phone: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    const result = await login(values.phone, values.password);
    if (!result.success && result.error) {
      // Surface server-side error under the password field
      setError('password', { message: result.error });
    }
    // On success, (auth)/_layout.tsx redirects to (tabs) via <Redirect>
    // as soon as isLoggedIn flips. No imperative navigation here.
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
            <Text style={styles.tagline}>{t('loginSubtitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.stepTitle}>Welcome back</Text>
            <Text style={styles.stepDesc}>
              Enter your phone number and password to login
            </Text>

            {/* Phone */}
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

            {/* Password */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  error={errors.password?.message}
                />
              )}
            />

            {/* Login Button */}
            <Button
              title="Login"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              disabled={!isValid || loading}
              size="large"
            />

            {/* Switch to Register */}
            <Text
              style={styles.switchLink}
              onPress={() => router.push('/(auth)/register')}
            >
              {t('dontHaveAccount') || "Don't have an account? Sign up"}
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
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
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
