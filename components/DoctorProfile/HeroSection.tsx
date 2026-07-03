import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Star, ShieldCheck, MapPin, GraduationCap } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { crossPlatformShadow } from '../../utils/shadow';

interface HeroSectionProps {
  doctor: any;
}

export default function HeroSection({ doctor }: HeroSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <Image source={doctor.avatarUrl || doctor.photo} style={styles.avatar} contentFit="cover" transition={300} />
          {doctor.isVerified && (
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={16} color={Colors.white} fill={Colors.trustGreen} />
            </View>
          )}
        </View>

        <View style={styles.details}>
          <Text style={styles.name} numberOfLines={2}>{doctor.name}</Text>
          <View style={styles.degreeRow}>
            <GraduationCap size={14} color={Colors.textSecondary} />
            <Text style={styles.degreeText}>{doctor.degree || doctor.specialization}</Text>
          </View>
          
          <View style={styles.hospitalRow}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.hospitalName} numberOfLines={1}>
              {doctor.hospital?.name || (doctor.hospitals && doctor.hospitals[0]?.hospitalName) || 'Primary Care'}
            </Text>
          </View>

          <View style={styles.statsRow}>
            {/* Hide rating until the backend exposes it (≥5 reviews) — small-sample protection. */}
            {(doctor.totalReviews ?? 0) > 0 && (
              <>
                <View style={styles.statItem}>
                  <View style={styles.ratingBadge}>
                    <Star size={12} fill={Colors.gold} color={Colors.gold} />
                    <Text style={styles.ratingText}>{Number(doctor.rating).toFixed(1)}</Text>
                  </View>
                  <Text style={styles.statLabel}>{doctor.totalReviews} Reviews</Text>
                </View>
                <View style={styles.divider} />
              </>
            )}
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{doctor.experienceYears || doctor.experience}+ Yrs</Text>
              <Text style={styles.statLabel}>Exp.</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
    ...crossPlatformShadow({ color: Colors.shadow, offsetY: 4, opacity: 0.08, radius: 16, elevation: 4 }),
  },
  content: {
    flexDirection: 'row',
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 84,                    // smaller avatar gives the details column ~16 px more on iPhone 12
    height: 84,
    borderRadius: 18,
    backgroundColor: Colors.borderLight,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 2,
    ...crossPlatformShadow({ color: Colors.trustGreen, opacity: 0.2, radius: 4, elevation: 2 }),
  },
  details: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,                  // critical so children can shrink for long names
    justifyContent: 'center',
  },
  name: {
    fontSize: 19,                 // was 22 — too wide for iPhone 12; "Dr. Priya Patel" now fits one line
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 4,
  },
  degreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  degreeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  hospitalName: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,                      // was 16 — tighter on narrow phones
    flexWrap: 'wrap',             // safety net: wraps to next line on very narrow viewports
  },
  statItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flexShrink: 1,
    minWidth: 0,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.gold,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.borderLight,
  },
});
