import {
  GraduationCap,
  Hospital,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Clock,
  Star,
} from 'lucide-react-native';
import React from 'react';
import type { ViewStyle } from 'react-native';
import { Text, View, StyleSheet, Image, Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
} from 'react-native-reanimated';

import { isAvailableToday } from '../utils/availability';
import { formatShortCredential } from '../utils/doctorCredential';
import { crossPlatformShadow } from '../utils/shadow';

import LocalizedName from './LocalizedName';

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
    /** Day-of-week ints (0=Sun … 6=Sat) with active availability. */
    availableDays?: number[];
  };
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'full' | 'compact';
}

export default function PremiumDoctorCard({
  doctor,
  onPress,
  style,
  variant = 'compact',
}: PremiumDoctorCardProps) {
  const scale = useSharedValue(1);
  const floatY = useSharedValue(0);

  // Fluid floating animation using sine wave
  React.useEffect(() => {
    floatY.value = withRepeat(withTiming(1, { duration: 2200 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    // Sine wave for smooth floating
    const translateY = interpolate(floatY.value, [0, 1], [-10, 6]);
    const animatedScale = interpolate(floatY.value, [0, 1], [1, 0.98]);
    return {
      transform: [{ scale: scale.value * animatedScale }, { translateY }],
      zIndex: 99,
      elevation: 12, // Android pop-out
    };
  });

  if (variant === 'full') {
    const credential = formatShortCredential(doctor.degree);
    return (
      <Animated.View style={[styles.cardFull, animatedStyle, style]}>
        <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
          {/* Teal accent stripe — anchors the card to the brand and adds depth */}
          <View style={styles.accentStripe} />

          {/* Top row: photo + info column (info uses all remaining width) */}
          <View style={styles.topRow}>
            <View style={styles.fullImageSection}>
              <Image
                source={doctor.photo ? { uri: doctor.photo } : undefined}
                style={styles.fullDoctorImage}
              />
              {doctor.verified && (
                <View style={styles.fullVerifiedBadge}>
                  <ShieldCheck size={11} color="#fff" strokeWidth={3} />
                </View>
              )}
            </View>

            <View style={styles.fullInfoSection}>
              {/* Name — single line, full available width */}
              <View style={styles.nameRow}>
                <LocalizedName name={doctor.name} style={styles.fullName} numberOfLines={1} />
                {doctor.verified && <ShieldCheck size={13} color="#10B981" strokeWidth={2.5} />}
              </View>

              {/* Specialization — single line */}
              <Text style={styles.fullSpecialization} numberOfLines={1}>
                {doctor.specialization?.replace(/_/g, ' ')}
              </Text>

              {/* Meta row: credential + experience as compact chips */}
              <View style={styles.metaRow}>
                {credential !== '' && (
                  <View style={styles.metaChipGold}>
                    <GraduationCap size={10} color="#B45309" strokeWidth={2.5} />
                    <Text style={styles.metaChipGoldText} numberOfLines={1}>
                      {credential}
                    </Text>
                  </View>
                )}
                {doctor.experience > 0 && (
                  <View style={styles.metaChipNeutral}>
                    <Clock size={10} color="#475569" strokeWidth={2.5} />
                    <Text style={styles.metaChipNeutralText}>{doctor.experience}+ yrs</Text>
                  </View>
                )}
                {isAvailableToday(doctor.availableDays) && (
                  <View style={styles.metaChipGreen}>
                    <Text style={styles.metaChipGreenText}>Available today</Text>
                  </View>
                )}
              </View>

              {/* Hospital + distance — single line, ellipsised */}
              {doctor.hospitalName && (
                <View style={styles.fullHospitalRow}>
                  <MapPin size={11} color="#64748B" strokeWidth={2.5} />
                  <LocalizedName
                    name={doctor.hospitalName}
                    style={styles.fullHospitalName}
                    numberOfLines={1}
                  />
                  {doctor.distanceKm != null && (
                    <View style={styles.distancePill}>
                      <Text style={styles.fullDistanceText}>{doctor.distanceKm.toFixed(1)} km</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Bottom row: fee left, Book Now button right (stretched) */}
          <View style={styles.divider} />
          <View style={styles.bottomRow}>
            {doctor.consultationFee ? (
              <View style={styles.feeBlock}>
                <Text style={styles.feeLabel}>Consultation</Text>
                <Text style={styles.feeAmount}>₹{doctor.consultationFee}</Text>
              </View>
            ) : (
              <View />
            )}

            <TouchableOpacity style={styles.bookCta} onPress={onPress} activeOpacity={0.85}>
              <Text style={styles.bookCtaText}>Book Now</Text>
              <ArrowRight size={14} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
        <LocalizedName name={doctor.name} style={styles.name} numberOfLines={1} />
        <Text style={styles.spec}>{doctor.specialization}</Text>
        <View style={styles.row}>
          {/* Social proof when it exists; never an empty/zero rating */}
          {typeof doctor.rating === 'number' && doctor.rating > 0 && (
            <>
              <Star size={13} color="#FFD700" fill="#FFD700" strokeWidth={0} />
              <Text style={[styles.rating, { marginLeft: 2 }]}>{doctor.rating.toFixed(1)} ·</Text>
            </>
          )}
          {formatShortCredential(doctor.degree) !== '' ? (
            <>
              <GraduationCap size={13} color="#D69E2E" strokeWidth={2.5} />
              <Text style={[styles.rating, { marginLeft: 3 }]}>
                {formatShortCredential(doctor.degree)}
              </Text>
              <Text style={styles.exp}>· {doctor.experience} yr</Text>
            </>
          ) : (
            <Text style={styles.exp}>{doctor.experience} yr exp</Text>
          )}
        </View>
        {doctor.consultationFee && <Text style={styles.fee}>₹{doctor.consultationFee}</Text>}
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
  // ── New "full" variant — premium two-row layout with brand accent ────
  cardFull: {
    backgroundColor: '#fff',
    borderRadius: 22,
    marginBottom: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...crossPlatformShadow({
      color: '#0A7E8C',
      opacity: 0.1,
      offsetY: 6,
      radius: 16,
      elevation: 6,
    }),
  },
  accentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#0A7E8C',
  },
  topRow: {
    flexDirection: 'row',
    padding: 14,
    paddingLeft: 18, // accommodate the 4 px accent stripe
    gap: 12,
  },
  fullImageSection: {
    position: 'relative',
  },
  fullDoctorImage: {
    width: 72,
    height: 72,
    borderRadius: 18, // squircle — feels more modern than a circle
    backgroundColor: '#F1F5F9',
  },
  fullVerifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  fullInfoSection: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0, // critical — lets numberOfLines truncate cleanly
    justifyContent: 'center',
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B2838',
    flexShrink: 1,
    minWidth: 0,
  },
  fullSpecialization: {
    fontSize: 12,
    color: '#0A7E8C',
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  metaChipGold: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  metaChipGoldText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  metaChipNeutral: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  metaChipNeutralText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  metaChipGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  metaChipGreenText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  fullHospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  fullHospitalName: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  distancePill: {
    backgroundColor: '#E6F7F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  fullDistanceText: {
    fontSize: 11,
    color: '#0A7E8C',
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 14,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingLeft: 18,
    paddingVertical: 10,
    gap: 12,
  },
  feeBlock: {
    flexShrink: 1,
    minWidth: 0,
  },
  feeLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  feeAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1B2838',
    marginTop: 1,
  },
  bookCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0A7E8C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    ...crossPlatformShadow({
      color: '#0A7E8C',
      opacity: 0.25,
      offsetY: 4,
      radius: 8,
      elevation: 4,
    }),
  },
  bookCtaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
