import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Hospital, MapPin, Star, UserRound, Phone, Tag, Stethoscope, ChevronLeft } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../context/LanguageContext';
import { crossPlatformShadow } from '../../utils/shadow';
import { useHospital } from '../../hooks/useApiHooks';

export default function HospitalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const router = useRouter();

  const { data: hospital, isLoading, error } = useHospital(id || '');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.errorTitle}>Loading hospital...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !hospital) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Hospital size={56} color={Colors.textLight} strokeWidth={1.5} />
          <Text style={styles.errorTitle}>Hospital not found</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Extract unique specializations from hospital doctors
  const specializations = [
    ...new Set(hospital.doctors?.map((d) => d.specialization).filter(Boolean) || []),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {hospital.name}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hospital Banner */}
        <View style={styles.bannerWrap}>
          <Image
            source={hospital.image}
            style={styles.bannerImage}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.bannerOverlay} />
          <View style={styles.bannerContent}>
            <Text style={styles.bannerName}>{hospital.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MapPin size={13} color="rgba(255,255,255,0.9)" strokeWidth={2.5} />
              <Text style={styles.bannerAddress}>
                {hospital.address}
              </Text>
            </View>
          </View>
        </View>

        {/* Hospital Info Pills */}
        <View style={styles.infoPills}>
          {/* Phase 1: Rating pill hidden until reviews ship.
              Restore this block + the adjacent divider when enabled: */}
          {/* <View style={styles.pill}>
            <Star size={20} color={Colors.gold} strokeWidth={2} />
            <Text style={styles.pillValue}>{hospital.rating}</Text>
            <Text style={styles.pillLabel}>Rating</Text>
          </View>
          <View style={styles.pillDivider} /> */}
          <View style={styles.pill}>
            <UserRound size={20} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.pillValue}>{hospital.doctors?.length || 0}</Text>
            <Text style={styles.pillLabel}>Doctors</Text>
          </View>
          {hospital.phone ? (
            <>
              <View style={styles.pillDivider} />
              <View style={styles.pill}>
                <Phone size={20} color={Colors.trustGreen} strokeWidth={2} />
                <Text style={styles.pillValue} numberOfLines={1}>{hospital.phone}</Text>
                <Text style={styles.pillLabel}>Call</Text>
              </View>
            </>
          ) : null}
        </View>

        {/* Specialities Tags */}
        {specializations.length > 0 && (
          <View style={styles.specSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Tag size={16} color={Colors.text} strokeWidth={2} />
              <Text style={styles.specSectionTitle}>Specialities</Text>
            </View>
            <View style={styles.specTags}>
              {specializations.map((spec) => (
                <View key={spec} style={styles.specTag}>
                  <Text style={styles.specTagText}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Doctors List */}
        <View style={styles.doctorsSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <UserRound size={18} color={Colors.text} strokeWidth={2} />
            <Text style={styles.doctorsSectionTitle}>
              Doctors at {hospital.name}
            </Text>
          </View>
          {hospital.doctors && hospital.doctors.length > 0 ? (
            hospital.doctors.map((doctor) => (
              <TouchableOpacity
                key={doctor.id}
                style={styles.doctorCard}
                onPress={() =>
                  router.push({
                    pathname: '/doctor/[id]',
                    params: { id: String(doctor.id) },
                  })
                }
                activeOpacity={0.8}
              >
                <Image
                  source={doctor.photo}
                  style={styles.doctorImage}
                  contentFit="cover"
                  transition={300}
                />
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName} numberOfLines={1}>{doctor.name}</Text>
                  <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
                  {doctor.rating != null && (
                    <Text style={styles.doctorRating}>★ {doctor.rating}</Text>
                  )}
                </View>
                <View style={styles.doctorAction}>
                  <Text style={styles.bookBtnText}>{t('bookNow')}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyDoctors}>
              <Stethoscope size={40} color={Colors.textLight} strokeWidth={1.5} />
              <Text style={styles.emptyText}>
                No doctors listed yet for this hospital.
              </Text>
              <Text style={styles.emptySubtext}>
                Check back soon — we're adding more doctors every day!
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header ────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...crossPlatformShadow({
      color: Colors.shadow,
      offsetY: 2,
      opacity: 1,
      radius: 8,
      elevation: 3,
    }),
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackIcon: {
    fontSize: 20,
    color: Colors.text,
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerSpacer: {
    width: 36,
  },

  scrollContent: {
    paddingBottom: 20,
  },

  // ── Banner ────────────────────────────────────────
  bannerWrap: {
    height: 200,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.borderLight,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bannerContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  bannerName: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.white,
    marginBottom: 4,
    ...Platform.select({
      web: { textShadow: '0 2px 8px rgba(0,0,0,0.5)' },
    }),
  },
  bannerAddress: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  // ── Info Pills ────────────────────────────────────
  infoPills: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: -24,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 4,
      opacity: 0.12,
      radius: 16,
      elevation: 6,
    }),
  },
  pill: {
    flex: 1,
    alignItems: 'center',
  },
  pillIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  pillValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  pillLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pillDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.borderLight,
  },

  // ── Specialities ─────────────────────────────────
  specSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  specSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  specTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  specTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },

  // ── Doctors Section ───────────────────────────────
  doctorsSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  doctorsSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 14,
  },

  // ── Doctor Card (inline) ──────────────────────────
  doctorCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 3,
      opacity: 0.1,
      radius: 12,
      elevation: 4,
    }),
  },
  doctorImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.borderLight,
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 2,
  },
  doctorSpec: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  doctorRating: {
    fontSize: 12,
    color: Colors.gold,
    fontWeight: '700',
  },
  doctorAction: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  bookBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Empty State ───────────────────────────────────
  emptyDoctors: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.white,
    borderRadius: 16,
    ...crossPlatformShadow({
      color: Colors.shadow,
      offsetY: 2,
      opacity: 1,
      radius: 8,
      elevation: 2,
    }),
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 32,
  },

  // ── Error State ───────────────────────────────────
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },

  bottomSpacer: {
    height: 40,
  },
});

