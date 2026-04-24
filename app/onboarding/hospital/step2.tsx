/**
 * Hospital Onboarding Step 2 — Registration & Documents
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '../../../constants/Colors';
import { crossPlatformShadow } from '../../../utils/shadow';
import { useHospitalOnboardingStore } from '../../../store/hospitalOnboardingStore';
import onboardingService from '../../../services/onboardingService';
import storageService, { StorageFileType } from '../../../services/storageService';
import StepProgressBar from '../../../components/onboarding/StepProgressBar';
import DocumentUploadTile from '../../../components/onboarding/DocumentUploadTile';
import Input from '../../../components/Input';
import Button from '../../../components/Button';

const STEP_LABELS = ['Details', 'Documents', 'Review'];

// Maps each document slot to the backend FileType and whether it's public
const DOC_CONFIG: Record<string, { fileType: StorageFileType; isPublic: boolean }> = {
  REGISTRATION_CERTIFICATE: { fileType: 'HOSPITAL_DOCUMENT', isPublic: false },
  ACCREDITATION:            { fileType: 'HOSPITAL_DOCUMENT', isPublic: false },
  LOGO:                     { fileType: 'HOSPITAL_LOGO',     isPublic: true  },
  FACILITY_PHOTOS:          { fileType: 'HOSPITAL_FACILITY_PHOTO', isPublic: true },
};

export default function HospitalStep2() {
  const router = useRouter();
  const { documents, updateDocuments, setDocument, markStepCompleted, setCurrentStep, completedSteps } =
    useHospitalOnboardingStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Upload handler (called as soon as user picks a file) ─────────────────
  const handlePick = async (
    docType: string,
    uri: string,
    fileName: string,
    mimeType: string,
  ) => {
    // Store local URI immediately so the preview shows right away
    setDocument(docType, { uri, fileName, mimeType, uploadStatus: 'uploading' });
    setErrors((e) => ({ ...e, [docType]: '' }));

    try {
      const config = DOC_CONFIG[docType] ?? { fileType: 'HOSPITAL_DOCUMENT', isPublic: false };
      const result = await storageService.uploadFile(config.fileType, uri, mimeType, fileName);

      setDocument(docType, {
        uploadStatus: 'done',
        uploadedUrl: result.publicUrl,   // set for public files (LOGO, FACILITY_PHOTOS)
        uploadedKey: result.objectKey,   // always set — needed for private doc access
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
          // Public files → send full public URL; private files → send object key
          documentUrl: d.uploadedUrl ?? d.uploadedKey ?? '',
          fileName: d.fileName,
        }));

      await onboardingService.saveHospitalDocuments({
        registrationNumber: documents.registrationNumber.trim(),
        documents: docPayload,
      });
      markStepCompleted(2);
      setCurrentStep(3);
      router.push('/onboarding/hospital/step3');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save documents';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const anyUploading = documents.documents.some((d) => d.uploadStatus === 'uploading');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        onStepPress={(step) => router.push(`/onboarding/hospital/step${step}` as never)}
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

        <View style={styles.navRow}>
          <Button title="Back" variant="outline" onPress={() => router.back()} style={styles.navBtn} />
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
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginTop: 8, marginBottom: 2 },
  sectionSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16, lineHeight: 18 },
  errorText: { fontSize: 12, color: Colors.error, marginTop: -8, marginBottom: 8 },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  navBtn: { flex: 1 },
});
