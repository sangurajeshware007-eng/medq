/**
 * Hospital Onboarding Step 1 — Hospital Details
 */
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, ChevronLeft, MapPin, Map as MapIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../../components/Button';
import Input from '../../../components/Input';
import AddressFields from '../../../components/onboarding/AddressFields';
import ChipSelector from '../../../components/onboarding/ChipSelector';
import StepProgressBar from '../../../components/onboarding/StepProgressBar';
import { Colors } from '../../../constants/Colors';
import onboardingService from '../../../services/onboardingService';
import storageService from '../../../services/storageService';
import { useHospitalOnboardingStore } from '../../../store/hospitalOnboardingStore';
import { crossPlatformShadow } from '../../../utils/shadow';

import { formColumn } from '@/theme';

// Phone helpers — the user always enters 10 digits, +91 is implicit.
// Strip a leading "+91" / "91" (and any non-digits) so we always store the bare 10 digits.
const stripIndianPrefix = (v: string): string =>
  v
    .replace(/^\+?91/, '')
    .replace(/[^0-9]/g, '')
    .slice(0, 10);
const toE164 = (v: string): string => `+91${stripIndianPrefix(v)}`;

const DEPARTMENTS = [
  'General Medicine',
  'Cardiology',
  'Orthopedics',
  'Gynecology',
  'Pediatrics',
  'ENT',
  'Dermatology',
  'Neurology',
  'Ophthalmology',
  'Dentistry',
  'Urology',
  'Psychiatry',
  'Physiotherapy',
  'Radiology',
  'Pathology',
  'Emergency',
  'ICU',
  'Surgery',
];

const STEP_LABELS = ['Details', 'Documents', 'Review'];

export default function HospitalStep1() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === 'edit';
  const editSuffix = isEditMode ? '?mode=edit' : '';
  const {
    profile,
    updateProfile,
    updateAddress,
    markStepCompleted,
    setCurrentStep,
    completedSteps,
  } = useHospitalOnboardingStore();
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePickLogo = async () => {
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
    setLogoUploading(true);
    try {
      const { publicUrl } = await storageService.uploadFile('HOSPITAL_LOGO', asset.uri, mimeType);
      updateProfile({ imageUrl: publicUrl ?? '' });
    } catch {
      Alert.alert('Upload Failed', 'Could not upload the hospital logo. Please try again.');
    } finally {
      setLogoUploading(false);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const a = profile.address;
    if (!profile.name.trim()) errs.name = 'Hospital name is required';
    if (!/^\d{6}$/.test(a.pincode)) errs.pincode = 'Enter a valid 6-digit pincode';
    if (!a.city.trim()) errs.city = 'City is required';
    if (!a.state.trim()) errs.state = 'State is required';
    if (!a.addressLine1.trim()) errs.addressLine1 = 'Building & street are required';
    const phoneDigits = stripIndianPrefix(profile.phone);
    if (!phoneDigits) errs.phone = 'Phone is required';
    else if (phoneDigits.length !== 10) errs.phone = 'Enter a 10-digit number';
    if (profile.departments.length === 0 && profile.customDepartments.length === 0)
      errs.departments = 'At least one department is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGetLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location permission.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync();
      updateProfile({
        locationLat: loc.coords.latitude.toString(),
        locationLng: loc.coords.longitude.toString(),
      });
    } catch {
      Alert.alert('Error', 'Could not get current location.');
    } finally {
      setLocating(false);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const allDepts = [...profile.departments, ...profile.customDepartments];
      const a = profile.address;
      await onboardingService.saveHospitalProfile({
        name: profile.name.trim(),
        address: {
          addressLine1: a.addressLine1.trim(),
          addressLine2: a.addressLine2.trim() || undefined,
          pincode: a.pincode.trim(),
          city: a.city.trim(),
          district: a.district.trim() || undefined,
          state: a.state.trim(),
          country: a.country || 'India',
        },
        locationLat: profile.locationLat ? parseFloat(profile.locationLat) : undefined,
        locationLng: profile.locationLng ? parseFloat(profile.locationLng) : undefined,
        phone: toE164(profile.phone),
        emergencyContact: profile.emergencyContact.trim()
          ? toE164(profile.emergencyContact)
          : undefined,
        departments: allDepts,
        establishedYear: profile.establishedYear ? parseInt(profile.establishedYear) : undefined,
        totalBeds: profile.totalBeds ? parseInt(profile.totalBeds) : undefined,
        is24x7: profile.is24x7,
        website: profile.website.trim() || undefined,
        imageUrl: profile.imageUrl || undefined,
      });
      markStepCompleted(1);
      setCurrentStep(2);
      router.push(`/onboarding/hospital/step2${editSuffix}` as never);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save hospital details';
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
        <Text style={styles.headerTitle}>Hospital Onboarding</Text>
        <View style={{ width: 32 }} />
      </View>

      <StepProgressBar
        currentStep={1}
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Hospital Logo */}
        <Text style={styles.fieldLabel}>Hospital Logo</Text>
        <TouchableOpacity
          style={styles.logoPicker}
          onPress={logoUploading ? undefined : handlePickLogo}
          activeOpacity={logoUploading ? 1 : 0.7}
        >
          {logoUploading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : profile.imageUrl ? (
            <Image source={{ uri: profile.imageUrl }} style={styles.logoPreview} />
          ) : (
            <Camera size={28} color={Colors.primary} strokeWidth={1.5} />
          )}
        </TouchableOpacity>
        {profile.imageUrl && !logoUploading && (
          <TouchableOpacity
            onPress={() => updateProfile({ imageUrl: '' })}
            style={styles.removeLogoBtn}
          >
            <Text style={styles.removeLogoText}>Remove logo</Text>
          </TouchableOpacity>
        )}

        <Input
          label="Hospital Name *"
          value={profile.name}
          onChangeText={(v) => {
            updateProfile({ name: v });
            setErrors((e) => ({ ...e, name: '' }));
          }}
          placeholder="e.g., City General Hospital"
          error={errors.name}
        />

        <AddressFields
          value={profile.address}
          onChange={updateAddress}
          errors={errors}
          onFieldEdit={(field) => setErrors((e) => ({ ...e, [field]: '' }))}
        />

        {/* Map pin — distinct from the postal address above. */}
        <Text style={styles.fieldLabel}>Map Pin (for patient directions)</Text>
        <Text style={styles.fieldHelper}>
          Drop a pin on the exact entrance so patients get accurate directions.
        </Text>
        <View style={styles.locationRow}>
          <TouchableOpacity
            style={[styles.locationBtn, styles.locationBtnSplit]}
            onPress={handleGetLocation}
            disabled={locating}
          >
            <MapPin size={16} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.locationBtnText} numberOfLines={1}>
              {locating ? 'Locating...' : 'Use GPS'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.locationBtn, styles.locationBtnPrimary, styles.locationBtnSplit]}
            onPress={() => router.push('/onboarding/hospital/pick-location')}
          >
            <MapIcon size={16} color={Colors.white} strokeWidth={2} />
            <Text style={[styles.locationBtnText, styles.locationBtnTextPrimary]} numberOfLines={1}>
              Pick on Map
            </Text>
          </TouchableOpacity>
        </View>
        {profile.locationLat && profile.locationLng && (
          <View style={styles.coordsPill}>
            <MapPin size={11} color={Colors.trustGreen} strokeWidth={2.5} />
            <Text style={styles.coordsPillTxt}>
              {parseFloat(profile.locationLat).toFixed(4)},{' '}
              {parseFloat(profile.locationLng).toFixed(4)}
            </Text>
          </View>
        )}

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input
              label="Latitude"
              value={profile.locationLat}
              onChangeText={(v) => updateProfile({ locationLat: v })}
              placeholder="17.9088"
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Longitude"
              value={profile.locationLng}
              onChangeText={(v) => updateProfile({ locationLng: v })}
              placeholder="76.6506"
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.phoneLabel}>Phone *</Text>
        <View style={styles.phoneRow}>
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>+91</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Input
              value={stripIndianPrefix(profile.phone)}
              onChangeText={(v) => {
                updateProfile({ phone: stripIndianPrefix(v) });
                setErrors((e) => ({ ...e, phone: '' }));
              }}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              error={errors.phone}
              style={{ marginBottom: 0 }}
            />
          </View>
        </View>

        <Text style={styles.phoneLabel}>Emergency Contact</Text>
        <View style={styles.phoneRow}>
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>+91</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Input
              value={stripIndianPrefix(profile.emergencyContact)}
              onChangeText={(v) => updateProfile({ emergencyContact: stripIndianPrefix(v) })}
              placeholder="10-digit number (optional)"
              keyboardType="phone-pad"
              maxLength={10}
              style={{ marginBottom: 0 }}
            />
          </View>
        </View>

        {/* Departments */}
        <ChipSelector
          label="Departments *"
          options={DEPARTMENTS}
          selected={[...profile.departments, ...profile.customDepartments]}
          onSelectionChange={(selected) => {
            const predefined = selected.filter((s) => DEPARTMENTS.includes(s));
            const custom = selected.filter((s) => !DEPARTMENTS.includes(s));
            updateProfile({ departments: predefined, customDepartments: custom });
            setErrors((e) => ({ ...e, departments: '' }));
          }}
          allowCustom
          customPlaceholder="Add custom department..."
        />
        {errors.departments && <Text style={styles.errorText}>{errors.departments}</Text>}

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input
              label="Established Year"
              value={profile.establishedYear}
              onChangeText={(v) => updateProfile({ establishedYear: v.replace(/[^0-9]/g, '') })}
              placeholder="e.g., 2005"
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Total Beds"
              value={profile.totalBeds}
              onChangeText={(v) => updateProfile({ totalBeds: v.replace(/[^0-9]/g, '') })}
              placeholder="e.g., 50"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Open 24×7</Text>
          <Switch
            value={profile.is24x7}
            onValueChange={(v) => updateProfile({ is24x7: v })}
            trackColor={{ true: Colors.primary, false: Colors.border }}
            thumbColor={Colors.white}
          />
        </View>

        <Input
          label="Website (Optional)"
          value={profile.website}
          onChangeText={(v) => updateProfile({ website: v })}
          placeholder="https://www.hospital.com"
          autoCapitalize="none"
        />

        <Button
          title="Save & Continue"
          onPress={handleSaveAndContinue}
          loading={loading}
          disabled={loading}
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
  fieldLabel: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  fieldHelper: { fontSize: 12, color: Colors.textSecondary, marginBottom: 10, lineHeight: 16 },
  locationRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  locationBtnSplit: { flex: 1 },
  locationBtnPrimary: { backgroundColor: Colors.primary },
  locationBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  locationBtnTextPrimary: { color: Colors.white },
  coordsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: Colors.trustGreen + '1A',
    marginBottom: 12,
  },
  coordsPillTxt: { fontSize: 12, color: Colors.trustGreen, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  errorText: { fontSize: 12, color: Colors.error, marginTop: -12, marginBottom: 12 },
  submitBtn: { marginTop: 12 },
  logoPicker: {
    width: 88,
    height: 88,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoPreview: { width: 88, height: 88, borderRadius: 16 },
  removeLogoBtn: { marginBottom: 16 },
  removeLogoText: { fontSize: 13, color: Colors.error, fontWeight: '600' },
  phoneLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
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
});
