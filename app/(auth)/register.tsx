import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Image } from 'react-native';
import Input from '../../components/Input';

const BRAND_LOGO = require('../../assets/logo/new/logo-icon.png');
import Button from '../../components/Button';
import LanguageToggle from '../../components/LanguageToggle';
import { registerSchema, type RegisterFormValues } from '../../utils/authSchemas';

const TERMS_AND_CONDITIONS = `TERMS AND CONDITIONS OF USE
MedQ+ Healthcare Platform

Last Updated: May 2026

1. ACCEPTANCE OF TERMS
By creating an account on MedQ+, you agree to be bound by these Terms and Conditions. If you do not agree, please do not register or use this platform.

2. NATURE OF SERVICE — MEDIATOR DISCLAIMER
MedQ+ is a technology platform that connects patients with independent healthcare providers (doctors, hospitals, and clinics). MedQ+ is NOT a healthcare provider. We do not:
• Provide medical advice, diagnosis, or treatment
• Employ or supervise the listed doctors
• Guarantee the accuracy of doctor credentials or qualifications
• Take responsibility for any medical prescriptions, procedures, or medicines prescribed by doctors listed on this platform
• Accept liability for any medical outcomes arising from consultations booked through MedQ+

Patients interact with doctors entirely at their own risk. MedQ+ acts solely as an appointment booking intermediary.

3. DOCTOR DISCLAIMER
Doctors listed on MedQ+ are independent professionals. Their qualifications, registration status, and clinical decisions are their sole responsibility. MedQ+ verifies submitted credentials as a best-effort process but does not guarantee their accuracy. Any medical prescription, medicine recommendation, or clinical advice given by a doctor is between the patient and the doctor — MedQ+ has no liability for the same.

4. PATIENT RESPONSIBILITIES
• You are responsible for providing accurate information during registration and appointment booking.
• You must verify a doctor's credentials independently before proceeding with any treatment.
• In a medical emergency, contact emergency services (108) immediately — do not rely on MedQ+ for emergency care.
• Minors (under 18) may only use the platform under supervision of a parent or legal guardian.

5. APPOINTMENT BOOKINGS
• Booking an appointment does not guarantee consultation; availability depends on the doctor's schedule.
• Cancellation and rescheduling are subject to the individual doctor's and hospital's policy.
• MedQ+ is not responsible for missed appointments due to technical issues or doctor unavailability.

6. DATA PRIVACY
• Your personal and health information is stored securely and used only to facilitate appointments.
• We do not sell your personal data to third parties.
• Health records shared during consultations remain between you and your doctor.

7. LIMITATION OF LIABILITY
MedQ+ shall not be liable for any direct, indirect, incidental, or consequential damages arising from:
• Use or inability to use the platform
• Medical decisions made by healthcare providers booked through MedQ+
• Loss of data or unauthorized access to your account due to your own negligence

8. GOVERNING LAW
These Terms are governed by the laws of India. Disputes shall be subject to the jurisdiction of courts in Karnataka, India.

9. CHANGES TO TERMS
MedQ+ reserves the right to update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the revised Terms.

10. CONTACT
For support or queries: +91 90080 36561
Email: support@medqplus.in`;

function TermsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Terms & Conditions</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseTxt}>Close</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalScroll} contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.termsText}>{TERMS_AND_CONDITIONS}</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function RegisterScreen() {
  const { t } = useLanguage();
  const { signup, loading } = useAuth();
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);

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
            <Image source={BRAND_LOGO} style={styles.brandLogo} resizeMode="contain" />
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

            {/* Terms & Conditions */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setTermsAccepted((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText2}>
                I hereby declare that the information furnished by me is correct. I have read and agree to the{' '}
                <Text
                  style={styles.termsLink}
                  onPress={(e) => { e.stopPropagation(); setTermsVisible(true); }}
                >
                  Terms & Conditions
                </Text>
                {' '}including the mediator disclaimer.
              </Text>
            </TouchableOpacity>

            {/* Signup Button */}
            <Button
              title="Create Account"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              disabled={!isValid || !termsAccepted || loading}
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

      <TermsModal visible={termsVisible} onClose={() => setTermsVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  langRow: { position: 'absolute', top: 16, right: 0 },
  logoSection: { alignItems: 'center', marginBottom: 36 },
  brandLogo: { width: 240, height: 91, marginBottom: 12 },
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
  // T&C checkbox row
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  termsText2: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.white },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  modalCloseBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
  },
  modalCloseTxt: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  modalScroll: { flex: 1 },
  termsText: { fontSize: 13, color: Colors.text, lineHeight: 22 },
});
