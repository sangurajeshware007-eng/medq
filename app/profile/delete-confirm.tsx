/**
 * Delete Account confirmation screen.
 *
 * Two-factor confirm: the user must retype their phone number before the
 * irreversible delete is submitted. Mirrors the "type your username to
 * confirm" pattern used by GitHub, Instagram, LinkedIn.
 */
import { useRouter } from 'expo-router';
import { ChevronLeft, AlertTriangle, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useDeleteProfile } from '../../hooks/useApiHooks';

import { formColumn } from '@/theme';

export default function DeleteAccountConfirmScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const deleteProfile = useDeleteProfile();

  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');

  const userPhone = user?.phone ?? '';
  const phoneMatches = phone.trim() === userPhone;
  const canSubmit = phoneMatches && !deleteProfile.isPending;

  const handleDelete = () => {
    if (!phoneMatches) return;
    Alert.alert(
      'Delete account permanently?',
      'This cannot be undone. Your profile will be removed, upcoming bookings cancelled, and you will be signed out.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProfile.mutateAsync({
                confirmPhone: userPhone,
                reason: reason.trim() || undefined,
              });
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Unable to delete account.';
              Alert.alert('Could not delete', message);
              return;
            }
            Alert.alert(
              'Account deleted',
              'Your account has been permanently removed. Past bookings and reviews are retained for our records, but your personal details have been erased.',
              [
                {
                  text: 'OK',
                  onPress: async () => {
                    await logout();
                    router.replace('/(auth)/login');
                  },
                },
              ],
              { cancelable: false },
            );
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <ChevronLeft size={22} color={Colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delete Account</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.warningCard}>
            <AlertTriangle size={28} color={Colors.error} strokeWidth={2.2} />
            <Text style={styles.warningTitle}>This cannot be undone</Text>
            <Text style={styles.warningBody}>
              Your profile will be permanently removed. Upcoming bookings will be cancelled and you
              will be signed out from all devices.
            </Text>
          </View>

          <View style={styles.bulletList}>
            <Bullet text="Your name, email and photo will be erased." />
            <Bullet text="Your phone number will be released for future signup." />
            <Bullet text="Past bookings and reviews stay in our records (legally required)." />
          </View>

          <Text style={styles.label}>Type your phone to confirm</Text>
          <Text style={styles.subLabel}>
            Registered phone: <Text style={styles.phoneHint}>{userPhone || '—'}</Text>
          </Text>
          <TextInput
            style={[styles.input, phone.length > 0 && !phoneMatches && styles.inputError]}
            placeholder="+91XXXXXXXXXX"
            placeholderTextColor={Colors.textLight}
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoCorrect={false}
            value={phone}
            onChangeText={setPhone}
          />
          {phone.length > 0 && !phoneMatches && (
            <Text style={styles.errorText}>Phone does not match the registered number.</Text>
          )}

          <Text style={[styles.label, { marginTop: 20 }]}>Reason (optional)</Text>
          <TextInput
            style={[styles.input, styles.reasonInput]}
            placeholder="Help us understand why you're leaving"
            placeholderTextColor={Colors.textLight}
            value={reason}
            onChangeText={setReason}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[styles.deleteBtn, !canSubmit && styles.deleteBtnDisabled]}
            onPress={handleDelete}
            disabled={!canSubmit}
            activeOpacity={0.8}
          >
            {deleteProfile.isPending ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Trash2 size={16} color={Colors.white} strokeWidth={2.5} />
                <Text style={styles.deleteBtnText}>Permanently Delete</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bullet}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    ...formColumn,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  content: { ...formColumn, padding: 20, paddingBottom: 40 },
  warningCard: {
    backgroundColor: Colors.errorLight,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error + '30',
    gap: 8,
  },
  warningTitle: { fontSize: 16, fontWeight: '800', color: Colors.error },
  warningBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  bulletList: { marginTop: 20, gap: 10 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.textSecondary,
    marginTop: 7,
  },
  bulletText: { fontSize: 13, color: Colors.text, flex: 1, lineHeight: 19 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 24,
    marginBottom: 4,
  },
  subLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },
  phoneHint: { fontWeight: '700', color: Colors.text },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  inputError: { borderColor: Colors.error },
  reasonInput: { minHeight: 80, textAlignVertical: 'top' },
  errorText: { color: Colors.error, fontSize: 12, marginTop: 6 },
  deleteBtn: {
    marginTop: 28,
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteBtnDisabled: { opacity: 0.4 },
  deleteBtnText: { color: Colors.white, fontSize: 15, fontWeight: '800' },
  cancelBtn: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
});
