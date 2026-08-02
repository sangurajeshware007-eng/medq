/**
 * Hospital Onboarding Step 3 — Review & Submit
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Building2,
  FileText,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../../components/Button';
import Card from '../../../components/Card';
import StepProgressBar from '../../../components/onboarding/StepProgressBar';
import { Colors } from '../../../constants/Colors';
import onboardingService from '../../../services/onboardingService';
import { useHospitalOnboardingStore } from '../../../store/hospitalOnboardingStore';
import type { HospitalAddressStep } from '../../../store/hospitalOnboardingStore';
import { crossPlatformShadow } from '../../../utils/shadow';

import { formColumn } from '@/theme';

const STEP_LABELS = ['Details', 'Documents', 'Review'];

/** Flatten the structured address into a single display string for the review card. */
function formatAddress(addr: HospitalAddressStep | undefined | null): string {
  if (!addr || typeof addr !== 'object') return '—';
  const parts = [
    addr.addressLine1?.trim(),
    addr.addressLine2?.trim(),
    addr.city?.trim(),
    addr.state?.trim(),
  ].filter((p) => p && p.length > 0);
  if (parts.length === 0 && !addr.pincode) return '—';
  const joined = parts.join(', ');
  return addr.pincode ? `${joined} - ${addr.pincode}` : joined;
}

const DOC_LABELS: Record<string, string> = {
  REGISTRATION_CERTIFICATE: 'Registration Certificate',
  ACCREDITATION: 'Accreditation',
  LOGO: 'Hospital Logo',
  FACILITY_PHOTOS: 'Facility Photos',
};

export default function HospitalStep3() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === 'edit';
  const editSuffix = isEditMode ? '?mode=edit' : '';
  const store = useHospitalOnboardingStore();
  const { profile, documents, completedSteps } = store;
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Edit-mode saves already applied the changes directly during step1/step2 —
      // an approved hospital doesn't go through the approval cycle again. Just
      // route the owner back to their profile.
      if (isEditMode) {
        router.replace('/(tabs)/profile');
        return;
      }

      await onboardingService.submitHospitalOnboarding();
      // Don't reset store here — keep data for re-edit if rejected.
      // Store is cleared when status transitions to APPROVED (via layout hydration).
      router.replace('/onboarding/approval-pending?type=hospital');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const allDepartments = [...profile.departments, ...profile.customDepartments];
  const uploadedDocs = documents.documents.filter((d) => d.uri);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review & Submit</Text>
        <View style={{ width: 32 }} />
      </View>

      <StepProgressBar
        currentStep={3}
        totalSteps={3}
        labels={STEP_LABELS}
        completedSteps={completedSteps}
        onStepPress={(step) =>
          router.push(`/onboarding/hospital/step${step}${editSuffix}` as never)
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.reviewTitle}>Review your hospital profile</Text>
        <Text style={styles.reviewSubtitle}>
          Verify all information before submitting for approval.
        </Text>

        {/* Hospital Details */}
        <Card style={styles.reviewCard}>
          <View style={styles.cardTitleRow}>
            <Building2 size={18} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.cardTitle}>Hospital Details</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Name</Text>
            <Text style={styles.reviewValue}>{profile.name || '—'}</Text>
          </View>
          <View style={[styles.reviewRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
            <Text style={styles.reviewLabel}>Address</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <MapPin size={12} color={Colors.textSecondary} strokeWidth={2} />
              <Text style={styles.reviewValue}>{formatAddress(profile.address)}</Text>
            </View>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Phone</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Phone size={12} color={Colors.textSecondary} strokeWidth={2} />
              <Text style={styles.reviewValue}>{profile.phone || '—'}</Text>
            </View>
          </View>
          {profile.emergencyContact ? (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Emergency</Text>
              <Text style={styles.reviewValue}>{profile.emergencyContact}</Text>
            </View>
          ) : null}
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>24×7</Text>
            <Text style={styles.reviewValue}>{profile.is24x7 ? 'Yes' : 'No'}</Text>
          </View>
          {profile.establishedYear ? (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Established</Text>
              <Text style={styles.reviewValue}>{profile.establishedYear}</Text>
            </View>
          ) : null}
          {profile.totalBeds ? (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Total Beds</Text>
              <Text style={styles.reviewValue}>{profile.totalBeds}</Text>
            </View>
          ) : null}

          {/* Departments */}
          {allDepartments.length > 0 && (
            <>
              <Text style={[styles.reviewLabel, { marginTop: 10 }]}>Departments</Text>
              <View style={styles.chipRow}>
                {allDepartments.map((dept) => (
                  <View key={dept} style={styles.miniChip}>
                    <Text style={styles.miniChipText}>{dept}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Card>

        {/* Documents */}
        <Card style={styles.reviewCard}>
          <View style={styles.cardTitleRow}>
            <FileText size={18} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.cardTitle}>Documents</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Registration No.</Text>
            <Text style={styles.reviewValue}>{documents.registrationNumber || '—'}</Text>
          </View>
          {uploadedDocs.map((doc) => (
            <View key={doc.type} style={styles.docItem}>
              <CheckCircle size={14} color={Colors.trustGreen} strokeWidth={2.5} />
              <Text style={styles.docText}>{DOC_LABELS[doc.type] || doc.type}</Text>
              {doc.uri.match(/\.(jpg|jpeg|png|gif|webp)/i) && (
                <Image source={{ uri: doc.uri }} style={styles.docThumb} />
              )}
            </View>
          ))}
          {uploadedDocs.length === 0 && <Text style={styles.emptyText}>No documents uploaded</Text>}
        </Card>

        {/* Submit */}
        <Button
          title={isEditMode ? 'Done' : 'Submit for Approval'}
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitBtn}
          size="large"
        />

        <Text style={styles.disclaimer}>
          {isEditMode
            ? 'Your changes are already saved and live. Patients see the latest details immediately.'
            : 'By submitting, you confirm that all the information provided is accurate. Our team will review your hospital within 24–48 hours.'}
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
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
    ...crossPlatformShadow({ offsetY: 2, opacity: 0.08, radius: 8, elevation: 3 }),
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  scroll: { flex: 1 },
  scrollContent: { ...formColumn, padding: 20 },
  reviewTitle: { fontSize: 20, fontWeight: '900', color: Colors.text, marginBottom: 4 },
  reviewSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 20, lineHeight: 20 },
  reviewCard: { marginBottom: 14 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  reviewLabel: { fontSize: 13, color: Colors.textSecondary },
  reviewValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  miniChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
  },
  miniChipText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  docItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  docText: { fontSize: 14, color: Colors.text, flex: 1 },
  docThumb: { width: 36, height: 36, borderRadius: 6 },
  emptyText: { fontSize: 13, color: Colors.textLight, fontStyle: 'italic' },
  submitBtn: { marginTop: 20 },
  disclaimer: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
