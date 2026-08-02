/**
 * Doctor Onboarding Step 1 — Profile & Consultation
 */
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ChevronLeft, Camera, Search, X, ChevronDown, ChevronRight } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../../components/Button';
import Input from '../../../components/Input';
import ChipSelector from '../../../components/onboarding/ChipSelector';
import DocumentUploadTile from '../../../components/onboarding/DocumentUploadTile';
import StepProgressBar from '../../../components/onboarding/StepProgressBar';
import { Colors } from '../../../constants/Colors';
import {
  SPECIALIZATIONS,
  SPECIALIZATION_CATEGORIES,
  getSpecializationLabel,
} from '../../../constants/Specializations';
import { useLanguage } from '../../../context/LanguageContext';
import onboardingService from '../../../services/onboardingService';
import storageService, { FileTooLargeError } from '../../../services/storageService';
import { useDoctorOnboardingStore } from '../../../store/doctorOnboardingStore';
import { crossPlatformShadow } from '../../../utils/shadow';

import { formColumn } from '@/theme';

const GENDERS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' },
];

const LANGUAGES = [
  'English',
  'Hindi',
  'Kannada',
  'Telugu',
  'Tamil',
  'Marathi',
  'Bengali',
  'Gujarati',
  'Malayalam',
  'Urdu',
];

const STEP_LABELS = ['Profile', 'Details', 'Hospitals', 'Review'];

export default function DoctorStep1() {
  const router = useRouter();
  const { profile, updateProfile, markStepCompleted, setCurrentStep, completedSteps } =
    useDoctorOnboardingStore();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [specSearch, setSpecSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customSpec, setCustomSpec] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredSpecs = useMemo(() => {
    const q = specSearch.trim().toLowerCase();
    if (!q) return SPECIALIZATIONS;
    return SPECIALIZATIONS.filter(
      (s) => s.label.toLowerCase().includes(q) || s.category.toLowerCase().includes(q),
    );
  }, [specSearch]);

  const groupedSpecs = useMemo(() => {
    const isSearching = specSearch.trim().length > 0;
    if (isSearching) return null;
    return SPECIALIZATION_CATEGORIES.map((cat) => ({
      ...cat,
      items: SPECIALIZATIONS.filter((s) => s.category === cat.key),
    })).filter((cat) => cat.items.length > 0);
  }, [specSearch]);

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectSpec = (value: string) => {
    updateProfile({ specialization: value });
    setShowSpecModal(false);
    setSpecSearch('');
    setExpandedCategories(new Set());
    setShowCustomInput(false);
    setCustomSpec('');
    setErrors((e) => ({ ...e, specialization: '' }));
  };

  const submitCustomSpec = () => {
    const v = customSpec.trim();
    if (!v) return;
    selectSpec(v);
  };

  /**
   * Upload the medical registration certificate to the private bucket.
   * The DocumentUploadTile component handles the ImagePicker — we just receive
   * the picked URI/mime, validate, push to storage, and update the store.
   */
  const handlePickCertificate = async (uri: string, fileName: string, mime: string) => {
    if (!['image/jpeg', 'image/png'].includes(mime)) {
      Alert.alert(
        t('certificateFormatHint') || 'Format not supported',
        t('certificateFormatHint') || 'Please choose a JPEG or PNG image.',
      );
      return;
    }
    updateProfile({
      registrationCertificateUri: uri,
      registrationCertificateFileName: fileName,
      registrationCertificateUploadStatus: 'uploading',
    });
    setErrors((e) => ({ ...e, registrationCertificate: '' }));
    try {
      const { objectKey } = await storageService.uploadFile(
        'DOCTOR_CERTIFICATE',
        uri,
        mime,
        fileName,
      );
      updateProfile({
        registrationCertificateKey: objectKey,
        registrationCertificateUploadStatus: 'done',
      });
    } catch (err) {
      updateProfile({
        registrationCertificateKey: '',
        registrationCertificateUploadStatus: 'error',
      });
      const msg =
        err instanceof FileTooLargeError
          ? t('certificateTooLarge') || 'Certificate must be less than 5 MB.'
          : t('certificateUploadFailed') || 'Could not upload the certificate. Please try again.';
      Alert.alert(t('uploadCertificate') || 'Upload certificate', msg);
    }
  };

  const handleRemoveCertificate = () => {
    updateProfile({
      registrationCertificateUri: '',
      registrationCertificateFileName: '',
      registrationCertificateKey: '',
      registrationCertificateUploadStatus: 'idle',
    });
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType || 'image/jpeg';
    setAvatarUploading(true);
    try {
      const { publicUrl } = await storageService.uploadFile('DOCTOR_AVATAR', asset.uri, mimeType);
      updateProfile({ avatarUrl: publicUrl ?? '' });
    } catch {
      Alert.alert('Upload Failed', 'Could not upload the profile photo. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!profile.specialization) errs.specialization = 'Specialization is required';
    if (!profile.consultationFee || Number(profile.consultationFee) <= 0)
      errs.consultationFee = 'Consultation fee must be greater than 0';
    if (!profile.registrationNumber) errs.registrationNumber = 'Registration number is required';
    if (
      !profile.registrationCertificateKey ||
      profile.registrationCertificateUploadStatus !== 'done'
    ) {
      errs.registrationCertificate =
        t('certificateRequired') || 'Registration certificate is required';
    }
    if (profile.bio.length > 500) errs.bio = 'Bio must be 500 characters or less';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveAndContinue = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Custom-typed specializations aren't in the backend enum — they map to
      // OTHER (the UI keeps showing the typed text via getSpecializationLabel).
      const knownSpecialization = SPECIALIZATIONS.some((sp) => sp.value === profile.specialization);
      await onboardingService.saveDoctorProfile({
        specialization: knownSpecialization ? profile.specialization : 'OTHER',
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth || undefined,
        consultationFee: Number(profile.consultationFee),
        // Tele-consultation hidden in this phase — always submitted as off.
        teleConsultation: false,
        clinicAddress: profile.clinicAddress || undefined,
        bio: profile.bio || undefined,
        languages: profile.languages,
        registrationNumber: profile.registrationNumber,
        registrationCertificateKey: profile.registrationCertificateKey,
        practiceStartedYear: profile.practiceStartedYear
          ? Number(profile.practiceStartedYear)
          : undefined,
        avatarUrl: profile.avatarUrl || undefined,
      });
      markStepCompleted(1);
      setCurrentStep(2);
      router.push('/onboarding/doctor/step2');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doctor Onboarding</Text>
        <View style={{ width: 32 }} />
      </View>

      <StepProgressBar
        currentStep={1}
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
        {/* Profile Photo */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarPicker}
            onPress={avatarUploading ? undefined : handlePickAvatar}
            activeOpacity={avatarUploading ? 1 : 0.7}
          >
            {avatarUploading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Camera size={28} color={Colors.primary} strokeWidth={1.5} />
            )}
          </TouchableOpacity>
          <View>
            <Text style={styles.avatarLabel}>Profile Photo</Text>
            <Text style={styles.avatarHint}>
              {avatarUploading
                ? 'Uploading...'
                : profile.avatarUrl
                  ? 'Tap to change'
                  : 'Tap to upload'}
            </Text>
          </View>
        </View>

        {/* Specialization */}
        <Text style={styles.sectionTitle}>Specialization *</Text>
        <TouchableOpacity
          style={[styles.picker, errors.specialization && styles.pickerError]}
          onPress={() => setShowSpecModal(true)}
        >
          <Text
            style={profile.specialization ? styles.pickerValue : styles.pickerPlaceholder}
            numberOfLines={1}
          >
            {profile.specialization
              ? getSpecializationLabel(profile.specialization)
              : 'Select specialization'}
          </Text>
          <ChevronDown size={18} color={Colors.textLight} strokeWidth={2} />
        </TouchableOpacity>
        {errors.specialization && <Text style={styles.errorText}>{errors.specialization}</Text>}

        {/* Specialization picker modal */}
        <Modal
          visible={showSpecModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setShowSpecModal(false);
            setSpecSearch('');
          }}
        >
          <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              {/* Modal header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Specialization</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowSpecModal(false);
                    setSpecSearch('');
                  }}
                  style={styles.modalClose}
                >
                  <X size={22} color={Colors.text} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {/* Search bar */}
              <View style={styles.searchBar}>
                <Search size={16} color={Colors.textLight} strokeWidth={2} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search specializations..."
                  placeholderTextColor={Colors.textLight}
                  value={specSearch}
                  onChangeText={setSpecSearch}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                />
                {specSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setSpecSearch('')}>
                    <X size={14} color={Colors.textLight} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Results */}
              {groupedSpecs ? (
                // Grouped by category
                <FlatList
                  data={groupedSpecs}
                  keyExtractor={(item) => item.key}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 32 }}
                  renderItem={({ item: cat }) => {
                    const isExpanded = expandedCategories.has(cat.key);
                    return (
                      <View>
                        <TouchableOpacity
                          style={styles.catRow}
                          onPress={() => toggleCategory(cat.key)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.catEmoji}>{cat.emoji}</Text>
                          <Text style={styles.catLabel}>{cat.label}</Text>
                          <Text style={styles.catCount}>{cat.items.length}</Text>
                          {isExpanded ? (
                            <ChevronDown size={16} color={Colors.textLight} strokeWidth={2} />
                          ) : (
                            <ChevronRight size={16} color={Colors.textLight} strokeWidth={2} />
                          )}
                        </TouchableOpacity>
                        {isExpanded &&
                          cat.items.map((spec) => (
                            <TouchableOpacity
                              key={spec.value}
                              style={[
                                styles.specRow,
                                profile.specialization === spec.value && styles.specRowActive,
                              ]}
                              onPress={() => selectSpec(spec.value)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.specRowText,
                                  profile.specialization === spec.value && styles.specRowTextActive,
                                ]}
                              >
                                {spec.label}
                              </Text>
                              {profile.specialization === spec.value && (
                                <View style={styles.specRowCheck} />
                              )}
                            </TouchableOpacity>
                          ))}
                      </View>
                    );
                  }}
                  ListFooterComponent={
                    showCustomInput ? (
                      <View style={styles.customInputBox}>
                        <Text style={styles.customInputLabel}>Enter your specialization</Text>
                        <TextInput
                          style={styles.customInputField}
                          value={customSpec}
                          onChangeText={setCustomSpec}
                          placeholder="e.g., Aerospace Medicine"
                          placeholderTextColor={Colors.textLight}
                          autoFocus
                          returnKeyType="done"
                          onSubmitEditing={submitCustomSpec}
                        />
                        <View style={styles.customInputRow}>
                          <TouchableOpacity
                            style={styles.customCancelBtn}
                            onPress={() => {
                              setShowCustomInput(false);
                              setCustomSpec('');
                            }}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.customCancelText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.customSaveBtn,
                              !customSpec.trim() && styles.customSaveBtnDisabled,
                            ]}
                            onPress={submitCustomSpec}
                            disabled={!customSpec.trim()}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.customSaveText}>Save</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.otherSpecRow}
                        onPress={() => setShowCustomInput(true)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.otherSpecEmoji}>📝</Text>
                        <Text style={styles.otherSpecText}>Other (Specify Your Own)</Text>
                        <ChevronRight size={14} color={Colors.primary} strokeWidth={2} />
                      </TouchableOpacity>
                    )
                  }
                />
              ) : (
                // Flat search results
                <FlatList
                  data={filteredSpecs}
                  keyExtractor={(item) => item.value}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 32 }}
                  ListEmptyComponent={
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResults}>No match for "{specSearch}"</Text>
                      <TouchableOpacity
                        style={styles.useCustomBtn}
                        onPress={() => selectSpec(specSearch.trim())}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.useCustomBtnText}>
                          Use "{specSearch.trim()}" as my specialization
                        </Text>
                      </TouchableOpacity>
                    </View>
                  }
                  ListFooterComponent={
                    filteredSpecs.length > 0 ? (
                      <TouchableOpacity
                        style={styles.useCustomBtn}
                        onPress={() => selectSpec(specSearch.trim())}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.useCustomBtnText}>
                          Use "{specSearch.trim()}" as custom specialization
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  }
                  renderItem={({ item: spec }) => (
                    <TouchableOpacity
                      style={[
                        styles.specRow,
                        profile.specialization === spec.value && styles.specRowActive,
                      ]}
                      onPress={() => selectSpec(spec.value)}
                      activeOpacity={0.7}
                    >
                      <View>
                        <Text
                          style={[
                            styles.specRowText,
                            profile.specialization === spec.value && styles.specRowTextActive,
                          ]}
                        >
                          {spec.label}
                        </Text>
                        <Text style={styles.specRowCategory}>
                          {spec.categoryEmoji}{' '}
                          {SPECIALIZATION_CATEGORIES.find((c) => c.key === spec.category)?.label}
                        </Text>
                      </View>
                      {profile.specialization === spec.value && (
                        <View style={styles.specRowCheck} />
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>

        {/* Gender */}
        <Text style={styles.sectionTitle}>Gender</Text>
        <View style={styles.genderRow}>
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g.value}
              style={[styles.genderPill, profile.gender === g.value && styles.genderPillActive]}
              onPress={() => updateProfile({ gender: g.value })}
            >
              <Text
                style={[styles.genderText, profile.gender === g.value && styles.genderTextActive]}
              >
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Consultation Fee */}
        <Input
          label="Consultation Fee (₹) *"
          value={profile.consultationFee}
          onChangeText={(v) => {
            updateProfile({ consultationFee: v.replace(/[^0-9]/g, '') });
            setErrors((e) => ({ ...e, consultationFee: '' }));
          }}
          placeholder="e.g., 500"
          keyboardType="numeric"
          error={errors.consultationFee}
        />

        {/* Registration Number */}
        <Input
          label="Medical Registration Number *"
          value={profile.registrationNumber}
          onChangeText={(v) => {
            updateProfile({ registrationNumber: v });
            setErrors((e) => ({ ...e, registrationNumber: '' }));
          }}
          placeholder="e.g., KMC/12345"
          error={errors.registrationNumber}
        />

        {/* Medical Registration Certificate (JPEG/PNG, <5MB) */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>
            {t('medicalRegistrationCertificate') || 'Medical Registration Certificate'} *
          </Text>
          <DocumentUploadTile
            type="REGISTRATION_CERTIFICATE"
            fileName={profile.registrationCertificateFileName}
            uri={profile.registrationCertificateUri}
            required
            uploadStatus={profile.registrationCertificateUploadStatus}
            onPick={handlePickCertificate}
            onRemove={handleRemoveCertificate}
          />
          <Text style={styles.fieldHint}>
            {t('certificateFormatHint') || 'JPEG or PNG, less than 5 MB.'}
          </Text>
          {errors.registrationCertificate ? (
            <Text style={styles.fieldError}>{errors.registrationCertificate}</Text>
          ) : null}
        </View>

        {/* Practice Started Year */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Practice Started Year</Text>
          <View style={styles.fieldInputBox}>
            <TextInput
              style={styles.fieldInput}
              value={String(profile.practiceStartedYear ?? '')}
              onChangeText={(v) =>
                updateProfile({ practiceStartedYear: v.replace(/[^0-9]/g, '').slice(0, 4) })
              }
              placeholder="e.g., 2010"
              placeholderTextColor={Colors.textLight}
              keyboardType="number-pad"
              maxLength={4}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Clinic Address */}
        <Input
          label="Clinic Address"
          value={profile.clinicAddress}
          onChangeText={(v) => updateProfile({ clinicAddress: v })}
          placeholder="Enter your clinic address"
          multiline
        />

        {/* Bio */}
        <Input
          label="About / Bio"
          value={profile.bio}
          onChangeText={(v) => {
            if (v.length <= 500) updateProfile({ bio: v });
          }}
          placeholder="Tell patients about yourself..."
          multiline
          error={errors.bio}
        />
        <Text style={styles.charCount}>{profile.bio.length}/500</Text>

        {/* Languages */}
        <ChipSelector
          label="Languages Spoken"
          options={LANGUAGES}
          selected={profile.languages}
          onSelectionChange={(langs) => updateProfile({ languages: langs })}
          allowCustom
          customPlaceholder="Other language..."
        />

        {/* Submit */}
        <Button
          title="Save & Continue"
          onPress={handleSaveAndContinue}
          loading={loading}
          // Block the action while the cert is mid-upload or missing — the
          // validate() call above shows the inline error, but disabling the
          // button is a clearer affordance.
          disabled={
            loading ||
            profile.registrationCertificateUploadStatus === 'uploading' ||
            !profile.registrationCertificateKey
          }
          style={styles.submitBtn}
        />

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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginBottom: 4,
  },
  pickerError: { borderColor: Colors.error },
  pickerValue: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '600', marginRight: 8 },
  pickerPlaceholder: { flex: 1, fontSize: 15, color: Colors.textLight, marginRight: 8 },
  errorText: { fontSize: 12, color: Colors.error, marginBottom: 8 },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  specChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  specChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  specChipText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  specChipTextActive: { color: Colors.white },
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  genderPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  genderPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  genderText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  genderTextActive: { color: Colors.white },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  charCount: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: -12,
    marginBottom: 12,
  },
  submitBtn: { marginTop: 8 },
  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatarPicker: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  avatarHint: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  // Practice-Started-Year field — must match Input.tsx styling
  fieldBlock: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  fieldInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
  },
  fieldInput: { flex: 1, fontSize: 16, color: Colors.text, paddingVertical: 14 },
  fieldHint: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  fieldError: { fontSize: 12, color: Colors.error, marginTop: 4 },

  // Specialization picker modal
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  modalClose: { padding: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text, padding: 0 },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  catEmoji: { fontSize: 18 },
  catLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.text },
  catCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  specRowActive: { backgroundColor: Colors.primaryLight },
  specRowText: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  specRowTextActive: { color: Colors.primary, fontWeight: '700' },
  specRowCategory: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  specRowCheck: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  noResults: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  noResultsContainer: { alignItems: 'center', paddingVertical: 8 },
  useCustomBtn: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    alignItems: 'center',
  },
  useCustomBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '700', textAlign: 'center' },
  otherSpecRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  otherSpecEmoji: { fontSize: 16 },
  otherSpecText: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  customInputBox: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customInputLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  customInputField: {
    fontSize: 15,
    color: Colors.text,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customInputRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  customCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customCancelText: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  customSaveBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  customSaveBtnDisabled: { opacity: 0.5 },
  customSaveText: { fontSize: 14, color: Colors.white, fontWeight: '700' },
});
