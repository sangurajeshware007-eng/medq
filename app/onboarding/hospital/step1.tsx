/**
 * Hospital Onboarding Step 1 — Hospital Details
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert,
  Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, MapPin, Camera } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../../constants/Colors';
import { crossPlatformShadow } from '../../../utils/shadow';
import { useHospitalOnboardingStore } from '../../../store/hospitalOnboardingStore';
import onboardingService from '../../../services/onboardingService';
import storageService from '../../../services/storageService';
import StepProgressBar from '../../../components/onboarding/StepProgressBar';
import ChipSelector from '../../../components/onboarding/ChipSelector';
import AddressFields from '../../../components/onboarding/AddressFields';
import Input from '../../../components/Input';
import Button from '../../../components/Button';

const DEPARTMENTS = [
  'General Medicine', 'Cardiology', 'Orthopedics', 'Gynecology',
  'Pediatrics', 'ENT', 'Dermatology', 'Neurology', 'Ophthalmology',
  'Dentistry', 'Urology', 'Psychiatry', 'Physiotherapy',
  'Radiology', 'Pathology', 'Emergency', 'ICU', 'Surgery',
];

const STEP_LABELS = ['Details', 'Documents', 'Review'];

export default function HospitalStep1() {
  const router = useRouter();
  const { profile, updateProfile, updateAddress, markStepCompleted, setCurrentStep, completedSteps } = useHospitalOnboardingStore();
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
    if (!profile.phone.trim()) errs.phone = 'Phone is required';
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
        phone: profile.phone.trim(),
        emergencyContact: profile.emergencyContact.trim() || undefined,
        departments: allDepts,
        establishedYear: profile.establishedYear ? parseInt(profile.establishedYear) : undefined,
        totalBeds: profile.totalBeds ? parseInt(profile.totalBeds) : undefined,
        is24x7: profile.is24x7,
        website: profile.website.trim() || undefined,
        imageUrl: profile.imageUrl || undefined,
      });
      markStepCompleted(1);
      setCurrentStep(2);
      router.push('/onboarding/hospital/step2');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save hospital details';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        onStepPress={(step) => router.push(`/onboarding/hospital/step${step}` as never)}
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
          <TouchableOpacity onPress={() => updateProfile({ imageUrl: '' })} style={styles.removeLogoBtn}>
            <Text style={styles.removeLogoText}>Remove logo</Text>
          </TouchableOpacity>
        )}

        <Input
          label="Hospital Name *"
          value={profile.name}
          onChangeText={(v) => { updateProfile({ name: v }); setErrors((e) => ({ ...e, name: '' })); }}
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
        <TouchableOpacity style={styles.locationBtn} onPress={handleGetLocation} disabled={locating}>
          <MapPin size={18} color={Colors.primary} strokeWidth={2} />
          <Text style={styles.locationBtnText}>
            {locating ? 'Getting location...' : 'Use My Current Location'}
          </Text>
        </TouchableOpacity>
        {profile.locationLat && profile.locationLng && (
          <Text style={styles.locationCoords}>
            📍 {parseFloat(profile.locationLat).toFixed(4)}, {parseFloat(profile.locationLng).toFixed(4)}
          </Text>
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

        <Input
          label="Phone *"
          value={profile.phone}
          onChangeText={(v) => { updateProfile({ phone: v }); setErrors((e) => ({ ...e, phone: '' })); }}
          placeholder="+91 9876543210"
          keyboardType="phone-pad"
          error={errors.phone}
        />

        <Input
          label="Emergency Contact"
          value={profile.emergencyContact}
          onChangeText={(v) => updateProfile({ emergencyContact: v })}
          placeholder="Emergency number"
          keyboardType="phone-pad"
        />

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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white,
    ...crossPlatformShadow({ offsetY: 2, opacity: 0.08, radius: 8, elevation: 3 }),
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, backgroundColor: Colors.primaryLight,
    borderWidth: 1.5, borderColor: Colors.primary, marginBottom: 8,
  },
  locationBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  locationCoords: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16, paddingVertical: 8,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  errorText: { fontSize: 12, color: Colors.error, marginTop: -12, marginBottom: 12 },
  submitBtn: { marginTop: 12 },
  logoPicker: {
    width: 88, height: 88, borderRadius: 16, borderWidth: 1.5,
    borderColor: Colors.border, borderStyle: 'dashed',
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  logoPreview: { width: 88, height: 88, borderRadius: 16 },
  removeLogoBtn: { marginBottom: 16 },
  removeLogoText: { fontSize: 13, color: Colors.error, fontWeight: '600' },
});

