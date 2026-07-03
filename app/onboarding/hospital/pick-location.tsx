/**
 * Hospital Onboarding — Pick Location
 *
 * Full-screen map. Center crosshair pattern: a fixed pin stays in the
 * middle of the screen, the user pans the map under it, and the visible
 * region's center is the picked coordinate. Lifts the result into the
 * onboarding store and navigates back to step1.
 */
import * as ExpoLocation from 'expo-location';
import { useRouter } from 'expo-router';

// expo-location v19 ships geocodeAsync at runtime but its bundled .d.ts is
// missing the export — cast through to keep TS happy without changing behavior.
const Location = ExpoLocation as typeof ExpoLocation & {
  geocodeAsync: (address: string) => Promise<Array<{
    latitude: number;
    longitude: number;
  }>>;
};
import { ChevronLeft, Crosshair, MapPin, Minus, Plus, Search, X } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../../components/Button';
import { Colors } from '../../../constants/Colors';
import { useHospitalOnboardingStore } from '../../../store/hospitalOnboardingStore';
import { crossPlatformShadow } from '../../../utils/shadow';

// Bidar, Karnataka — fallback when no saved coords and GPS denied.
const FALLBACK_LAT = 17.9133;
const FALLBACK_LNG = 77.5301;
const DEFAULT_DELTA = 0.01; // ~1.1 km — close zoom suitable for picking a building

export default function HospitalPickLocation() {
  const router = useRouter();
  const { profile, updateProfile } = useHospitalOnboardingStore();

  const initialLat = profile.locationLat ? parseFloat(profile.locationLat) : FALLBACK_LAT;
  const initialLng = profile.locationLng ? parseFloat(profile.locationLng) : FALLBACK_LNG;

  // The visible region's center — updated as the user pans.
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  // Track current zoom (latitudeDelta) so the +/- buttons can step relative
  // to whatever zoom the user pinched to. Square aspect (lat == lng delta).
  const [zoomDelta, setZoomDelta] = useState(DEFAULT_DELTA);
  const mapRef = useRef<MapView>(null);

  // Bounds: ~5cm/pixel street level → country level.
  const MIN_DELTA = 0.0005;
  const MAX_DELTA = 1.0;

  const handleZoom = (factor: number) => {
    const next = Math.min(MAX_DELTA, Math.max(MIN_DELTA, zoomDelta * factor));
    if (next === zoomDelta) return;
    setZoomDelta(next);
    mapRef.current?.animateToRegion(
      {
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: next,
        longitudeDelta: next,
      },
      280,
    );
  };

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    Keyboard.dismiss();
    setSearching(true);
    try {
      const results = await Location.geocodeAsync(q);
      if (!results || results.length === 0) {
        Alert.alert('Not found', `No place matches "${q}". Try a different name.`);
        return;
      }
      const top = results[0];
      const next: Region = {
        latitude: top.latitude,
        longitude: top.longitude,
        latitudeDelta: DEFAULT_DELTA,
        longitudeDelta: DEFAULT_DELTA,
      };
      mapRef.current?.animateToRegion(next, 600);
      setCenter({ lat: top.latitude, lng: top.longitude });
    } catch {
      Alert.alert('Search failed', 'Could not look up that place. Check your connection.');
    } finally {
      setSearching(false);
    }
  };

  const onRegionChangeComplete = useCallback((region: Region) => {
    setCenter({ lat: region.latitude, lng: region.longitude });
    setZoomDelta(region.latitudeDelta);
  }, []);

  const handleUseGps = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow location access to use GPS.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const next: Region = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: DEFAULT_DELTA,
        longitudeDelta: DEFAULT_DELTA,
      };
      mapRef.current?.animateToRegion(next, 600);
      setCenter({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {
      Alert.alert('GPS unavailable', 'Could not get your current location.');
    } finally {
      setLocating(false);
    }
  };

  const handleConfirm = () => {
    updateProfile({
      locationLat: center.lat.toFixed(6),
      locationLng: center.lng.toFixed(6),
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pick Hospital Location</Text>
        <View style={{ width: 32 }} />
      </View>

      <Text style={styles.helperTxt}>
        Search a city or place, then pan the map until the pin sits exactly on your hospital&apos;s entrance.
      </Text>

      {/* Map + center pin overlay */}
      <View style={styles.mapWrap}>
        {/* Floating search bar (top of map) */}
        <View style={styles.searchBar}>
          <Search size={16} color={Colors.textLight} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search city or place name..."
            placeholderTextColor={Colors.textLight}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoCorrect={false}
            autoCapitalize="words"
          />
          {searching ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={8}
            >
              <X size={16} color={Colors.textLight} strokeWidth={2} />
            </TouchableOpacity>
          ) : null}
        </View>

        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: initialLat,
            longitude: initialLng,
            latitudeDelta: DEFAULT_DELTA,
            longitudeDelta: DEFAULT_DELTA,
          }}
          onRegionChangeComplete={onRegionChangeComplete}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={Platform.OS === 'ios'}
          toolbarEnabled={false}
        />

        {/* Centered pin (visual only — purely an overlay over the map) */}
        <View style={styles.pinOverlay} pointerEvents="none">
          <View style={styles.pinShadow} />
          <MapPin size={42} color={Colors.accent} strokeWidth={2.5} fill={Colors.accent} />
        </View>

        {/* GPS button (floating, top-right of map) */}
        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={handleUseGps}
          disabled={locating}
          activeOpacity={0.8}
        >
          {locating ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Crosshair size={20} color={Colors.primary} strokeWidth={2.2} />
          )}
        </TouchableOpacity>

        {/* Zoom controls (floating, right edge, below GPS) */}
        <View style={styles.zoomStack}>
          <TouchableOpacity
            style={[styles.zoomBtn, styles.zoomBtnTop, zoomDelta <= MIN_DELTA && styles.zoomBtnDisabled]}
            onPress={() => handleZoom(0.5)}
            disabled={zoomDelta <= MIN_DELTA}
            activeOpacity={0.8}
          >
            <Plus size={20} color={Colors.primary} strokeWidth={2.4} />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity
            style={[styles.zoomBtn, styles.zoomBtnBottom, zoomDelta >= MAX_DELTA && styles.zoomBtnDisabled]}
            onPress={() => handleZoom(2)}
            disabled={zoomDelta >= MAX_DELTA}
            activeOpacity={0.8}
          >
            <Minus size={20} color={Colors.primary} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom action card */}
      <View style={styles.bottomCard}>
        <Text style={styles.coordsLabel}>Selected coordinates</Text>
        <Text style={styles.coordsValue}>
          {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
        </Text>
        <Button title="Confirm Location" onPress={handleConfirm} style={styles.confirmBtn} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
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

  // Map
  mapWrap: { flex: 1, position: 'relative', backgroundColor: Colors.borderLight },
  pinOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -21,
    marginTop: -42, // shift up so the pin's tip points to map center
    alignItems: 'center',
  },
  pinShadow: {
    position: 'absolute',
    bottom: -2,
    width: 14,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  gpsBtn: {
    position: 'absolute',
    top: 76, // below the floating search bar
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 4,
      opacity: 0.18,
      radius: 8,
      elevation: 5,
    }),
  },
  searchBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.white,
    zIndex: 10,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 4,
      opacity: 0.18,
      radius: 10,
      elevation: 6,
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    padding: 0,
  },
  zoomStack: {
    position: 'absolute',
    top: 132, // below the GPS button
    right: 16,
    width: 44,
    borderRadius: 12,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 4,
      opacity: 0.18,
      radius: 8,
      elevation: 5,
    }),
  },
  zoomBtn: {
    width: 44,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnTop: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  zoomBtnBottom: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  zoomBtnDisabled: { opacity: 0.35 },
  zoomDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },

  // Bottom action card
  bottomCard: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: -4,
      opacity: 0.1,
      radius: 12,
      elevation: 8,
    }),
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
