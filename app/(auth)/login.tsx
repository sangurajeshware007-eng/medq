/**
 * Phone Entry Screen — unified entry point for login and registration.
 *
 * The user types their mobile number and taps "Send OTP".
 * The backend auto-detects new vs returning users — there is no separate
 * "login" / "register" split. OTP verification handles both.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Input from '../../components/Input';
import LanguageToggle from '../../components/LanguageToggle';
import { phoneSchema, type PhoneFormValues } from '../../utils/authSchemas';

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

const BRAND_LOGO = require('../../assets/logo/new/logo-icon.png');

export default function PhoneEntryScreen() {
  const { t } = useLanguage();
  const { sendOtp, loading } = useAuth();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    mode: 'onChange',
    defaultValues: { phone: '' },
  });

  // Tracks the last phone value we auto-submitted so we don't re-fire when the
  // user retypes the same 10 digits after an error. Edit one digit and retype
  // and the guard resets.
  const lastAutoSubmittedRef = React.useRef<string | null>(null);

  const onSubmit = async (values: PhoneFormValues) => {
    const result = await sendOtp(values.phone);
    if (result.success) {
      router.push('/(auth)/otp');
    } else {
      setError('phone', { message: result.error });
      lastAutoSubmittedRef.current = null; // allow another attempt
    }
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
            <Image source={BRAND_LOGO} style={styles.brandLogo} resizeMode="contain" />
            <Text style={styles.tagline}>{t('loginSubtitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.stepTitle}>{t('enterMobileNumber')}</Text>
            <Text style={styles.stepDesc}>{t('loginDesc')}</Text>

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
                      placeholder={t('mobileNumberPlaceholder')}
                      value={value}
                      onChangeText={(text) => {
                        const next = text.replace(/[^0-9]/g, '').slice(0, 10);
                        onChange(next);
                        // Auto-send OTP as soon as 10 digits land — no button tap needed.
                        if (
                          next.length === 10 &&
                          next !== lastAutoSubmittedRef.current &&
                          !loading
                        ) {
                          lastAutoSubmittedRef.current = next;
                          handleSubmit(onSubmit)();
                        }
                      }}
                      keyboardType="phone-pad"
                      maxLength={10}
                      style={{ marginBottom: 0 }}
                      error={errors.phone?.message}
                      autoFocus
                    />
                  </View>
                </View>
              )}
            />

            {loading && (
              <View style={styles.sendingRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.sendingText}>{t('sendingOtp')}</Text>
              </View>
            )}

            <Text style={styles.disclaimer}>{t('loginDisclaimer')}</Text>
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
  logoSection: { alignItems: 'center', marginBottom: 48 },
  brandLogo: { width: 240, height: 91, marginBottom: 12 },
  appName: { fontSize: 28, fontWeight: '900', color: Colors.primary, marginBottom: 4 },
  tagline: { fontSize: 15, color: Colors.textSecondary },
  formSection: { gap: 4 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  stepDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 24 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
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
  sendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  sendingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 16,
  },
});
