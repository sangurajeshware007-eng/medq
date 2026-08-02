/**
 * Doctor Edit Profile Screen
 *
 * Three tabs: Profile (basic info + photo + fees) | Availability (time slots) | Details (qualifications etc.)
 * Each tab saves independently to the backend.
 */
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Camera,
  Plus,
  Trash2,
  ChevronDown,
  Check,
  Building2,
  BookOpen,
  Award,
  Zap,
  Lock,
  ArrowRight,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
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

import Button from '../../components/Button';
import EcgLoader from '../../components/EcgLoader';
import Input from '../../components/Input';
import AvailabilityBuilder from '../../components/onboarding/AvailabilityBuilder';
import { Colors } from '../../constants/Colors';
import {
  SPECIALIZATIONS,
  SPECIALIZATION_CATEGORIES,
  getSpecializationLabel,
} from '../../constants/Specializations';
import type {
  DoctorSelfProfile,
  SelfQualification,
  SelfAward,
  SelfAvailabilitySlot,
} from '../../services/doctorService';
import doctorService from '../../services/doctorService';
import storageService from '../../services/storageService';
import type { DayAvailability, SessionEntry } from '../../store/doctorOnboardingStore';
import { crossPlatformShadow } from '../../utils/shadow';

import { contentColumn } from '@/theme';

// ─── Constants ────────────────────────────────────────────────────────────

const TABS = ['Profile', 'Availability', 'Details'] as const;
type Tab = (typeof TABS)[number];

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

const PRESET_SERVICES = [
  'ECG',
  'Echo',
  'Angioplasty',
  'Surgery',
  'X-Ray',
  'MRI',
  'Blood Test',
  'Physiotherapy',
  'Ultrasound',
];
const PRESET_CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Heart Disease',
  'Arthritis',
  'Thyroid',
  'PCOD',
  'Back Pain',
  'Migraine',
  'Skin Allergy',
  'Fever',
  'Cold & Cough',
  'Obesity',
  'Depression',
  'Anxiety',
];

// ─── Component ────────────────────────────────────────────────────────────

export default function DoctorEditProfile() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('Profile');
  const [profile, setProfile] = useState<DoctorSelfProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Profile tab state
  const [specialization, setSpecialization] = useState('');
  const [showSpecPicker, setShowSpecPicker] = useState(false);
  const [specSearch, setSpecSearch] = useState('');
  const [gender, setGender] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [bio, setBio] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [practiceYear, setPracticeYear] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [customLang, setCustomLang] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  // ── Availability tab state
  const [slots, setSlots] = useState<SelfAvailabilitySlot[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | undefined>(undefined);

  // Tracks days the user has toggled ON in the AvailabilityBuilder but
  // hasn't added a session for yet. The backend only stores sessions, so a
  // day with zero sessions has nothing in `slots` — without this we'd lose
  // the chip's "active" state on the very next re-render.
  // Keyed by hospitalId so each hospital tab has its own pending set.
  const [emptyActiveDaysByHospital, setEmptyActiveDaysByHospital] = useState<
    Record<string, string[]>
  >({});

  // ── Details tab state
  const [qualifications, setQualifications] = useState<SelfQualification[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [customService, setCustomService] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [customCondition, setCustomCondition] = useState('');
  const [awards, setAwards] = useState<SelfAward[]>([]);

  // ── Spec picker helpers
  const filteredSpecs = useMemo(() => {
    const q = specSearch.trim().toLowerCase();
    if (!q) return null;
    return SPECIALIZATIONS.filter((s) => s.label.toLowerCase().includes(q));
  }, [specSearch]);

  // ─── Load ──────────────────────────────────────────────────────────────

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await doctorService.getMyProfile();
      setProfile(data);
      populateForm(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load profile';
      setLoadError(msg);
    }
  };

  const populateForm = (data: DoctorSelfProfile) => {
    setSpecialization(data.specialization);
    setGender(data.gender ?? '');
    setConsultationFee(String(data.consultationFee));
    setBio(data.bio ?? '');
    setClinicAddress(data.clinicAddress ?? '');
    setAvatarUrl(data.avatarUrl ?? '');
    setPracticeYear(data.practiceStartedDate ? data.practiceStartedDate.substring(0, 4) : '');
    setLanguages(data.languagesSpoken);
    setSlots(data.availability);
    setQualifications(
      data.qualifications.length > 0
        ? data.qualifications
        : [{ degree: '', institution: '', year: undefined }],
    );
    setServices(data.services);
    setConditions(data.conditions);
    setAwards(data.awards);
    if (data.hospitals.length > 0) {
      setSelectedHospitalId(data.hospitals[0].hospitalId);
    }
  };

  // ─── Photo upload ──────────────────────────────────────────────────────

  const pickAvatar = async () => {
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
    setAvatarUploading(true);
    try {
      const { publicUrl } = await storageService.uploadFile(
        'DOCTOR_AVATAR',
        asset.uri,
        asset.mimeType || 'image/jpeg',
      );
      setAvatarUrl(publicUrl ?? '');
    } catch {
      Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  // ─── Save handlers ─────────────────────────────────────────────────────

  const saveProfile = async () => {
    if (!consultationFee || Number(consultationFee) <= 0) {
      Alert.alert('Validation', 'Consultation fee must be greater than 0');
      return;
    }
    setSaving(true);
    try {
      const updated = await doctorService.updateMyProfile({
        specialization: specialization || undefined,
        gender: gender || undefined,
        consultationFee: Number(consultationFee),
        bio: bio || undefined,
        clinicAddress: clinicAddress || undefined,
        languagesSpoken: languages,
        avatarUrl: avatarUrl || undefined,
        practiceStartedYear: practiceYear ? Number(practiceYear) : undefined,
      });
      setProfile(updated);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      const updated = await doctorService.updateMyAvailability({
        hospitalId: selectedHospitalId,
        slots: slots
          .filter((s) => !selectedHospitalId || s.hospitalId === selectedHospitalId)
          .map((s) => ({
            dayOfWeek: s.dayOfWeek,
            sessionName: s.sessionName,
            sessionType: s.sessionType,
            startTime: s.startTime,
            endTime: s.endTime,
            slotDurationMinutes: s.slotDurationMinutes,
            maxPatientsPerSlot: s.maxPatientsPerSlot,
            isAvailable: s.isAvailable,
            hospitalId: s.hospitalId,
          })),
      });
      setProfile(updated);
      Alert.alert('Saved', 'Availability updated successfully.');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveDetails = async () => {
    const validQuals = qualifications.filter((q) => q.degree.trim() && q.institution.trim());
    setSaving(true);
    try {
      const updated = await doctorService.updateMyDetails({
        qualifications: validQuals.map((q) => ({
          degree: q.degree,
          institution: q.institution,
          year: q.year,
        })),
        services,
        conditions,
        awards: awards
          .filter((a) => a.title.trim())
          .map((a) => ({
            title: a.title,
            awardedBy: a.awardedBy,
            year: a.year,
          })),
      });
      setProfile(updated);
      Alert.alert('Saved', 'Details updated successfully.');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ─── Availability helpers ─────────────────────────────────────────────
  // The backend stores availability as a flat list keyed by (dayOfWeek, hospitalId).
  // The shared AvailabilityBuilder component (also used in onboarding) works with
  // a per-hospital, per-day grouped shape. These helpers convert between them so we
  // can render the same UI here as in onboarding.

  const DAY_NUM_TO_CODE = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const DAY_CODE_TO_NUM: Record<string, number> = {
    SUN: 0,
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    FRI: 5,
    SAT: 6,
  };

  /** Group flat slots for the currently selected hospital into DayAvailability[]. */
  const builderAvailability = useMemo<DayAvailability[]>(() => {
    const filtered = slots.filter(
      (s) => !selectedHospitalId || s.hospitalId === selectedHospitalId || !s.hospitalId,
    );
    const byDay: Record<string, SessionEntry[]> = {};
    filtered.forEach((s) => {
      const code = DAY_NUM_TO_CODE[s.dayOfWeek];
      if (!code) return;
      (byDay[code] ??= []).push({
        sessionName: s.sessionName,
        sessionType: s.sessionType,
        startTime: s.startTime,
        endTime: s.endTime,
        slotDurationMinutes: s.slotDurationMinutes,
        maxPatientsPerSlot: s.maxPatientsPerSlot,
      });
    });
    // Merge in days the user just activated but hasn't added a session for
    // yet — without this, the chip flips back to inactive on next render.
    const emptyDays = emptyActiveDaysByHospital[selectedHospitalId ?? ''] ?? [];
    emptyDays.forEach((d) => {
      if (!byDay[d]) byDay[d] = [];
    });
    return Object.entries(byDay).map(([day, sessions]) => ({ day, sessions }));
  }, [slots, selectedHospitalId, emptyActiveDaysByHospital]);

  /**
   * Sessions the doctor already has at OTHER hospitals for the same weekday.
   * Feeds AvailabilityBuilder's cross-hospital overlap check so the doctor
   * can't schedule themselves at two places at the same time.
   */
  const crossHospitalBusy = useMemo<
    Record<
      string,
      { hospitalName: string; sessionName: string; startTime: string; endTime: string }[]
    >
  >(() => {
    if (!profile) return {};
    const hospitalNameById = new Map(profile.hospitals.map((h) => [h.hospitalId, h.hospitalName]));
    const grouped: Record<
      string,
      { hospitalName: string; sessionName: string; startTime: string; endTime: string }[]
    > = {};
    slots.forEach((s) => {
      if (!s.hospitalId || s.hospitalId === selectedHospitalId) return;
      const code = DAY_NUM_TO_CODE[s.dayOfWeek];
      if (!code) return;
      (grouped[code] ??= []).push({
        hospitalName: hospitalNameById.get(s.hospitalId) ?? 'another hospital',
        sessionName: s.sessionName,
        startTime: s.startTime,
        endTime: s.endTime,
      });
    });
    return grouped;
  }, [slots, selectedHospitalId, profile]);

  /** Replace the selected hospital's slots with the builder's grouped output. */
  const handleAvailabilityChange = (next: DayAvailability[]) => {
    const otherHospitalSlots = slots.filter(
      (s) => selectedHospitalId && s.hospitalId !== selectedHospitalId && !!s.hospitalId,
    );
    const newSlotsForHospital: SelfAvailabilitySlot[] = next.flatMap((day) =>
      day.sessions.map((s) => ({
        dayOfWeek: DAY_CODE_TO_NUM[day.day] ?? 1,
        sessionName: s.sessionName,
        sessionType: s.sessionType,
        startTime: s.startTime,
        endTime: s.endTime,
        slotDurationMinutes: s.slotDurationMinutes,
        maxPatientsPerSlot: s.maxPatientsPerSlot,
        isAvailable: true,
        hospitalId: selectedHospitalId,
      })),
    );
    setSlots([...otherHospitalSlots, ...newSlotsForHospital]);

    // Remember days that are "active but empty" so the chip stays selected
    // until the user either adds a session (which puts the day into `slots`)
    // or toggles it off again.
    const emptyDays = next.filter((d) => d.sessions.length === 0).map((d) => d.day);
    setEmptyActiveDaysByHospital((prev) => ({
      ...prev,
      [selectedHospitalId ?? '']: emptyDays,
    }));
  };

  // ─── Details helpers ──────────────────────────────────────────────────

  const toggleChip = (value: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  const addQualification = () =>
    setQualifications((prev) => [...prev, { degree: '', institution: '', year: undefined }]);

  const removeQualification = (idx: number) =>
    setQualifications((prev) => prev.filter((_, i) => i !== idx));

  const updateQual = (idx: number, key: keyof SelfQualification, value: any) =>
    setQualifications((prev) => prev.map((q, i) => (i === idx ? { ...q, [key]: value } : q)));

  const addAward = () =>
    setAwards((prev) => [...prev, { title: '', awardedBy: undefined, year: undefined }]);

  const removeAward = (idx: number) => setAwards((prev) => prev.filter((_, i) => i !== idx));

  const updateAward = (idx: number, key: keyof SelfAward, value: any) =>
    setAwards((prev) => prev.map((a, i) => (i === idx ? { ...a, [key]: value } : a)));

  // ─── Render ───────────────────────────────────────────────────────────

  if (!profile && !loadError) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerLoader}>
          <EcgLoader width={140} height={36} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerLoader}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Button title="Retry" onPress={loadProfile} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.strengthBadge}>
          <Text style={styles.strengthText}>{profile!.profileStrength}%</Text>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Tab: Profile ─────────────────────────────────────────────── */}
      {activeTab === 'Profile' && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Photo */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={styles.avatarPicker}
                onPress={avatarUploading ? undefined : pickAvatar}
                activeOpacity={avatarUploading ? 1 : 0.7}
              >
                {avatarUploading ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Camera size={28} color={Colors.primary} strokeWidth={1.5} />
                )}
              </TouchableOpacity>
              <View>
                <Text style={styles.avatarLabel}>Profile Photo</Text>
                <Text style={styles.avatarHint}>
                  {avatarUploading ? 'Uploading...' : avatarUrl ? 'Tap to change' : 'Tap to upload'}
                </Text>
              </View>
            </View>

            {/* Specialization */}
            <Text style={styles.sectionLabel}>Specialization</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowSpecPicker(true)}>
              <Text
                style={specialization ? styles.pickerValue : styles.pickerPlaceholder}
                numberOfLines={1}
              >
                {specialization ? getSpecializationLabel(specialization) : 'Select specialization'}
              </Text>
              <ChevronDown size={16} color={Colors.textLight} strokeWidth={2} />
            </TouchableOpacity>

            {/* Gender */}
            <Text style={styles.sectionLabel}>Gender</Text>
            <View style={styles.pillRow}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.pill, gender === g.value && styles.pillActive]}
                  onPress={() => setGender(g.value)}
                >
                  <Text style={[styles.pillText, gender === g.value && styles.pillTextActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Fees */}
            <Input
              label="Consultation Fee (₹) *"
              value={consultationFee}
              onChangeText={(v) => setConsultationFee(v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="e.g. 500"
            />

            {/* Bio */}
            <Input
              label="About / Bio"
              value={bio}
              onChangeText={(v) => {
                if (v.length <= 500) setBio(v);
              }}
              placeholder="Tell patients about yourself..."
              multiline
            />
            <Text style={styles.charCount}>{bio.length}/500</Text>

            {/* Clinic Address */}
            <Input
              label="Clinic Address"
              value={clinicAddress}
              onChangeText={setClinicAddress}
              placeholder="Enter your clinic address"
              multiline
            />

            {/* Practice Year */}
            <Input
              label="Practice Started Year"
              value={practiceYear}
              onChangeText={(v) => setPracticeYear(v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="e.g. 2010"
              maxLength={4}
            />

            {/* Languages */}
            <Text style={styles.sectionLabel}>Languages Spoken</Text>
            <View style={styles.chipWrap}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.chip, languages.includes(lang) && styles.chipActive]}
                  onPress={() => toggleChip(lang, languages, setLanguages)}
                >
                  <Text
                    style={[styles.chipText, languages.includes(lang) && styles.chipTextActive]}
                  >
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                placeholder="Other language..."
                placeholderTextColor={Colors.textLight}
                value={customLang}
                onChangeText={setCustomLang}
                onSubmitEditing={() => {
                  const v = customLang.trim();
                  if (v && !languages.includes(v)) setLanguages((prev) => [...prev, v]);
                  setCustomLang('');
                }}
                returnKeyType="done"
              />
            </View>

            <Button
              title="Save Profile"
              onPress={saveProfile}
              loading={saving}
              disabled={saving}
              style={styles.saveBtn}
            />
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ── Tab: Availability ─────────────────────────────────────────── */}
      {activeTab === 'Availability' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hospital selector (if multiple) */}
          {profile!.hospitals.length > 1 && (
            <>
              <Text style={styles.sectionLabel}>Hospital</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.hospitalScroll}
              >
                {profile!.hospitals.map((h) => (
                  <TouchableOpacity
                    key={h.hospitalId}
                    style={[
                      styles.hospitalChip,
                      selectedHospitalId === h.hospitalId && styles.hospitalChipActive,
                    ]}
                    onPress={() => setSelectedHospitalId(h.hospitalId)}
                  >
                    <Building2
                      size={12}
                      color={selectedHospitalId === h.hospitalId ? Colors.white : Colors.primary}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.hospitalChipText,
                        selectedHospitalId === h.hospitalId && styles.hospitalChipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {h.hospitalName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Same builder as the onboarding flow — toggle days, add/edit/copy sessions */}
          <AvailabilityBuilder
            hospitalName={
              profile!.hospitals.find((h) => h.hospitalId === selectedHospitalId)?.hospitalName ??
              profile!.hospitals[0]?.hospitalName ??
              'this hospital'
            }
            availability={builderAvailability}
            onChange={handleAvailabilityChange}
            crossHospitalBusy={crossHospitalBusy}
          />

          <Button
            title="Save Availability"
            onPress={saveAvailability}
            loading={saving}
            disabled={saving}
            style={styles.saveBtn}
          />
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── Tab: Details ──────────────────────────────────────────────── */}
      {activeTab === 'Details' && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Qualifications */}
            <View style={styles.sectionHeader}>
              <BookOpen size={16} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Qualifications</Text>
            </View>
            {qualifications.map((q, idx) => (
              <View key={idx} style={styles.listCard}>
                <View style={styles.listCardHeader}>
                  <Text style={styles.listCardTitle}>Qualification {idx + 1}</Text>
                  {qualifications.length > 1 && (
                    <TouchableOpacity onPress={() => removeQualification(idx)}>
                      <Trash2 size={14} color={Colors.error} strokeWidth={2} />
                    </TouchableOpacity>
                  )}
                </View>
                <Input
                  label="Degree"
                  value={q.degree}
                  onChangeText={(v) => updateQual(idx, 'degree', v)}
                  placeholder="e.g. MBBS, MD"
                />
                <Input
                  label="Institution"
                  value={q.institution}
                  onChangeText={(v) => updateQual(idx, 'institution', v)}
                  placeholder="e.g. AIIMS New Delhi"
                />
                <Input
                  label="Year (optional)"
                  value={q.year != null ? String(q.year) : ''}
                  onChangeText={(v) => updateQual(idx, 'year', v ? Number(v) : undefined)}
                  keyboardType="numeric"
                  placeholder="e.g. 2005"
                  maxLength={4}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.addListBtn} onPress={addQualification}>
              <Plus size={14} color={Colors.primary} strokeWidth={2.5} />
              <Text style={styles.addListText}>Add Qualification</Text>
            </TouchableOpacity>

            {/* Services */}
            <View style={styles.sectionHeader}>
              <Check size={16} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Services Offered</Text>
            </View>
            <View style={styles.chipWrap}>
              {PRESET_SERVICES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, services.includes(s) && styles.chipActive]}
                  onPress={() => toggleChip(s, services, setServices)}
                >
                  <Text style={[styles.chipText, services.includes(s) && styles.chipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                placeholder="Other service..."
                placeholderTextColor={Colors.textLight}
                value={customService}
                onChangeText={setCustomService}
                onSubmitEditing={() => {
                  const v = customService.trim();
                  if (v && !services.includes(v)) setServices((prev) => [...prev, v]);
                  setCustomService('');
                }}
                returnKeyType="done"
              />
            </View>

            {/* Conditions treated */}
            <View style={styles.sectionHeader}>
              <Check size={16} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Conditions Treated</Text>
            </View>
            <View style={styles.chipWrap}>
              {PRESET_CONDITIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, conditions.includes(c) && styles.chipActive]}
                  onPress={() => toggleChip(c, conditions, setConditions)}
                >
                  <Text style={[styles.chipText, conditions.includes(c) && styles.chipTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                placeholder="Other condition..."
                placeholderTextColor={Colors.textLight}
                value={customCondition}
                onChangeText={setCustomCondition}
                onSubmitEditing={() => {
                  const v = customCondition.trim();
                  if (v && !conditions.includes(v)) setConditions((prev) => [...prev, v]);
                  setCustomCondition('');
                }}
                returnKeyType="done"
              />
            </View>

            {/* Awards */}
            <View style={styles.sectionHeader}>
              <Award size={16} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Awards & Recognition</Text>
            </View>
            {awards.map((a, idx) => (
              <View key={idx} style={styles.listCard}>
                <View style={styles.listCardHeader}>
                  <Text style={styles.listCardTitle}>Award {idx + 1}</Text>
                  <TouchableOpacity onPress={() => removeAward(idx)}>
                    <Trash2 size={14} color={Colors.error} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
                <Input
                  label="Title"
                  value={a.title}
                  onChangeText={(v) => updateAward(idx, 'title', v)}
                  placeholder="e.g. Best Cardiologist Award"
                />
                <Input
                  label="Awarded By (optional)"
                  value={a.awardedBy ?? ''}
                  onChangeText={(v) => updateAward(idx, 'awardedBy', v || undefined)}
                  placeholder="e.g. IMA Karnataka"
                />
                <Input
                  label="Year (optional)"
                  value={a.year != null ? String(a.year) : ''}
                  onChangeText={(v) => updateAward(idx, 'year', v ? Number(v) : undefined)}
                  keyboardType="numeric"
                  placeholder="e.g. 2022"
                  maxLength={4}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.addListBtn} onPress={addAward}>
              <Plus size={14} color={Colors.primary} strokeWidth={2.5} />
              <Text style={styles.addListText}>Add Award</Text>
            </TouchableOpacity>

            <Button
              title="Save Details"
              onPress={saveDetails}
              loading={saving}
              disabled={saving}
              style={styles.saveBtn}
            />
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Specialization picker modal */}
      <Modal
        visible={showSpecPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowSpecPicker(false);
          setSpecSearch('');
        }}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Specialization</Text>
            <TouchableOpacity
              onPress={() => {
                setShowSpecPicker(false);
                setSpecSearch('');
              }}
              style={styles.modalClose}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={Colors.textLight}
              value={specSearch}
              onChangeText={setSpecSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
          <FlatList
            data={filteredSpecs ?? SPECIALIZATIONS}
            keyExtractor={(item) => item.value}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.specRow, specialization === item.value && styles.specRowActive]}
                onPress={() => {
                  setSpecialization(item.value);
                  setShowSpecPicker(false);
                  setSpecSearch('');
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.specRowText,
                      specialization === item.value && styles.specRowTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {specSearch.trim() && (
                    <Text style={styles.specRowCategory}>
                      {item.categoryEmoji}{' '}
                      {SPECIALIZATION_CATEGORIES.find((c) => c.key === item.category)?.label}
                    </Text>
                  )}
                </View>
                {specialization === item.value && (
                  <Check size={16} color={Colors.primary} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centerLoader: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: Colors.textSecondary },
  errorText: { fontSize: 14, color: Colors.error, textAlign: 'center' },

  header: {
    ...contentColumn,
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
  strengthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
  },
  strengthText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: Colors.primary },
  tabLabel: { fontSize: 13, fontWeight: '600', color: Colors.textLight },
  tabLabelActive: { color: Colors.primary },

  scroll: { flex: 1 },
  scrollContent: { ...contentColumn, padding: 20 },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    marginTop: 20,
  },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },

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

  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginBottom: 12,
  },
  pickerValue: { fontSize: 15, color: Colors.text, fontWeight: '600', flex: 1 },
  pickerPlaceholder: { fontSize: 15, color: Colors.textLight, flex: 1 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  pillTextActive: { color: Colors.white },
  pillSm: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  pillSmText: { fontSize: 12, fontWeight: '600', color: Colors.text },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  charCount: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: -12,
    marginBottom: 12,
  },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.text },
  chipTextActive: { color: Colors.white },

  customRow: { marginBottom: 16 },
  customInput: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    fontSize: 14,
    color: Colors.text,
  },

  saveBtn: { marginTop: 8 },

  // Availability
  hospitalScroll: { marginBottom: 12 },
  hospitalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  hospitalChipActive: { backgroundColor: Colors.primary },
  hospitalChipText: { fontSize: 12, fontWeight: '600', color: Colors.primary, maxWidth: 120 },
  hospitalChipTextActive: { color: Colors.white },

  dayScroll: { marginBottom: 16 },
  dayBtn: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minWidth: 48,
  },
  dayBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayBtnText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  dayBtnTextActive: { color: Colors.white },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 3,
  },
  dayDotActive: { backgroundColor: Colors.white },
  dayHeader: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  emptySlots: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16, textAlign: 'center' },

  slotCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...crossPlatformShadow({ offsetY: 1, opacity: 0.05, radius: 4, elevation: 1 }),
  },
  slotCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  slotCardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text },
  slotRemoveBtn: { padding: 4 },
  timeRow: { flexDirection: 'row' },

  addSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  addSlotText: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  // Details
  listCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  listCardTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  addListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 20,
  },
  addListText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // Spec picker modal
  modalContainer: { flex: 1, backgroundColor: Colors.white },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  modalClose: { padding: 4 },
  modalCloseText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  specRowActive: { backgroundColor: Colors.primaryLight },
  specRowText: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  specRowTextActive: { color: Colors.primary, fontWeight: '700' },
  specRowCategory: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
});
