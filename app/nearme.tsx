import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Map, MapPin, Hospital, UserRound, Star, ChevronLeft } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { useLanguage } from '../context/LanguageContext';
import { useLocation } from '../context/LocationContext';
import Card from '../components/Card';
import { crossPlatformShadow } from '../utils/shadow';
import { useNearbyHospitals, useNearbyDoctors } from '../hooks/useApiHooks';
import { formatShortCredential } from '../utils/doctorCredential';

const { width } = Dimensions.get('window');

// Bidar, Karnataka — default fallback coords
const DEFAULT_LAT = 17.8674;
const DEFAULT_LNG = 76.9501;

// Map placeholder - since react-native-maps needs native setup,
// we show a beautiful visual placeholder that works immediately
export default function NearMeScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { selectedLocation, displayName } = useLocation();
  const { lat: latParam, lng: lngParam, tab: tabParam } = useLocalSearchParams<{
    lat?: string;
    lng?: string;
    tab?: string;
  }>();

  const [selectedType, setSelectedType] = useState<'doctors' | 'hospitals'>(
    tabParam === 'hospitals' ? 'hospitals' : 'doctors'
  );

  // Prefer saved/selected location, fall back to coords passed from home screen,
  // then fall back to default coords so the list is never empty.
  const effectiveLat = selectedLocation?.latitude
    ?? (latParam ? parseFloat(latParam) : DEFAULT_LAT);
  const effectiveLng = selectedLocation?.longitude
    ?? (lngParam ? parseFloat(lngParam) : DEFAULT_LNG);

  const gpsParams = { lat: effectiveLat, lng: effectiveLng, radius_km: 50, size: 100 };
  const hospitalParams = { lat: effectiveLat, lng: effectiveLng, radius_km: 50 };

  const { data: doctorsList = [], isLoading: doctorsLoading } = useNearbyDoctors(gpsParams);
  const { data: hospitalsList = [], isLoading: hospitalsLoading } = useNearbyHospitals(hospitalParams);


  const isLoading = doctorsLoading || hospitalsLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={Colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Map size={18} color={Colors.text} strokeWidth={2} />
          <Text style={styles.headerTitle}>{t('nearMe')}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Map size={36} color={Colors.primary} strokeWidth={1.5} />
          <Text style={styles.mapText}>{t('nearbyDoctors')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <MapPin size={12} color={Colors.textSecondary} strokeWidth={2.5} />
            <Text style={styles.mapSubtext}>{displayName || 'Your Location'}</Text>
          </View>

          {/* Mock pins */}
          <View style={[styles.pin, { top: 40, left: 60 }]}>
            <Hospital size={16} color={Colors.primary} strokeWidth={2} />
          </View>
          <View style={[styles.pin, { top: 80, right: 40 }]}>
            <UserRound size={16} color={Colors.trustGreen} strokeWidth={2} />
          </View>
          <View style={[styles.pin, { bottom: 60, left: 100 }]}>
            <Hospital size={16} color={Colors.primary} strokeWidth={2} />
          </View>
          <View style={[styles.pin, { top: 60, left: width / 2 - 40 }]}>
            <UserRound size={16} color={Colors.trustGreen} strokeWidth={2} />
          </View>
          <View style={[styles.pin, { bottom: 40, right: 80 }]}>
            <UserRound size={16} color={Colors.trustGreen} strokeWidth={2} />
          </View>

          {/* User location */}
          <View style={styles.userPin}>
            <MapPin size={22} color={Colors.accent} strokeWidth={2.5} />
            <Text style={styles.userPinText}>You</Text>
          </View>
        </View>
      </View>

      {/* Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggle, selectedType === 'doctors' && styles.toggleActive]}
          onPress={() => setSelectedType('doctors')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <UserRound size={14} color={selectedType === 'doctors' ? Colors.primary : Colors.textSecondary} strokeWidth={2} />
            <Text style={[styles.toggleText, selectedType === 'doctors' && styles.toggleTextActive]}>
              {t('topDoctors')}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggle, selectedType === 'hospitals' && styles.toggleActive]}
          onPress={() => setSelectedType('hospitals')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Hospital size={14} color={selectedType === 'hospitals' ? Colors.primary : Colors.textSecondary} strokeWidth={2} />
            <Text style={[styles.toggleText, selectedType === 'hospitals' && styles.toggleTextActive]}>
              {t('nearbyHospitals')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {isLoading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {selectedType === 'doctors'
          ? doctorsList.map((doctor) => (
              <TouchableOpacity
                key={doctor.id}
                onPress={() => router.push({ pathname: '/doctor/[id]', params: { id: String(doctor.id) } })}
              >
                <Card style={styles.listCard}>
                  <View style={styles.listRow}>
                    <Image source={{ uri: doctor.photo }} style={styles.listAvatar} />
                    <View style={styles.listInfo}>
                      <Text style={styles.listName}>{doctor.name}</Text>
                      <Text style={styles.listSpec}>{doctor.specialization}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Hospital size={11} color={Colors.textSecondary} strokeWidth={2} />
                        <Text style={styles.listAddress}>{doctor.hospitalName}</Text>
                      </View>
                    </View>
                    <View style={styles.listRight}>
                      {/* Phase 1: qualification badge in place of star rating */}
                      {/* <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <Star size={12} color={Colors.gold} strokeWidth={2.5} fill={Colors.gold} />
                        <Text style={styles.listRating}>{doctor.rating}</Text>
                      </View> */}
                      {formatShortCredential(doctor.degree) !== '' && (
                        <Text style={styles.listRating} numberOfLines={1}>
                          {formatShortCredential(doctor.degree)}
                        </Text>
                      )}
                      {doctor.distanceKm != null && (
                        <Text style={styles.listDistance}>{doctor.distanceKm.toFixed(1)} km</Text>
                      )}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          : hospitalsList.map((hospital) => (
              <TouchableOpacity
                key={hospital.id}
                onPress={() => router.push({ pathname: '/hospital/[id]', params: { id: String(hospital.id) } })}
              >
                <Card style={styles.listCard}>
                  <View style={styles.listRow}>
                    <Image source={{ uri: hospital.image }} style={styles.listAvatar} />
                    <View style={styles.listInfo}>
                      <Text style={styles.listName}>{hospital.name}</Text>
                      <Text style={styles.listSpec}>{hospital.doctorsCount} doctors</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <MapPin size={11} color={Colors.textSecondary} strokeWidth={2} />
                        <Text style={styles.listAddress}>{hospital.address}</Text>
                      </View>
                    </View>
                    <View style={styles.listRight}>
                      {/* Phase 1: hospital ratings hidden until reviews ship.
                          Restore this block when the review feature is enabled: */}
                      {/* <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <Star size={12} color={Colors.gold} strokeWidth={2.5} fill={Colors.gold} />
                        <Text style={styles.listRating}>{hospital.rating}</Text>
                      </View> */}
                      {hospital.distanceKm != null && (
                        <Text style={styles.listDistance}>{hospital.distanceKm.toFixed(1)} km</Text>
                      )}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}

        {!isLoading && selectedType === 'doctors' && doctorsList.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No doctors found nearby</Text>
          </View>
        )}
        {!isLoading && selectedType === 'hospitals' && hospitalsList.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No hospitals found nearby</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 20, color: Colors.primary, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  headerRight: { width: 32 },
  mapContainer: {
    height: 220,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: Colors.primary + '20',
  },
  mapEmoji: { fontSize: 36, marginBottom: 4 },
  mapText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  mapSubtext: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  pin: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...crossPlatformShadow({ color: Colors.shadow, offsetY: 2, opacity: 1, radius: 4, elevation: 3 }),
  },
  pinEmoji: { fontSize: 18 },
  userPin: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  userPinEmoji: { fontSize: 24 },
  userPinText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: Colors.white,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: Colors.borderLight,
    borderRadius: 14,
    padding: 4,
  },
  toggle: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.white,
    ...crossPlatformShadow({ color: Colors.shadow, offsetY: 2, opacity: 1, radius: 4, elevation: 2 }),
  },
  toggleText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  toggleTextActive: { color: Colors.primary, fontWeight: '700' },
  list: {
    padding: 16,
  },
  listCard: {
    marginBottom: 10,
    padding: 12,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.borderLight,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  listInfo: { flex: 1 },
  listName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  listSpec: { fontSize: 12, color: Colors.primary, fontWeight: '600', marginTop: 1 },
  listAddress: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  listRight: { marginLeft: 8, alignItems: 'flex-end' },
  listRating: { fontSize: 13, fontWeight: '700', color: Colors.gold },
  listDistance: { fontSize: 11, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});

