/**
 * Hospital Onboarding — Pick Location (web)
 *
 * Google Maps JS implementation via @vis.gl/react-google-maps, mirroring the
 * native center-crosshair UX: a fixed pin stays in the middle, the user pans
 * the map under it, and the visible center is the picked coordinate.
 *
 * Falls back to manual coordinate entry (HospitalPickLocationFallback) when
 * EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY is not configured.
 */
import { APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { ChevronLeft, Crosshair, MapPin, Minus, Plus, Search, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ENV } from '../../config/environment';
import { Colors } from '../../constants/Colors';
import { useHospitalOnboardingStore } from '../../store/hospitalOnboardingStore';
import { crossPlatformShadow } from '../../utils/shadow';
import Button from '../Button';

import HospitalPickLocationFallback from './HospitalPickLocationFallback.web';

// Bidar, Karnataka — fallback when no saved coords and GPS denied.
const FALLBACK_LAT = 17.9133;
const FALLBACK_LNG = 77.5301;
const DEFAULT_ZOOM = 16; // ≈ the native screen's 0.01° delta
const MIN_ZOOM = 3;
const MAX_ZOOM = 20;

function PickLocationMapScreen() {
  const router = useRouter();
  const map = useMap();
  const geocodingLib = useMapsLibrary('geocoding');
  const geocoder = useMemo(
    () => (geocodingLib ? new geocodingLib.Geocoder() : null),
    [geocodingLib],
  );
  const { profile, updateProfile } = useHospitalOnboardingStore();

  const initialLat = profile.locationLat ? parseFloat(profile.locationLat) : FALLBACK_LAT;
  const initialLng = profile.locationLng ? parseFloat(profile.locationLng) : FALLBACK_LNG;

  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const goTo = (lat: number, lng: number, nextZoom = DEFAULT_ZOOM) => {
    map?.panTo({ lat, lng });
    map?.setZoom(nextZoom);
    setCenter({ lat, lng });
  };

  const handleZoom = (delta: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, (map?.getZoom() ?? zoom) + delta));
    map?.setZoom(next);
    setZoom(next);
  };

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q || !geocoder) return;
    setSearching(true);
    setNotice(null);
    try {
      const { results } = await geocoder.geocode({ address: q });
      const top = results?.[0];
      if (!top) {
        setNotice(`No place matches "${q}". Try a different name.`);
        return;
      }
      goTo(top.geometry.location.lat(), top.geometry.location.lng());
    } catch {
      setNotice('Could not look up that place. Check your connection.');
    } finally {
      setSearching(false);
    }
  };

  const handleUseGps = async () => {
    setLocating(true);
    setNotice(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setNotice('Allow location access in your browser to use GPS.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync();
      goTo(loc.coords.latitude, loc.coords.longitude);
    } catch {
      setNotice('Could not get your current location.');
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pick Hospital Location</Text>
        <View style={{ width: 32 }} />
      </View>

      <Text style={styles.helperTxt}>
        Search a city or place, then pan the map until the pin sits exactly on your hospital&apos;s
        entrance.
      </Text>

      <View style={styles.mapWrap}>
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
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={16} color={Colors.textLight} strokeWidth={2} />
            </TouchableOpacity>
          ) : null}
        </View>

        <Map
          style={StyleSheet.absoluteFill as React.CSSProperties}
          defaultCenter={{ lat: initialLat, lng: initialLng }}
          defaultZoom={DEFAULT_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI
          onCameraChanged={(ev) => {
            setCenter({ lat: ev.detail.center.lat, lng: ev.detail.center.lng });
            setZoom(ev.detail.zoom);
          }}
        />

        <View style={styles.pinOverlay} pointerEvents="none">
          <View style={styles.pinShadow} />
          <MapPin size={42} color={Colors.accent} strokeWidth={2.5} fill={Colors.accent} />
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
            <Crosshair size={20} color={Colors.primary} strokeWidth={2.2} />
          )}
        </TouchableOpacity>

        <View style={styles.zoomStack}>
          <TouchableOpacity
            style={[styles.zoomBtn, zoom >= MAX_ZOOM && styles.zoomBtnDisabled]}
            onPress={() => handleZoom(1)}
            disabled={zoom >= MAX_ZOOM}
            activeOpacity={0.8}
          >
            <Plus size={20} color={Colors.primary} strokeWidth={2.4} />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity
            style={[styles.zoomBtn, zoom <= MIN_ZOOM && styles.zoomBtnDisabled]}
            onPress={() => handleZoom(-1)}
            disabled={zoom <= MIN_ZOOM}
            activeOpacity={0.8}
          >
            <Minus size={20} color={Colors.primary} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomCard}>
        {notice ? <Text style={styles.noticeTxt}>{notice}</Text> : null}
        <Text style={styles.coordsLabel}>Selected coordinates</Text>
        <Text style={styles.coordsValue}>
          {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
        </Text>
        <Button title="Confirm Location" onPress={handleConfirm} style={styles.confirmBtn} />
      </View>
    </SafeAreaView>
  );
}

export default function HospitalPickLocation() {
  if (!ENV.googleMapsWebKey) {
    return <HospitalPickLocationFallback />;
  }
  return (
    <APIProvider apiKey={ENV.googleMapsWebKey}>
      <PickLocationMapScreen />
    </APIProvider>
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
  mapWrap: { flex: 1, position: 'relative', backgroundColor: Colors.borderLight },
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
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, padding: 0 },
  pinOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -21,
    marginTop: -42, // shift up so the pin's tip points to map center
    alignItems: 'center',
    zIndex: 5,
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
    top: 76,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 4,
      opacity: 0.18,
      radius: 8,
      elevation: 5,
    }),
  },
  zoomStack: {
    position: 'absolute',
    top: 132,
    right: 16,
    width: 44,
    borderRadius: 12,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    zIndex: 10,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 4,
      opacity: 0.18,
      radius: 8,
      elevation: 5,
    }),
  },
  zoomBtn: { width: 44, height: 42, alignItems: 'center', justifyContent: 'center' },
  zoomBtnDisabled: { opacity: 0.35 },
  zoomDivider: { height: 1, backgroundColor: Colors.borderLight },
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
  noticeTxt: { fontSize: 13, color: Colors.error, marginBottom: 8 },
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
