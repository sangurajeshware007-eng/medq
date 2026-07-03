/**
 * Doctor Onboarding Step 2 — Qualifications, Services, Conditions, Awards
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react-native';
import { Colors } from '../../../constants/Colors';
import { crossPlatformShadow } from '../../../utils/shadow';
import { useDoctorOnboardingStore } from '../../../store/doctorOnboardingStore';
import onboardingService from '../../../services/onboardingService';
import StepProgressBar from '../../../components/onboarding/StepProgressBar';
import DynamicQualificationList from '../../../components/onboarding/DynamicQualificationList';
import ChipSelector from '../../../components/onboarding/ChipSelector';
import Input from '../../../components/Input';
import Button from '../../../components/Button';

const SERVICES = [
  'ECG', 'Echo', 'Angioplasty', 'Surgery',
  'X-Ray', 'MRI', 'Blood Test', 'Physiotherapy', 'Ultrasound',
];

const CONDITIONS = [
  'Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Arthritis',
  'Thyroid', 'PCOD', 'Back Pain', 'Migraine', 'Skin Allergy',
  'Fever', 'Cold & Cough', 'Obesity', 'Depression', 'Anxiety',
];

const STEP_LABELS = ['Profile', 'Details', 'Hospitals', 'Review'];

export default function DoctorStep2() {
  const router = useRouter();
  const { details, updateDetails, markStepCompleted, setCurrentStep, completedSteps } = useDoctorOnboardingStore();
  const [loading, setLoading] = useState(false);
  const [showAwards, setShowAwards] = useState(details.awards.length > 0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const validQuals = details.qualifications.filter((q) => q.degree && q.institution);
    if (validQuals.length === 0) errs.qualifications = 'At least one qualification is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveAndContinue = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const allServices = [...details.services, ...details.customServices];
      const allConditions = [...details.conditions, ...details.customConditions];
      const validQuals = details.qualifications
        .filter((q) => q.degree && q.institution)
        .map((q) => ({ degree: q.degree, institution: q.institution, year: Number(q.year) || 0 }));
      const validAwards = details.awards
        .filter((a) => a.title)
        .map((a) => ({ title: a.title, awardedBy: a.awardedBy, year: Number(a.year) || 0 }));

      await onboardingService.saveDoctorDetails({
        qualifications: validQuals,
        services: allServices,
        conditions: allConditions,
        awards: validAwards.length > 0 ? validAwards : undefined,
      });
      markStepCompleted(2);
      setCurrentStep(3);
      router.push('/onboarding/doctor/step3');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save details';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const updateAward = (index: number, field: string, value: string) => {
    const updated = details.awards.map((a, i) => (i === index ? { ...a, [field]: value } : a));
    updateDetails({ awards: updated });
  };

  const addAward = () => {
    updateDetails({ awards: [...details.awards, { title: '', awardedBy: '', year: '' }] });
  };

  const removeAward = (index: number) => {
    updateDetails({ awards: details.awards.filter((_, i) => i !== index) });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Qualifications & Details</Text>
        <View style={{ width: 32 }} />
      </View>

      <StepProgressBar
        currentStep={2}
        totalSteps={4}
        labels={STEP_LABELS}
        completedSteps={completedSteps}
        onStepPress={(step) => router.push(`/onboarding/doctor/step${step}` as never)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section A — Qualifications */}
        <DynamicQualificationList
          qualifications={details.qualifications}
          onChange={(q) => {
            updateDetails({ qualifications: q });
            setErrors((e) => ({ ...e, qualifications: '' }));
          }}
        />
        {errors.qualifications && <Text style={styles.errorText}>{errors.qualifications}</Text>}

        {/* Section B — Services */}
        <ChipSelector
          label="Services Offered"
          options={SERVICES}
          selected={[...details.services, ...details.customServices]}
          onSelectionChange={(selected) => {
            const predefined = selected.filter((s) => SERVICES.includes(s));
            const custom = selected.filter((s) => !SERVICES.includes(s));
            updateDetails({ services: predefined, customServices: custom });
          }}
          allowCustom
          customPlaceholder="Add custom service..."
        />

        {/* Section C — Conditions */}
        <ChipSelector
          label="Conditions Treated"
          options={CONDITIONS}
          selected={[...details.conditions, ...details.customConditions]}
          onSelectionChange={(selected) => {
            const predefined = selected.filter((s) => CONDITIONS.includes(s));
            const custom = selected.filter((s) => !CONDITIONS.includes(s));
            updateDetails({ conditions: predefined, customConditions: custom });
          }}
          allowCustom
          customPlaceholder="Add custom condition..."
        />

        {/* Section D — Awards (collapsible) */}
        <TouchableOpacity
          style={styles.collapsibleHeader}
          onPress={() => setShowAwards(!showAwards)}
        >
          <Text style={styles.collapsibleTitle}>Awards & Recognitions (Optional)</Text>
          {showAwards ? (
            <ChevronUp size={20} color={Colors.textSecondary} strokeWidth={2} />
          ) : (
            <ChevronDown size={20} color={Colors.textSecondary} strokeWidth={2} />
          )}
        </TouchableOpacity>

        {showAwards && (
          <View style={styles.awardsSection}>
            {details.awards.map((award, index) => (
              <View key={index} style={styles.awardCard}>
                <View style={styles.awardHeader}>
                  <Text style={styles.awardIndex}>Award {index + 1}</Text>
                  <TouchableOpacity onPress={() => removeAward(index)}>
                    <Trash2 size={16} color={Colors.error} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
                <Input
                  label="Title"
                  value={award.title}
                  onChangeText={(v) => updateAward(index, 'title', v)}
                  placeholder="e.g., Best Doctor Award"
                />
                <Input
                  label="Awarded By"
                  value={award.awardedBy}
                  onChangeText={(v) => updateAward(index, 'awardedBy', v)}
                  placeholder="e.g., IMA"
                />
                <Input
                  label="Year"
                  value={award.year}
                  onChangeText={(v) => updateAward(index, 'year', v.replace(/[^0-9]/g, ''))}
                  placeholder="e.g., 2022"
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.addBtn} onPress={addAward}>
              <Plus size={18} color={Colors.primary} strokeWidth={2.5} />
              <Text style={styles.addBtnText}>Add Award</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Navigation */}
        <View style={styles.navRow}>
          <Button
            title="Back"
            variant="outline"
            onPress={() => router.back()}
            style={styles.navBtn}
          />
          <Button
            title="Save & Continue"
            onPress={handleSaveAndContinue}
            loading={loading}
            disabled={loading}
            style={{ ...styles.navBtn, flex: 2 }}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white,
    ...crossPlatformShadow({ offsetY: 2, opacity: 0.08, radius: 8, elevation: 3 }),
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  errorText: { fontSize: 12, color: Colors.error, marginBottom: 12 },
  collapsibleHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight, marginTop: 8,
  },
  collapsibleTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  awardsSection: { marginTop: 8 },
  awardCard: {
    backgroundColor: Colors.background, borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.borderLight,
  },
  awardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  awardIndex: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  navBtn: { flex: 1 },
});

