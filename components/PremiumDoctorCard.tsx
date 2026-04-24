
import React from 'react';
import { Text, View, StyleSheet, Image, ViewStyle, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming, withSequence, interpolate } from 'react-native-reanimated';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { crossPlatformShadow } from '../utils/shadow';
import { GraduationCap, Hospital } from 'lucide-react-native';
import { formatShortCredential } from '../utils/doctorCredential';

// ── Phase 1: reviews hidden ──────────────────────────────────────────────
// The rating/star UI is intentionally replaced with a qualification pill
// (e.g. "MBBS, MD"). When reviews ship, restore the commented star block
// below and pass `rating` into the Text child.

interface PremiumDoctorCardProps {
  doctor: {
    id?: string;
    photo?: string;
    name: string;
    specialization: string;
    rating: number;
    experience: number;
    consultationFee?: number;
    hospitalName?: string;
    availability?: string;
    verified?: boolean;
    languages?: string[];
    patientsServed?: number;
    distanceKm?: number;
    /** Short qualification string — takes the rating pill's slot in phase 1. */
    degree?: string;
  };
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'full' | 'compact';
}

export default function PremiumDoctorCard({ doctor, onPress, style, variant = 'compact' }: PremiumDoctorCardProps) {
  const scale = useSharedValue(1);
  const floatY = useSharedValue(0);

  // Fluid floating animation using sine wave
  React.useEffect(() => {
    floatY.value = withRepeat(
      withTiming(1, { duration: 2200 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    // Sine wave for smooth floating
    const translateY = interpolate(floatY.value, [0, 1], [-10, 6]);
    const animatedScale = interpolate(floatY.value, [0, 1], [1, 0.98]);
    return {
      transform: [
        { scale: scale.value * animatedScale },
        { translateY },
      ],
      zIndex: 99,
      elevation: 12, // Android pop-out
    };
  });

  if (variant === 'full') {
    return (
      <Animated.View style={[styles.card, animatedStyle, style, { flexDirection: 'row', alignItems: 'center', padding: 18 }]}> 
        <View style={styles.fullImageSection}>
          <Image source={doctor.photo ? { uri: doctor.photo } : undefined} style={styles.fullDoctorImage} />
          {doctor.verified && (
            <View style={styles.fullVerifiedBadge}>
              <Text style={styles.fullVerifiedIcon}>✓</Text>
            </View>
          )}
        </View>
        <View style={styles.fullInfoSection}>
          <Text style={styles.fullName} numberOfLines={1}>{doctor.name}</Text>
          <Text style={styles.fullSpecialization}>{doctor.specialization}</Text>
          <View style={styles.fullStatsRow}>
            {/* Phase 1: credential pill in place of rating */}
            {/* <View style={styles.fullRatingPill}>
              <Text style={styles.fullStarIcon}>★</Text>
              <Text style={styles.fullRatingValue}>{doctor.rating.toFixed(1)}</Text>
            </View> */}
            {formatShortCredential(doctor.degree) !== '' && (
              <View style={styles.fullRatingPill}>
                <GraduationCap size={11} color="#D69E2E" strokeWidth={2.5} />
                <Text style={[styles.fullRatingValue, { marginLeft: 3 }]}>
                  {formatShortCredential(doctor.degree)}
                </Text>
              </View>
            )}
            <Text style={styles.fullStatDot}>·</Text>
            <Text style={styles.fullStatText}>{doctor.experience} yr</Text>
            {doctor.patientsServed && (
              <>
                <Text style={styles.fullStatDot}>·</Text>
                <Text style={styles.fullStatText}>{doctor.patientsServed}+ patients</Text>
              </>
            )}
            {doctor.languages && doctor.languages.length > 0 && (
              <>
                <Text style={styles.fullStatDot}>·</Text>
                <Text style={styles.fullStatText}>{doctor.languages.join(', ')}</Text>
              </>
            )}
          </View>
          {doctor.hospitalName && (
            <View style={styles.fullHospitalRow}>
              <Hospital size={12} color="#888" strokeWidth={2} />
              <Text style={styles.fullHospitalName} numberOfLines={1}>{doctor.hospitalName}</Text>
              {doctor.distanceKm != null && (
                <Text style={styles.fullDistanceText}>{doctor.distanceKm.toFixed(1)} km</Text>
              )}
            </View>
          )}
          {doctor.availability && (
            <Text style={styles.fullAvailability}>Available: {doctor.availability}</Text>
          )}
          <View style={styles.fullTagsRow}>
            {doctor.verified && (
              <View style={styles.fullVerifiedTag}>
                <Text style={styles.fullVerifiedTagText}>Verified</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.fullActionSection}>
          {doctor.consultationFee && (
            <Text style={styles.fee}>₹{doctor.consultationFee}</Text>
          )}
          <TouchableOpacity style={styles.fullBookButton} onPress={onPress} activeOpacity={0.85}>
            <Text style={styles.fullBookButtonText}>Book</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }
  // Compact (default) card
  return (
    <Animated.View style={[styles.card, animatedStyle, style]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={() => (scale.value = withSpring(0.95))}
        onPressOut={() => (scale.value = withSpring(1))}
        onPress={onPress}
        style={styles.touch}
      >
        <Image source={doctor.photo ? { uri: doctor.photo } : undefined} style={styles.image} />
        <Text style={styles.name} numberOfLines={1}>{doctor.name}</Text>
        <Text style={styles.spec}>{doctor.specialization}</Text>
        <View style={styles.row}>
          {/* Phase 1: credential instead of rating */}
          {/* <Star size={14} color="#FFD700" />
          <Text style={styles.rating}>{doctor.rating.toFixed(1)}</Text> */}
          {formatShortCredential(doctor.degree) !== '' ? (
            <>
              <GraduationCap size={13} color="#D69E2E" strokeWidth={2.5} />
              <Text style={[styles.rating, { marginLeft: 3 }]}>{formatShortCredential(doctor.degree)}</Text>
              <Text style={styles.exp}>· {doctor.experience} yr</Text>
            </>
          ) : (
            <Text style={styles.exp}>{doctor.experience} yr exp</Text>
          )}
        </View>
        {doctor.consultationFee && (
          <Text style={styles.fee}>₹{doctor.consultationFee}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e0e0f0',
    ...crossPlatformShadow({ opacity: 0.18, radius: 22, elevation: 12 }),
    marginBottom: 22,
    marginHorizontal: 4,
    shadowColor: '#b0b8ff', // subtle blue glow
    zIndex: 99,
    elevation: 12,
  },
  touch: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  image: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 10,
    backgroundColor: '#f3f3f7',
  },
  name: {
    fontWeight: '700',
    fontSize: 16,
    color: '#222',
    marginBottom: 2,
  },
  spec: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontWeight: '700',
    color: '#222',
    marginLeft: 4,
    marginRight: 8,
  },
  exp: {
    color: '#888',
    fontSize: 12,
  },
  fee: {
    marginTop: 4,
    fontWeight: '700',
    color: '#2e7d32',
    fontSize: 15,
  },
  // Full card styles
  fullImageSection: {
    marginRight: 12,
  },
  fullDoctorImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f3f3f7',
  },
  fullVerifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  fullVerifiedIcon: {
    color: '#fff',
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
    color: '#222',
    marginBottom: 2,
  },
  fullSpecialization: {
    fontSize: 13,
    color: '#1976d2',
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
    color: '#FFD700',
    marginRight: 2,
  },
  fullRatingValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#222',
  },
  fullStatDot: {
    color: '#888',
    fontSize: 8,
    marginHorizontal: 4,
  },
  fullStatText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  fullHospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  fullHospitalName: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
  fullDistanceText: {
    fontSize: 11,
    color: '#1976d2',
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
    color: '#4caf50',
    fontWeight: '700',
  },
  fullAvailability: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  fullActionSection: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  fullBookButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  fullBookButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

