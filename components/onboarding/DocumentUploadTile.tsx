/**
 * DocumentUploadTile — Upload tile for documents/images
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { FileText, Camera, X, CheckCircle, AlertCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/Colors';
import { UploadStatus } from '../../store/hospitalOnboardingStore';

const TYPE_LABELS: Record<string, string> = {
  REGISTRATION_CERTIFICATE: 'Registration Certificate',
  ACCREDITATION: 'Accreditation',
  LOGO: 'Hospital Logo',
  FACILITY_PHOTOS: 'Facility Photos',
};

interface DocumentUploadTileProps {
  type: string;
  fileName: string;
  uri: string;
  required: boolean;
  uploadStatus?: UploadStatus;
  onPick: (uri: string, fileName: string, mimeType: string) => void;
  onRemove: () => void;
}

export default function DocumentUploadTile({
  type,
  fileName,
  uri,
  required,
  uploadStatus = 'idle',
  onPick,
  onRemove,
}: DocumentUploadTileProps) {
  const hasFile = uri.length > 0;
  const isUploading = uploadStatus === 'uploading';
  const hasError = uploadStatus === 'error';

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: type === 'LOGO',
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const name = asset.fileName || `${type}_${Date.now()}.jpg`;
      const mime = asset.mimeType || 'image/jpeg';
      onPick(asset.uri, name, mime);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.tile,
        hasFile && !hasError && styles.tileUploaded,
        hasError && styles.tileError,
      ]}
      onPress={isUploading ? undefined : hasFile ? undefined : pickImage}
      activeOpacity={hasFile || isUploading ? 1 : 0.7}
    >
      {hasFile ? (
        <>
          {uri.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
            <Image source={{ uri }} style={styles.preview} />
          ) : (
            <View style={styles.fileIcon}>
              <FileText size={28} color={Colors.primary} strokeWidth={1.5} />
            </View>
          )}
          <View style={styles.tileInfo}>
            <View style={styles.uploadedHeader}>
              {isUploading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : hasError ? (
                <AlertCircle size={14} color={Colors.error} strokeWidth={2.5} />
              ) : (
                <CheckCircle size={14} color="#16A34A" strokeWidth={2.5} />
              )}
              <Text style={[styles.uploadedLabel, hasError && styles.errorLabel]}>
                {isUploading
                  ? 'Uploading...'
                  : hasError
                    ? 'Upload failed — tap to retry'
                    : TYPE_LABELS[type] || type}
              </Text>
            </View>
            {!isUploading && (
              <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
            )}
          </View>
          {!isUploading && (
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={hasError ? pickImage : onRemove}
            >
              {hasError ? (
                <Camera size={16} color={Colors.primary} strokeWidth={2.5} />
              ) : (
                <X size={16} color={Colors.error} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          )}
        </>
      ) : (
        <>
          <View style={styles.uploadIcon}>
            <Camera size={24} color={Colors.primary} strokeWidth={1.5} />
          </View>
          <View style={styles.tileInfo}>
            <Text style={styles.tileLabel}>
              {TYPE_LABELS[type] || type}
              {required && <Text style={styles.required}> *</Text>}
            </Text>
            <Text style={styles.tileHint}>Tap to upload image</Text>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.white,
    marginBottom: 12,
  },
  tileUploaded: {
    borderStyle: 'solid',
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  tileError: {
    borderStyle: 'solid',
    borderColor: Colors.error,
    backgroundColor: '#FEF2F2',
  },
  errorLabel: {
    color: Colors.error,
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileInfo: {
    flex: 1,
  },
  tileLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  required: {
    color: Colors.error,
  },
  tileHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  uploadedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  uploadedLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  fileName: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  removeBtn: {
    padding: 6,
  },
});

