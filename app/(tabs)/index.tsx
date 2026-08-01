import { useScrollToTop, useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import * as ExpoLocation from 'expo-location';
import { useRouter } from 'expo-router';
import {
  Stethoscope,
  MapPin,
  Search,
  Map,
  Hospital,
  Star,
  UserRound,
  Sun,
  Sunrise,
  Moon,
  AlertTriangle,
  ChevronRight,
  Hand,
} from 'lucide-react-native';
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AdminDashboard from '../../components/dashboard/AdminDashboard';
import HospitalManagerDashboard from '../../components/dashboard/HospitalManagerDashboard';
import QuickActions from '../../components/home/QuickActions';
import WelcomeHero from '../../components/home/WelcomeHero';
import HospitalCard from '../../components/HospitalCard';
import LanguageToggle from '../../components/LanguageToggle';
import LogoHeader from '../../components/LogoHeader';
import PremiumDoctorCard from '../../components/PremiumDoctorCard';
import SkeletonCard from '../../components/SkeletonCard';
import HoverLift from '../../components/web/HoverLift';
import Seo from '../../components/web/Seo';
import WebFooter from '../../components/web/WebFooter';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation } from '../../context/LocationContext';
import { useNearbyHospitals, useNearbyDoctors, useNearbyCityImages } from '../../hooks/useApiHooks';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import type { DoctorListItem } from '../../services/doctorService';
import type { HospitalListItem } from '../../services/hospitalService';
import { formatShortCredential } from '../../utils/doctorCredential';
import { reverseGeocode } from '../../utils/geocode';
import { crossPlatformShadow } from '../../utils/shadow';

const RADIUS_KM = 50;

export default function HomeScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { selectedLocation, displayName, detecting, setLocation, setDetecting } = useLocation();
  const { user, isLoggedIn } = useAuth();
  // Desktop web: horizontal carousels become responsive grids.
  const { select: bpSelect, isMd } = useBreakpoint();
  const isDesktopWeb = Platform.OS === 'web' && isMd;
  const hospitalCols = bpSelect({ sm: 1, md: 2, lg: 3 });
  const doctorCols = bpSelect({ sm: 1, md: 3, lg: 4 });

  // ── GPS location state ─────────────────────────────────────────────
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState(false);

  // ── Auto-detect GPS location on mount (skip if user already has a location) ──
  useEffect(() => {
    if (!selectedLocation) {
      detectLocation();
    }
  }, []);

  // If selectedLocation changes (user picks from location-picker), use that
  useEffect(() => {
    if (selectedLocation) {
      setGpsCoords({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });
    }
  }, [selectedLocation]);

  const detectLocation = useCallback(async () => {
    setDetecting(true);
    setLocationError(false);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsCoords({ latitude: 17.8674, longitude: 76.9501 });
        setLocationError(true);
        return;
      }
      const loc = await ExpoLocation.getCurrentPositionAsync();
      setGpsCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      // Reverse geocode to get city name
      try {
        const place = await reverseGeocode({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (place) {
          setLocation({
            id: 'gps-detected',
            name: place.city || place.subregion || 'Current Location',
            area: place.name || place.street || '',
            city: place.city || place.subregion || '',
            state: place.region || 'Karnataka',
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      } catch {
        // Reverse geocode failed — just use coords
      }
    } catch {
      setGpsCoords({ latitude: 17.8674, longitude: 76.9501 });
      setLocationError(true);
    } finally {
      setDetecting(false);
    }
  }, [setDetecting, setLocation]);

  // ── Nearby hospitals (15km radius) ─────────────────────────────────
  const nearbyHospitalParams = gpsCoords
    ? { lat: gpsCoords.latitude, lng: gpsCoords.longitude, radius_km: RADIUS_KM }
    : null;

  const {
    data: nearbyHospitals,
    isLoading: hospitalsLoading,
    refetch: refetchHospitals,
    error: hospitalsError,
  } = useNearbyHospitals(nearbyHospitalParams);

  // ── Nearby doctors (15km radius, load all for client-side filtering) ──
  const nearbyDoctorParams = gpsCoords
    ? { lat: gpsCoords.latitude, lng: gpsCoords.longitude, radius_km: RADIUS_KM, size: 100 }
    : null;

  const {
    data: nearbyDoctors,
    isLoading: doctorsLoading,
    refetch: refetchDoctors,
    error: doctorsError,
  } = useNearbyDoctors(nearbyDoctorParams);

  // ── Pull-to-refresh ────────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchHospitals(), refetchDoctors()]);
    setRefreshing(false);
  }, [refetchHospitals, refetchDoctors]);

  // ── Derived data ───────────────────────────────────────────────────
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  // Explicit tabPress listener — guarantees scroll-to-top when the Home tab
  // icon is tapped while already on Home. (useScrollToTop alone isn't reliable
  // across Expo Router + Tabs nesting.)
  const navigation = useNavigation();
  useEffect(() => {
    const parent = navigation.getParent();
    if (!parent) return;
    const unsubscribe = parent.addListener('tabPress' as never, () => {
      if (navigation.isFocused()) {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
    });
    return unsubscribe;
  }, [navigation]);

  const isLoading = detecting || hospitalsLoading || doctorsLoading;
  const hospitalsList: HospitalListItem[] = nearbyHospitals ?? [];
  const doctorsList: DoctorListItem[] = nearbyDoctors ?? [];

  const shuffledDoctors = useMemo(() => {
    const arr = [...doctorsList];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [doctorsList]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning');
    if (hour < 17) return t('goodAfternoon');
    return t('goodEvening');
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return <Sunrise size={18} color={Colors.white} strokeWidth={2} />;
    if (hour < 17) return <Sun size={18} color={Colors.white} strokeWidth={2} />;
    return <Moon size={18} color={Colors.white} strokeWidth={2} />;
  };

  const userName = user?.name?.split(' ')[0] || t('welcomeMsg');

  // City-specific landmark background(s) for the welcome hero. The /nearby
  // endpoint returns every image whose coverage area (lat/lng + radius_km)
  // contains the user's current position, sorted by distance ascending.
  // When multiple match (overlapping coverage), the hero auto-cycles through
  // them every 5 s. Empty list = fall back to the default teal gradient.
  const heroLat = selectedLocation?.latitude ?? gpsCoords?.latitude;
  const heroLng = selectedLocation?.longitude ?? gpsCoords?.longitude;
  const { data: cityImages } = useNearbyCityImages(heroLat, heroLng);
  const heroBackgroundImages = useMemo(
    () =>
      (cityImages ?? []).map((c) => ({
        imageUrl: c.imageUrl,
        caption: c.caption,
      })),
    [cityImages],
  );

  // ── Role-based dashboard routing ───────────────────────────────────────
  // All hooks have been called above — safe to branch here.
  // Doctors use the dedicated /(tabs)/dashboard tab; the Home tab shows the
  // same patient-style hub (hospitals, nearby doctors, search) for everyone.

  if (user?.role === 'HOSPITAL_MANAGER') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LogoHeader />
        <HospitalManagerDashboard />
      </SafeAreaView>
    );
  }

  if (user?.role === 'ADMIN') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LogoHeader />
        <AdminDashboard />
      </SafeAreaView>
    );
  }

  // Compact doctor card — shared by the phone carousel and the desktop-web grid.
  const renderDoctorCard = (item: DoctorListItem) => (
    <TouchableOpacity
      style={[styles.compactDoctorCard, isDesktopWeb && styles.gridDoctorCard]}
      onPress={() => router.push({ pathname: '/doctor/[id]', params: { id: String(item.id) } })}
      activeOpacity={0.8}
    >
      <Image source={item.photo} style={styles.compactImage} contentFit="cover" transition={300} />
      {item.verified && (
        <View style={styles.compactVerifiedBadge}>
          <Text style={styles.compactVerifiedIcon}>✓</Text>
        </View>
      )}
      <Text style={styles.compactName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.compactSpec} numberOfLines={1}>
        {item.specialization}
      </Text>
      <View style={styles.compactRatingRow}>
        {/* Social proof first when it exists; never show empty ratings */}
        {typeof item.rating === 'number' && item.rating > 0 && (
          <>
            <Text style={styles.compactStar}>★</Text>
            <Text style={styles.compactRating}>{item.rating.toFixed(1)}</Text>
            <Text style={styles.compactExp}> · </Text>
          </>
        )}
        {formatShortCredential(item.degree) !== '' ? (
          <>
            <Text style={styles.compactRating} numberOfLines={1}>
              {formatShortCredential(item.degree)}
            </Text>
            <Text style={styles.compactExp}> · {item.experience}yr</Text>
          </>
        ) : (
          <Text style={styles.compactExp}>{item.experience}yr exp</Text>
        )}
      </View>
      {typeof item.distanceKm === 'number' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 }}>
          <MapPin size={10} color={Colors.textSecondary} strokeWidth={2.5} />
          <Text style={styles.compactHospital} numberOfLines={1}>
            {item.distanceKm.toFixed(1)} km
          </Text>
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 }}>
        <Hospital size={10} color={Colors.textSecondary} strokeWidth={2} />
        <Text style={styles.compactHospital} numberOfLines={1}>
          {item.hospitalName}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Seo
        title="Book Doctor Appointments & Track Your Queue"
        description="Find doctors and hospitals near you, book appointments, and track your live queue token — MedQ+."
        path="/"
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Header */}
        <LogoHeader />

        {/* Brand-led greeting hero (replaces the old solid welcome banner) */}
        <WelcomeHero
          userName={userName}
          isLoggedIn={isLoggedIn}
          tagline={
            isLoggedIn
              ? `Find doctors and hospitals within ${RADIUS_KM} km of you`
              : t('appTagline')
          }
          hospitalsCount={hospitalsList.length || undefined}
          doctorsCount={doctorsList.length || undefined}
          searchPlaceholder={`${t('search')} ${t('topDoctors').toLowerCase()}…`}
          onSearchPress={() => router.push('/(tabs)/search')}
          onSearchSubmit={(q) => router.push({ pathname: '/(tabs)/search', params: { q } })}
          backgroundImages={heroBackgroundImages}
        />

        {/* Quick action grid */}
        <QuickActions
          onFindDoctor={() => router.push('/(tabs)/search')}
          onNearMe={() =>
            router.push({
              pathname: '/nearme',
              params: gpsCoords
                ? { lat: String(gpsCoords.latitude), lng: String(gpsCoords.longitude) }
                : {},
            })
          }
          onMyBookings={() => router.push('/(tabs)/booking')}
          onEmergency={() => router.push('/(tabs)/search')}
        />

        {/* Loading State — skeleton cards read faster than a spinner */}
        {isLoading && !refreshing && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {detecting ? t('detectingYourLocation') : t('findingDoctorsNearYou')}
            </Text>
            <View style={styles.skeletonRow}>
              <SkeletonCard />
              <SkeletonCard />
              {isDesktopWeb && <SkeletonCard />}
            </View>
          </View>
        )}

        {/* Nearby Hospitals (real API data) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Hospital size={18} color={Colors.text} strokeWidth={2} />
              <Text style={styles.sectionTitle}>{t('nearbyHospitals')}</Text>
            </View>
            {hospitalsList.length > 0 && (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/nearme',
                    params: gpsCoords
                      ? {
                          lat: String(gpsCoords.latitude),
                          lng: String(gpsCoords.longitude),
                          tab: 'hospitals',
                        }
                      : { tab: 'hospitals' },
                  })
                }
              >
                <Text style={styles.seeAll}>{t('seeAll')} →</Text>
              </TouchableOpacity>
            )}
          </View>

          {hospitalsError && !hospitalsLoading && (
            <View style={styles.errorCard}>
              <AlertTriangle size={18} color={Colors.error} strokeWidth={2} />
              <Text style={styles.errorText}>{t('unableToLoadHospitals')}</Text>
            </View>
          )}

          {!hospitalsLoading && !hospitalsError && hospitalsList.length === 0 && !detecting && (
            <View style={styles.emptyCard}>
              <Hospital size={36} color={Colors.textLight} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>{t('noHospitalsNearby')}</Text>
              <Text style={styles.emptySubtitle}>{t('tryWiderLocation')}</Text>
            </View>
          )}

          {hospitalsList.length > 0 &&
            (isDesktopWeb ? (
              <View style={styles.webGrid}>
                {hospitalsList.slice(0, hospitalCols * 2).map((item) => (
                  <View key={item.id} style={{ width: `${100 / hospitalCols - 1.5}%` }}>
                    <HoverLift>
                      <HospitalCard
                        name={item.name}
                        image={item.image || ''}
                        distance={item.distance || ''}
                        rating={item.rating}
                        doctorsCount={item.doctorsCount}
                        style={styles.gridHospitalCard}
                        onPress={() =>
                          router.push({
                            pathname: '/hospital/[id]',
                            params: { id: String(item.id) },
                          })
                        }
                      />
                    </HoverLift>
                  </View>
                ))}
              </View>
            ) : (
              <FlashList
                data={hospitalsList}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item.id)}
                estimatedItemSize={178}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <HospitalCard
                    name={item.name}
                    image={item.image}
                    distance={item.distance || ''}
                    rating={item.rating}
                    doctorsCount={item.doctorsCount}
                    onPress={() =>
                      router.push({ pathname: '/hospital/[id]', params: { id: String(item.id) } })
                    }
                  />
                )}
              />
            ))}
        </View>

        {/* Top Doctors Near You (horizontal) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Star size={18} color={Colors.gold} strokeWidth={2} />
              <Text style={styles.sectionTitle}>{t('famousDoctors')}</Text>
            </View>
            {doctorsList.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                <Text style={styles.seeAll}>{t('seeAll')} →</Text>
              </TouchableOpacity>
            )}
          </View>

          {doctorsError && !doctorsLoading && (
            <View style={styles.errorCard}>
              <AlertTriangle size={18} color={Colors.error} strokeWidth={2} />
              <Text style={styles.errorText}>{t('unableToLoadDoctors')}</Text>
            </View>
          )}

          {!doctorsLoading && !doctorsError && shuffledDoctors.length === 0 && !detecting && (
            <View style={styles.emptyCard}>
              <UserRound size={36} color={Colors.textLight} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>{t('noDoctorsNearby')}</Text>
              <Text style={styles.emptySubtitle}>{t('tryChangeLocationOrSpec')}</Text>
            </View>
          )}

          {shuffledDoctors.length > 0 && isDesktopWeb && (
            <View style={styles.webGrid}>
              {shuffledDoctors.slice(0, doctorCols * 2).map((item) => (
                <View key={item.id} style={{ width: `${100 / doctorCols - 1.5}%` }}>
                  <HoverLift>{renderDoctorCard(item)}</HoverLift>
                </View>
              ))}
            </View>
          )}

          {shuffledDoctors.length > 0 && !isDesktopWeb && (
            <FlashList
              data={shuffledDoctors.slice(0, 6)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => String(item.id)}
              estimatedItemSize={178}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => renderDoctorCard(item)}
            />
          )}
        </View>

        {/* All Doctors Near You (vertical list) */}
        {shuffledDoctors.length > 0 && (
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Stethoscope size={18} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.sectionTitle}>
                {t('topDoctors')} — {displayName}
              </Text>
            </View>
            <View style={isDesktopWeb && styles.webGrid}>
              {shuffledDoctors.map((doctor) => (
                <View key={doctor.id} style={isDesktopWeb && { width: `${100 / 2 - 1}%` }}>
                  <HoverLift>
                    <PremiumDoctorCard
                      doctor={doctor}
                      onPress={() =>
                        router.push({ pathname: '/doctor/[id]', params: { id: String(doctor.id) } })
                      }
                      style={styles.fullDoctorCard}
                      variant="full"
                    />
                  </HoverLift>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
        <WebFooter />
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
    backgroundColor: Colors.white,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 4,
      opacity: 0.08,
      radius: 16,
      elevation: 5,
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 2,
  },
  locationPin: {
    fontSize: 14,
  },
  locationText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
    flex: 1,
  },
  locationWarning: {
    fontSize: 12,
    marginHorizontal: 2,
  },
  locationDropdown: {
    fontSize: 9,
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: '700',
  },
  // Welcome Banner
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: Colors.primary,
    borderRadius: 22,
    padding: 20,
    ...crossPlatformShadow({
      color: Colors.primaryDark,
      offsetY: 8,
      opacity: 0.3,
      radius: 20,
      elevation: 10,
    }),
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeGreeting: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: 2,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.white,
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    marginBottom: 14,
  },
  welcomeBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  welcomeBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  welcomeEmoji: {
    fontSize: 56,
    marginLeft: 10,
  },
  // Near Me
  nearMeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 4,
      opacity: 0.06,
      radius: 12,
      elevation: 3,
    }),
  },
  nearMeIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  nearMeTextWrap: {
    flex: 1,
  },
  nearMeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  nearMeSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 1,
  },
  nearMeArrow: {
    fontSize: 22,
    color: Colors.primary,
    fontWeight: '700',
  },
  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  // Error & Empty
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 2,
      opacity: 0.06,
      radius: 8,
      elevation: 2,
    }),
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Sections
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 2,
  },
  seeAll: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '700',
  },
  horizontalList: {
    paddingRight: 16,
  },
  // Desktop web: carousels become wrap-grids (same idiom as search.tsx).
  webGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: 12,
  },
  gridHospitalCard: {
    width: '100%',
    marginRight: 0,
    height: 180,
  },
  gridDoctorCard: {
    width: '100%',
    marginRight: 0,
  },
  skeletonRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  bottomSpacer: {
    height: 24,
  },
  // ─── Hospital Card (inline) ─────────────────────────
  hospitalCard: {
    width: 220,
    height: 160,
    borderRadius: 18,
    marginRight: 14,
    overflow: 'hidden',
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 6,
      opacity: 0.15,
      radius: 16,
      elevation: 6,
    }),
  },
  hospitalImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    backgroundColor: Colors.borderLight,
  },
  hospitalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 18,
  },
  hospitalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  hospitalName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  hospitalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 3,
  },
  hospitalDistance: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  hospitalRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hospitalRatingStar: {
    fontSize: 11,
    color: '#FFD700',
    marginRight: 3,
  },
  hospitalRatingText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '700',
  },
  hospitalDoctors: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  // ─── Compact Doctor Card (horizontal) ───────────────
  compactDoctorCard: {
    width: 150,
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 14,
    marginRight: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 4,
      opacity: 0.1,
      radius: 12,
      elevation: 5,
    }),
  },
  compactImageWrap: {
    position: 'relative',
    marginBottom: 10,
  },
  compactImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.borderLight,
  },
  compactVerifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.trustGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  compactVerifiedIcon: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '900',
  },
  compactName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  compactSpec: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  compactRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactStar: {
    fontSize: 12,
    color: Colors.gold,
    marginRight: 2,
  },
  compactRating: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  compactExp: {
    fontSize: 11,
    color: Colors.textLight,
  },
  compactHospital: {
    fontSize: 10,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 4,
  },
  // ─── Full Doctor Card (vertical) ────────────────────
  // Don't override layout properties from PremiumDoctorCard's own `cardFull`
  // style — adding `flexDirection: 'row'` and `padding: 14` here caused the
  // outer wrapper to shrink-wrap, leaving dead space on the right. The card's
  // internal padding (topRow/bottomRow) already handles spacing.
  fullDoctorCard: {
    alignSelf: 'stretch',
    marginHorizontal: 0,
    marginBottom: 14,
  },
  fullImageSection: {
    marginRight: 12,
  },
  fullDoctorImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.borderLight,
  },
  fullVerifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.trustGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  fullVerifiedIcon: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '900',
  },
  fullInfoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  fullName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 2,
  },
  fullSpecialization: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: 6,
  },
  fullStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  fullRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  fullStarIcon: {
    fontSize: 11,
    color: Colors.gold,
    marginRight: 2,
  },
  fullRatingValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  fullStatDot: {
    color: Colors.textLight,
    fontSize: 8,
  },
  fullStatText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  fullHospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  fullHospitalIcon: {
    fontSize: 12,
  },
  fullHospitalName: {
    fontSize: 12,
    color: Colors.textLight,
    flex: 1,
  },
  fullDistanceText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  fullTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fullVerifiedTag: {
    backgroundColor: '#E8F8EE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  fullVerifiedTagText: {
    fontSize: 11,
    color: Colors.trustGreen,
    fontWeight: '700',
  },
  fullAvailability: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500',
  },
  fullActionSection: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  fullBookButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  fullBookButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
