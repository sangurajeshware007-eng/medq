/**
 * Login Screen — unified entry point for login and registration.
 *
 * Google Sign-In is the primary method at launch. The phone/OTP entry is
 * feature-flagged via ENV.enableOtpLogin and will be re-enabled once the
 * OTP provider goes live — do not delete it.
 *
 * The backend auto-detects new vs returning users — there is no separate
 * "login" / "register" split.
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

import Button from '../../components/Button';
import Input from '../../components/Input';
// Phase 1: English only
// import LanguageToggle from '../../components/LanguageToggle';
import { getGoogleSigninButton } from '../../services/googleAuthService';
import { phoneSchema, type PhoneFormValues } from '../../utils/authSchemas';

import { ENV } from '@/config/environment';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { formColumn } from '@/theme';

const BRAND_LOGO = require('../../assets/logo/new/logo-icon.png');

// Null in binaries without the native module (Expo Go / stale dev build) —
// we then fall back to the app's own Button, and sign-in reports a clear error.
const GoogleSigninButton = getGoogleSigninButton();

export default function PhoneEntryScreen() {
  const { t } = useLanguage();
  const { sendOtp, signInWithGoogle, loading } = useAuth();
  const router = useRouter();
  const [googleError, setGoogleError] = React.useState<string | null>(null);

  const onGooglePress = async () => {
    setGoogleError(null);
    const result = await signInWithGoogle();
    if (result.success && result.isNewUser) {
      // New user: collect name/phone before entering the app.
      router.push('/(auth)/complete-profile');
    } else if (!result.success && !result.cancelled && result.error) {
      setGoogleError(result.error);
    }
    // Returning user: setUser() flips isLoggedIn and the (auth) layout's
    // <Redirect> takes over — never navigate to tabs imperatively.
  };

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
            {/* Phase 1: English only */}
            {/* <LanguageToggle /> */}
          </View>

          {/* Logo */}
          <View style={styles.logoSection}>
            <Image source={BRAND_LOGO} style={styles.brandLogo} resizeMode="contain" />
            <Text style={styles.tagline}>{t('loginSubtitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {ENV.enableOtpLogin && (
              <>
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

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>
              </>
            )}

            {/* Google Sign-In — the primary method at launch */}
            <View style={styles.googleSection}>
              {GoogleSigninButton ? (
                <GoogleSigninButton
                  size={GoogleSigninButton.Size.Wide}
                  color={GoogleSigninButton.Color.Light}
                  onPress={onGooglePress}
                  disabled={loading}
                />
              ) : (
                <Button
                  title="Continue with Google"
                  onPress={onGooglePress}
                  disabled={loading}
                  size="large"
                />
              )}
              {googleError && <Text style={styles.googleError}>{googleError}</Text>}
            </View>

            {loading && (
              <View style={styles.sendingRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                {ENV.enableOtpLogin && <Text style={styles.sendingText}>{t('sendingOtp')}</Text>}
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    // Readable form column on wide screens (web) — no effect on phones.
    ...formColumn,
  },
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
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 12, fontWeight: '600', color: Colors.textLight },
  googleSection: { alignItems: 'center', gap: 8 },
  googleError: {
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
    lineHeight: 18,
  },
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
