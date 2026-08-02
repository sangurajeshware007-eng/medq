/**
 * Doctor Onboarding Step 4 — Review & Submit
 */
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  User,
  GraduationCap,
  Stethoscope,
  Building2,
  Clock,
  CheckCircle,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../../components/Button';
import Card from '../../../components/Card';
import StepProgressBar from '../../../components/onboarding/StepProgressBar';
import { Colors } from '../../../constants/Colors';
import { getSpecializationLabel } from '../../../constants/Specializations';
import onboardingService from '../../../services/onboardingService';
import { useDoctorOnboardingStore } from '../../../store/doctorOnboardingStore';
import { crossPlatformShadow } from '../../../utils/shadow';

import { formColumn } from '@/theme';

const STEP_LABELS = ['Profile', 'Details', 'Hospitals', 'Review'];
const GENDER_LABELS: Record<string, string> = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' };
const DAY_LABELS: Record<string, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday',
};

export default function DoctorStep4() {
  const router = useRouter();
  const store = useDoctorOnboardingStore();
  const { profile, details, linkedHospitals, completedSteps } = store;
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onboardingService.submitDoctorOnboarding();
      // Don't reset store here — keep data for re-edit if rejected.
      // Store is cleared when status transitions to APPROVED (via layout hydration).
      router.replace('/onboarding/approval-pending?type=doctor');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

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
        currentStep={4}
        totalSteps={4}
        labels={STEP_LABELS}
        completedSteps={completedSteps}
        onStepPress={(step) => router.push(`/onboarding/doctor/step${step}` as never)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.reviewTitle}>Review your profile before submitting</Text>
        <Text style={styles.reviewSubtitle}>
          Please verify all information is correct. You can go back to edit any section.
        </Text>

        {/* Card 1: Basic Info */}
        <Card style={styles.reviewCard}>
          <View style={styles.cardTitleRow}>
            <User size={18} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.cardTitle}>Basic Information</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Specialization</Text>
            <Text style={styles.reviewValue}>
              {profile.specialization ? getSpecializationLabel(profile.specialization) : '—'}
            </Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Gender</Text>
            <Text style={styles.reviewValue}>
              {GENDER_LABELS[profile.gender] || profile.gender || '—'}
            </Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Consultation Fee</Text>
            <Text style={styles.reviewValue}>₹{profile.consultationFee || '—'}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Registration No.</Text>
            <Text style={styles.reviewValue}>{profile.registrationNumber || '—'}</Text>
          </View>
          {profile.bio ? (
            <View style={[styles.reviewRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={styles.reviewLabel}>Bio</Text>
              <Text style={[styles.reviewValue, { marginTop: 4 }]} numberOfLines={3}>
                {profile.bio}
              </Text>
            </View>
          ) : null}
          {profile.languages.length > 0 && (
            <View style={styles.chipRow}>
              {profile.languages.map((l) => (
                <View key={l} style={styles.miniChip}>
                  <Text style={styles.miniChipText}>{l}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Card 2: Qualifications */}
        <Card style={styles.reviewCard}>
          <View style={styles.cardTitleRow}>
            <GraduationCap size={18} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.cardTitle}>Qualifications</Text>
          </View>
          {details.qualifications
            .filter((q) => q.degree)
            .map((q, i) => (
              <View key={i} style={styles.qualItem}>
                <CheckCircle size={14} color={Colors.trustGreen} strokeWidth={2.5} />
                <Text style={styles.qualText}>
                  {q.degree} — {q.institution} {q.year ? `(${q.year})` : ''}
                </Text>
              </View>
            ))}
          {details.qualifications.filter((q) => q.degree).length === 0 && (
            <Text style={styles.emptyText}>No qualifications added</Text>
          )}
        </Card>

        {/* Card 3: Services + Conditions */}
        <Card style={styles.reviewCard}>
          <View style={styles.cardTitleRow}>
            <Stethoscope size={18} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.cardTitle}>Services & Conditions</Text>
          </View>
          {[...details.services, ...details.customServices].length > 0 && (
            <>
              <Text style={styles.subLabel}>Services</Text>
              <View style={styles.chipRow}>
                {[...details.services, ...details.customServices].map((s) => (
                  <View key={s} style={styles.miniChip}>
                    <Text style={styles.miniChipText}>{s}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
          {[...details.conditions, ...details.customConditions].length > 0 && (
            <>
              <Text style={[styles.subLabel, { marginTop: 10 }]}>Conditions</Text>
              <View style={styles.chipRow}>
                {[...details.conditions, ...details.customConditions].map((c) => (
                  <View
                    key={c}
                    style={[styles.miniChip, { backgroundColor: Colors.trustGreenLight }]}
                  >
                    <Text style={[styles.miniChipText, { color: '#16A34A' }]}>{c}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Card>

        {/* Card 4: Linked Hospitals */}
        <Card style={styles.reviewCard}>
          <View style={styles.cardTitleRow}>
            <Building2 size={18} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.cardTitle}>Linked Hospitals ({linkedHospitals.length})</Text>
          </View>
          {linkedHospitals.map((h) => (
            <View key={h.hospitalId} style={styles.hospitalReview}>
              <Text style={styles.hospitalReviewName}>{h.hospitalName}</Text>
              <Text style={styles.hospitalReviewAddr}>{h.address}</Text>
              <Text style={styles.hospitalReviewFee}>₹{h.consultationFee}</Text>
              {h.availability.length > 0 && (
                <View style={styles.scheduleList}>
                  {h.availability.map((a) => (
                    <View key={a.day} style={styles.scheduleItem}>
                      <Clock size={12} color={Colors.textSecondary} strokeWidth={2} />
                      <Text style={styles.scheduleText}>
                        {DAY_LABELS[a.day]} — {a.sessions.length} session(s)
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
          {linkedHospitals.length === 0 && (
            <Text style={styles.emptyText}>No hospitals linked</Text>
          )}
        </Card>

        {/* Submit Button */}
        <Button
          title="Submit for Approval"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitBtn}
          size="large"
        />

        <Text style={styles.disclaimer}>
          By submitting, you confirm that all the information provided is accurate. Our team will
          review your profile within 24–48 hours.
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
  reviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  miniChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
  },
  miniChipText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  subLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 4 },
  qualItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  qualText: { fontSize: 14, color: Colors.text, flex: 1 },
  emptyText: { fontSize: 13, color: Colors.textLight, fontStyle: 'italic' },
  hospitalReview: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  hospitalReviewName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  hospitalReviewAddr: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  hospitalReviewFee: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginTop: 4 },
  scheduleList: { marginTop: 6 },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
  scheduleText: { fontSize: 12, color: Colors.textSecondary },
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
