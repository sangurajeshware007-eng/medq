/**
 * Hospital Onboarding Step 2 — Registration & Documents
 */
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, ChevronLeft, RefreshCw, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../../components/Button';
import Input from '../../../components/Input';
import DocumentUploadTile from '../../../components/onboarding/DocumentUploadTile';
import StepProgressBar from '../../../components/onboarding/StepProgressBar';
import { Colors } from '../../../constants/Colors';
import onboardingService from '../../../services/onboardingService';
import type { StorageFileType } from '../../../services/storageService';
import storageService from '../../../services/storageService';
import {
  MAX_FACILITY_PHOTOS,
  useHospitalOnboardingStore,
} from '../../../store/hospitalOnboardingStore';
import { crossPlatformShadow } from '../../../utils/shadow';

import { formColumn } from '@/theme';

const STEP_LABELS = ['Details', 'Documents', 'Review'];

// Maps each document slot to the backend FileType and whether it's public
const DOC_CONFIG: Record<string, { fileType: StorageFileType; isPublic: boolean }> = {
  REGISTRATION_CERTIFICATE: { fileType: 'HOSPITAL_DOCUMENT', isPublic: false },
  ACCREDITATION: { fileType: 'HOSPITAL_DOCUMENT', isPublic: false },
  LOGO: { fileType: 'HOSPITAL_LOGO', isPublic: true },
  FACILITY_PHOTOS: { fileType: 'HOSPITAL_FACILITY_PHOTO', isPublic: true },
};

function makePhotoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function HospitalStep2() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === 'edit';
  const editSuffix = isEditMode ? '?mode=edit' : '';
  const {
    documents,
    updateDocuments,
    setDocument,
    addFacilityPhoto,
    updateFacilityPhoto,
    removeFacilityPhoto,
    markStepCompleted,
    setCurrentStep,
    completedSteps,
  } = useHospitalOnboardingStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Single-doc upload (registration cert / accreditation) ────────────────
  const handlePick = async (docType: string, uri: string, fileName: string, mimeType: string) => {
    setDocument(docType, { uri, fileName, mimeType, uploadStatus: 'uploading' });
    setErrors((e) => ({ ...e, [docType]: '' }));

    try {
      const config = DOC_CONFIG[docType] ?? { fileType: 'HOSPITAL_DOCUMENT', isPublic: false };
      const result = await storageService.uploadFile(config.fileType, uri, mimeType, fileName);

      setDocument(docType, {
        uploadStatus: 'done',
        uploadedUrl: result.publicUrl,
        uploadedKey: result.objectKey,
      });
    } catch {
      setDocument(docType, { uploadStatus: 'error' });
      Alert.alert('Upload Failed', 'Could not upload the file. Tap the tile to retry.');
    }
  };

  const handleRemove = (docType: string) => {
    setDocument(docType, {
      uri: '',
      fileName: '',
      mimeType: '',
      uploadStatus: 'idle',
      uploadedUrl: undefined,
      uploadedKey: undefined,
    });
  };

  // ── Facility photo upload ────────────────────────────────────────────────
  const facilityPhotos = documents.facilityPhotos;
  const facilityCount = facilityPhotos.length;
  const canAddMore = facilityCount < MAX_FACILITY_PHOTOS;

  const uploadFacilityPhoto = async (id: string, uri: string, mimeType: string) => {
    try {
      const result = await storageService.uploadFile('HOSPITAL_FACILITY_PHOTO', uri, mimeType);
      updateFacilityPhoto(id, { uploadStatus: 'done', uploadedUrl: result.publicUrl });
    } catch {
      updateFacilityPhoto(id, { uploadStatus: 'error' });
    }
  };

  const handleAddFacilityPhoto = async () => {
    if (!canAddMore) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to add hospital photos.');
      return;
    }

    const remaining = MAX_FACILITY_PHOTOS - facilityCount;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });
    if (result.canceled || !result.assets?.length) return;

    const assets = result.assets.slice(0, remaining);
    assets.forEach((asset) => {
      const id = makePhotoId();
      const mimeType = asset.mimeType || 'image/jpeg';
      const fileName = asset.fileName || `${id}.jpg`;
      addFacilityPhoto({
        id,
        uri: asset.uri,
        fileName,
        mimeType,
        uploadStatus: 'uploading',
      });
      void uploadFacilityPhoto(id, asset.uri, mimeType);
    });
  };

  const handleRetryFacilityPhoto = (id: string) => {
    const photo = facilityPhotos.find((p) => p.id === id);
    if (!photo) return;
    updateFacilityPhoto(id, { uploadStatus: 'uploading' });
    void uploadFacilityPhoto(id, photo.uri, photo.mimeType ?? 'image/jpeg');
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!documents.registrationNumber.trim())
      errs.registrationNumber = 'Registration number is required';

    for (const doc of documents.documents.filter((d) => d.required)) {
      if (doc.uploadStatus !== 'done') {
        errs[doc.type] = `${doc.type.replace(/_/g, ' ')} is required`;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save & continue ──────────────────────────────────────────────────────
  const handleSaveAndContinue = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const docPayload = documents.documents
        .filter((d) => d.uploadStatus === 'done')
        .map((d) => ({
          documentType: d.type,
          documentUrl: d.uploadedUrl ?? d.uploadedKey ?? '',
          fileName: d.fileName,
        }));

      // Append facility photos as FACILITY_PHOTOS rows so the backend full-replace
      // persists them alongside registration / accreditation.
      const facilityPayload = facilityPhotos
        .filter((p) => p.uploadStatus === 'done' && p.uploadedUrl)
        .map((p) => ({
          documentType: 'FACILITY_PHOTOS',
          documentUrl: p.uploadedUrl!,
          fileName: p.fileName,
        }));

      await onboardingService.saveHospitalDocuments({
        registrationNumber: documents.registrationNumber.trim(),
        documents: [...docPayload, ...facilityPayload],
      });
      markStepCompleted(2);
      setCurrentStep(3);
      router.push(`/onboarding/hospital/step3${editSuffix}` as never);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save documents';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const anyDocUploading = documents.documents.some((d) => d.uploadStatus === 'uploading');
  const anyFacilityUploading = facilityPhotos.some((p) => p.uploadStatus === 'uploading');
  const anyUploading = anyDocUploading || anyFacilityUploading;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registration & Documents</Text>
        <View style={{ width: 32 }} />
      </View>

      <StepProgressBar
        currentStep={2}
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
        <Input
          label="Hospital Registration Number *"
          value={documents.registrationNumber}
          onChangeText={(v) => {
            updateDocuments({ registrationNumber: v });
            setErrors((e) => ({ ...e, registrationNumber: '' }));
          }}
          placeholder="e.g., HOSP/KAR/2023/12345"
          error={errors.registrationNumber}
        />

        <Text style={styles.sectionTitle}>Upload Documents</Text>
        <Text style={styles.sectionSubtitle}>
          Upload required documents to verify your hospital. Accepted formats: JPG, PNG.
        </Text>

        {documents.documents.map((doc) => (
          <View key={doc.type}>
            <DocumentUploadTile
              type={doc.type}
              fileName={doc.fileName}
              uri={doc.uri}
              required={doc.required}
              uploadStatus={doc.uploadStatus}
              onPick={(uri, fileName, mimeType) => handlePick(doc.type, uri, fileName, mimeType)}
              onRemove={() => handleRemove(doc.type)}
            />
            {errors[doc.type] && <Text style={styles.errorText}>{errors[doc.type]}</Text>}
          </View>
        ))}

        {/* ── Facility Photos ─────────────────────────────────────────── */}
        <View style={styles.facilityHeader}>
          <Text style={styles.sectionTitle}>Hospital Photos</Text>
          <Text style={styles.facilityCount}>
            {facilityCount}/{MAX_FACILITY_PHOTOS}
          </Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Add up to {MAX_FACILITY_PHOTOS} photos — exterior, reception, wards, equipment. These show
          on your hospital page slider.
        </Text>

        <View style={styles.photoGrid}>
          {facilityPhotos.map((photo) => (
            <View key={photo.id} style={styles.photoTile}>
              <Image source={photo.uri} style={styles.photoImg} contentFit="cover" />

              {photo.uploadStatus === 'uploading' && (
                <View style={styles.photoOverlay}>
                  <ActivityIndicator size="small" color={Colors.white} />
                </View>
              )}

              {photo.uploadStatus === 'error' && (
                <TouchableOpacity
                  style={[styles.photoOverlay, styles.photoErrorOverlay]}
                  onPress={() => handleRetryFacilityPhoto(photo.id)}
                >
                  <RefreshCw size={18} color={Colors.white} strokeWidth={2.5} />
                  <Text style={styles.photoErrorTxt}>Retry</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.photoRemoveBtn}
                onPress={() => removeFacilityPhoto(photo.id)}
                hitSlop={8}
              >
                <Trash2 size={12} color={Colors.white} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          ))}

          {canAddMore && (
            <TouchableOpacity
              style={[styles.photoTile, styles.photoAddTile]}
              onPress={handleAddFacilityPhoto}
              activeOpacity={0.8}
            >
              <Camera size={22} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.photoAddTxt}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.navRow}>
          <Button
            title="Back"
            variant="outline"
            onPress={() => router.back()}
            style={styles.navBtn}
          />
          <Button
            title={anyUploading ? 'Uploading...' : 'Save & Continue'}
            onPress={handleSaveAndContinue}
            loading={loading}
            disabled={loading || anyUploading}
            style={{ ...styles.navBtn, flex: 2 }}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const TILE_GAP = 10;

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
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 8,
    marginBottom: 2,
  },
  sectionSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16, lineHeight: 18 },
  errorText: { fontSize: 12, color: Colors.error, marginTop: -8, marginBottom: 8 },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  navBtn: { flex: 1 },

  // Facility photos
  facilityHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  facilityCount: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
    marginBottom: 4,
  },
  photoTile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.borderLight,
    position: 'relative',
  },
  photoImg: { width: '100%', height: '100%' },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoErrorOverlay: { backgroundColor: 'rgba(239,68,68,0.7)', gap: 4 },
  photoErrorTxt: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddTile: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoAddTxt: { fontSize: 11, fontWeight: '700', color: Colors.primary },
});
