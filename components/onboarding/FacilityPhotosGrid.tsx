/**
 * Multi-image picker for hospital facility photos — up to 4 images in a
 * 2×2 grid. Each slot shows either an uploaded photo (with remove button
 * and upload-status indicator) or an "Add" tile. Fully controlled — the
 * parent owns the photos array + upload logic.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Camera, Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/Colors';
import type { FacilityPhoto } from '../../store/hospitalOnboardingStore';
import { MAX_FACILITY_PHOTOS } from '../../store/hospitalOnboardingStore';

export interface PickedFile {
  uri: string;
  fileName: string;
  mimeType: string;
}

interface FacilityPhotosGridProps {
  photos: FacilityPhoto[];
  onFilesPicked: (files: PickedFile[]) => void;
  onRemove: (id: string) => void;
}

export default function FacilityPhotosGrid({
  photos,
  onFilesPicked,
  onRemove,
}: Readonly<FacilityPhotosGridProps>) {
  const remaining = MAX_FACILITY_PHOTOS - photos.length;
  const canAdd = remaining > 0;

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to upload facility photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: remaining, // iOS only; we also trim below for Android
    });

    if (result.canceled || !result.assets?.length) return;

    const files: PickedFile[] = result.assets.slice(0, remaining).map((asset, idx) => ({
      uri: asset.uri,
      fileName: asset.fileName || `facility_${Date.now()}_${idx}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
    }));
    onFilesPicked(files);
  };

  return (
    <View>
      <Text style={styles.label}>
        Facility Photos <Text style={styles.countHint}>({photos.length}/{MAX_FACILITY_PHOTOS})</Text>
      </Text>
      <Text style={styles.hint}>
        Add up to {MAX_FACILITY_PHOTOS} photos of your hospital — exterior, reception, wards, etc.
      </Text>

      <View style={styles.grid}>
        {photos.map((p) => (
          <View key={p.id} style={styles.tile}>
            <Image source={{ uri: p.uri }} style={styles.preview} />
            {p.uploadStatus === 'uploading' && (
              <View style={styles.overlay}>
                <ActivityIndicator color={Colors.white} />
              </View>
            )}
            {p.uploadStatus === 'error' && (
              <View style={styles.overlayError}>
                <AlertCircle size={22} color={Colors.white} strokeWidth={2.5} />
              </View>
            )}
            {p.uploadStatus === 'done' && (
              <View style={styles.statusBadge}>
                <CheckCircle2 size={14} color={Colors.white} strokeWidth={3} />
              </View>
            )}
            <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(p.id)} hitSlop={8}>
              <X size={14} color={Colors.white} strokeWidth={3} />
            </TouchableOpacity>
          </View>
        ))}

        {canAdd && (
          <TouchableOpacity style={styles.addTile} onPress={pickImages} activeOpacity={0.7}>
            <View style={styles.addIcon}>
              <Plus size={22} color={Colors.primary} strokeWidth={2.5} />
            </View>
            <Text style={styles.addLabel}>Add photo</Text>
            {photos.length === 0 && (
              <Camera size={14} color={Colors.textSecondary} strokeWidth={2} style={{ marginTop: 4 }} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const TILE_SIZE = 148;

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '800', color: Colors.text, marginTop: 8, marginBottom: 2 },
  countHint: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  hint: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12, lineHeight: 17 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  tile: {
    width: TILE_SIZE, height: TILE_SIZE, borderRadius: 14, overflow: 'hidden',
    backgroundColor: Colors.primaryLight,
  },
  preview: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  overlayError: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(239,68,68,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: '#16A34A',
    borderRadius: 10, padding: 3,
  },
  removeBtn: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 11, width: 22, height: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  addTile: {
    width: TILE_SIZE, height: TILE_SIZE, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  addIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  addLabel: { fontSize: 12, fontWeight: '700', color: Colors.primary },
});
