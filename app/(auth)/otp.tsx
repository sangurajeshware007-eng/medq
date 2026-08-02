/**
 * OTP Verification Screen
 *
 * Shown after the user submits their phone number on the phone-entry screen.
 * Verifies the 6-digit OTP sent via SMS. Handles:
 *  - 6-box OTP input with auto-advance and backspace
 *  - 30-second resend cooldown
 *  - Test mode banner (dev/local environments)
 *  - New user → navigate to complete-profile
 *  - Returning user → auth layout redirects to (tabs) automatically
 */
import { useRouter } from 'expo-router';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { formColumn } from '@/theme';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

export default function OtpScreen() {
  const router = useRouter();
  const { verifyOtp, sendOtp, loading, pendingPhone, pendingIsTestMode } = useAuth();
  const { t } = useLanguage();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));

  // ── Countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ── OTP box handlers ─────────────────────────────────────────────────────

  const handleDigitChange = useCallback((index: number, value: string) => {
    // Accept only single digit
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    setError(null);

    setDigits((prev) => {
      const updated = [...prev];
      updated[index] = digit;
      return updated;
    });

    // Auto-advance
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyPress = useCallback(
    (index: number, key: string) => {
      if (key === 'Backspace') {
        if (digits[index] === '' && index > 0) {
          setDigits((prev) => {
            const updated = [...prev];
            updated[index - 1] = '';
            return updated;
          });
          inputRefs.current[index - 1]?.focus();
        } else {
          setDigits((prev) => {
            const updated = [...prev];
            updated[index] = '';
            return updated;
          });
        }
      }
    },
    [digits],
  );

  // ── Submit ───────────────────────────────────────────────────────────────

  const otp = digits.join('');
  const isComplete = otp.length === OTP_LENGTH;

  const handleVerify = useCallback(async () => {
    if (!isComplete || loading) return;
    setError(null);

    const result = await verifyOtp(otp);

    if (!result.success) {
      setError(result.error ?? 'Invalid OTP. Please try again.');
      // Clear all boxes and refocus first
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      return;
    }

    if (result.isNewUser) {
      router.push('/(auth)/complete-profile');
    }
    // Returning user: auth layout in (auth)/_layout.tsx detects isLoggedIn
    // and redirects to /(tabs) automatically — no imperative navigation needed.
  }, [isComplete, loading, otp, verifyOtp, router]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (isComplete && !loading) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  // ── Resend ───────────────────────────────────────────────────────────────

  const handleResend = useCallback(async () => {
    if (!canResend || !pendingPhone || resending) return;
    setResending(true);
    setDigits(Array(OTP_LENGTH).fill(''));
    setError(null);

    const result = await sendOtp(pendingPhone);
    if (!result.success) {
      setError(result.error ?? 'Unable to resend OTP.');
    } else {
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setCanResend(false);
      inputRefs.current[0]?.focus();
    }
    setResending(false);
  }, [canResend, pendingPhone, resending, sendOtp]);

  // ── Formatted phone display ──────────────────────────────────────────────
  const displayPhone = pendingPhone
    ? `+91 ${pendingPhone
        .replace(/\D/g, '')
        .slice(-10)
        .replace(/(\d{5})(\d{5})/, '$1 $2')}`
    : '';

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
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← {t('changeNumber')}</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('verifyNumber')}</Text>
            <Text style={styles.subtitle}>
              {t('otpSentTo')}
              {'\n'}
              <Text style={styles.phone}>{displayPhone}</Text>
            </Text>
          </View>

          {/* Dev mode banner */}
          {pendingIsTestMode && (
            <View style={styles.devBanner}>
              <Text style={styles.devBannerText}>
                🔧 {t('testModeOtp')} <Text style={styles.devBannerCode}>123456</Text>
              </Text>
            </View>
          )}

          {/* OTP boxes */}
          <View style={styles.otpRow}>
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <TextInput
                key={i}
                ref={(ref) => {
                  inputRefs.current[i] = ref;
                }}
                style={[
                  styles.otpBox,
                  digits[i] ? styles.otpBoxFilled : null,
                  error ? styles.otpBoxError : null,
                ]}
                value={digits[i]}
                onChangeText={(v) => handleDigitChange(i, v)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={i === 0}
                textContentType="oneTimeCode"
                caretHidden
              />
            ))}
          </View>

          {/* Error */}
          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Verifying indicator — OTP auto-verifies when all 6 digits are typed */}
          {loading && (
            <View style={styles.verifyingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.verifyingText}>{t('verifying')}</Text>
            </View>
          )}

          {/* Resend */}
          <View style={styles.resendRow}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                <Text style={[styles.resendLink, resending && styles.resendLinkDisabled]}>
                  {resending ? t('sending') : t('resendOtp')}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendTimer}>
                {t('resendOtpIn')} <Text style={styles.resendTimerBold}>{countdown}s</Text>
              </Text>
            )}
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
    paddingTop: 16,
    // Readable form column on wide screens (web) — no effect on phones.
    ...formColumn,
  },

  backBtn: { marginBottom: 32 },
  backText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },

  header: { marginBottom: 32 },
  title: { fontSize: 26, fontWeight: '900', color: Colors.text, marginBottom: 10 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  phone: { fontWeight: '700', color: Colors.text },

  devBanner: {
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  devBannerText: { fontSize: 13, color: '#856404', textAlign: 'center' },
  devBannerCode: { fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  otpBox: {
    // Fixed-size cells — flex:1 ballooned each box across wide (web) viewports.
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  otpBoxError: {
    borderColor: Colors.error,
  },

  errorText: {
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },

  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginBottom: 12,
  },
  verifyingText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },

  resendRow: { alignItems: 'center', marginTop: 8 },
  resendTimer: { fontSize: 14, color: Colors.textSecondary },
  resendTimerBold: { fontWeight: '700', color: Colors.text },
  resendLink: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  resendLinkDisabled: { opacity: 0.5 },
});
