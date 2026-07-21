/**
 * Hospital Onboarding — Pick Location (web fallback)
 *
 * Used when EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY is not configured: manual
 * latitude/longitude entry + browser GPS, with a zero-dependency
 * OpenStreetMap embed for visual confirmation. The interactive Google
 * Maps screen (HospitalPickLocationScreen.web.tsx) takes over once a
 * browser Maps key exists.
 *
 * Same contract as the native screen: reads/writes locationLat/locationLng
 * on the hospital onboarding store and navigates back on confirm.
 */
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { ChevronLeft, Crosshair } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../constants/Colors';
import { useHospitalOnboardingStore } from '../../store/hospitalOnboardingStore';
import Button from '../Button';

// Bidar, Karnataka — fallback when no saved coords and GPS denied.
const FALLBACK_LAT = 17.9133;
const FALLBACK_LNG = 77.5301;

function parseCoord(value: string, min: number, max: number): number | null {
  const n = parseFloat(value.trim());
  if (Number.isNaN(n) || n < min || n > max) return null;
  return n;
}

export default function HospitalPickLocationFallback() {
  const router = useRouter();
  const { profile, updateProfile } = useHospitalOnboardingStore();

  const [lat, setLat] = useState(profile.locationLat || String(FALLBACK_LAT));
  const [lng, setLng] = useState(profile.locationLng || String(FALLBACK_LNG));
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedLat = parseCoord(lat, -90, 90);
  const parsedLng = parseCoord(lng, -180, 180);
  const valid = parsedLat !== null && parsedLng !== null;

  const handleUseGps = async () => {
    setLocating(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Allow location access in your browser to use GPS.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync();
      setLat(loc.coords.latitude.toFixed(6));
      setLng(loc.coords.longitude.toFixed(6));
    } catch {
      setError('Could not get your current location.');
    } finally {
      setLocating(false);
    }
  };

  const handleConfirm = () => {
    if (parsedLat === null || parsedLng === null) {
      setError('Enter a valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }
    updateProfile({
      locationLat: parsedLat.toFixed(6),
      locationLng: parsedLng.toFixed(6),
    });
    router.back();
  };

  // OSM embed bounding box (~0.01° ≈ 1.1 km around the point).
  const mapSrc = valid
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${parsedLng - 0.005},${parsedLat - 0.005},${parsedLng + 0.005},${parsedLat + 0.005}&layer=mapnik&marker=${parsedLat},${parsedLng}`
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pick Hospital Location</Text>
        <View style={{ width: 32 }} />
      </View>

      <Text style={styles.helperTxt}>
        Use GPS or enter your hospital&apos;s coordinates (find them via Google Maps → right-click →
        copy coordinates). The map below previews the selected point.
      </Text>

      <View style={styles.form}>
        <View style={styles.coordRow}>
          <View style={styles.coordField}>
            <Text style={styles.coordLabel}>Latitude</Text>
            <TextInput
              style={styles.coordInput}
              value={lat}
              onChangeText={setLat}
              placeholder="17.913300"
              placeholderTextColor={Colors.textLight}
              inputMode="decimal"
              autoCorrect={false}
            />
          </View>
          <View style={styles.coordField}>
            <Text style={styles.coordLabel}>Longitude</Text>
            <TextInput
              style={styles.coordInput}
              value={lng}
              onChangeText={setLng}
              placeholder="77.530100"
              placeholderTextColor={Colors.textLight}
              inputMode="decimal"
              autoCorrect={false}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={handleUseGps}
          disabled={locating}
          activeOpacity={0.8}
        >
          {locating ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Crosshair size={18} color={Colors.primary} strokeWidth={2.2} />
          )}
          <Text style={styles.gpsBtnTxt}>Use my current location</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.errorTxt}>{error}</Text> : null}
      </View>

      <View style={styles.mapWrap}>
        {mapSrc ? (
          <iframe
            title="Location preview"
            src={mapSrc}
            style={{ border: 0, width: '100%', height: '100%' }}
          />
        ) : (
          <Text style={styles.mapPlaceholderTxt}>Enter valid coordinates to preview the map.</Text>
        )}
      </View>

      <View style={styles.bottomCard}>
        <Text style={styles.coordsLabel}>Selected coordinates</Text>
        <Text style={styles.coordsValue}>
          {valid ? `${parsedLat.toFixed(6)}, ${parsedLng.toFixed(6)}` : '—'}
        </Text>
        <Button title="Confirm Location" onPress={handleConfirm} style={styles.confirmBtn} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  helperTxt: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.textSecondary,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  form: { padding: 16, gap: 12, backgroundColor: Colors.white },
  coordRow: { flexDirection: 'row', gap: 12 },
  coordField: { flex: 1 },
  coordLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  coordInput: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  gpsBtnTxt: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  errorTxt: { fontSize: 13, color: Colors.error },
  mapWrap: {
    flex: 1,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderTxt: { fontSize: 13, color: Colors.textSecondary },
  bottomCard: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  coordsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  coordsValue: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  confirmBtn: { width: '100%' },
});
