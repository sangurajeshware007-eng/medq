import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Hospital, Shield, Star } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { useLanguage } from '../context/LanguageContext';
import { Doctor } from '../utils/mockData';
import { crossPlatformShadow } from '../utils/shadow';
import LocalizedName from './LocalizedName';

interface DoctorCardProps {
  doctor: Doctor;
  onPress: () => void;
  compact?: boolean;
}

export default function DoctorCard({ doctor, onPress, compact = false }: DoctorCardProps) {
  const { t } = useLanguage();

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.compactImageWrap}>
          <Image source={doctor.photo} style={styles.compactImage} contentFit="cover" transition={300} />
          {doctor.verified && (
            <View style={styles.compactVerified}>
              <Text style={styles.compactVerifiedIcon}>✓</Text>
            </View>
          )}
        </View>
        <LocalizedName name={doctor.name} style={styles.compactName} numberOfLines={1} />
        <Text style={styles.compactSpec} numberOfLines={1}>{t(doctor.specializationKey)}</Text>
        <View style={styles.compactRatingRow}>
          <Text style={styles.compactStar}>★</Text>
          <Text style={styles.compactRating}>{doctor.rating}</Text>
          <Text style={styles.compactExp}> · {doctor.experience}yr</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageSection}>
        <Image source={doctor.photo} style={styles.doctorImage} contentFit="cover" transition={300} />
        {doctor.verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedIcon}>✓</Text>
          </View>
        )}
      </View>

      <View style={styles.infoSection}>
        <LocalizedName name={doctor.name} style={styles.name} numberOfLines={1} />
        <Text style={styles.specialization}>{t(doctor.specializationKey)}</Text>

        <View style={styles.statsRow}>
          <View style={styles.ratingPill}>
            <Text style={styles.starIcon}>★</Text>
            <Text style={styles.ratingValue}>{doctor.rating}</Text>
          </View>
          <Text style={styles.statDot}>·</Text>
          <Text style={styles.statText}>{doctor.experience} {t('yearsExp')}</Text>
          <Text style={styles.statDot}>·</Text>
          <Text style={styles.statText}>{doctor.patientsServed}+</Text>
        </View>

        <View style={styles.hospitalRow}>
          <Hospital size={14} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.hospitalName} numberOfLines={1}>{doctor.hospitalAffiliation}</Text>
        </View>

        {doctor.verified && (
          <View style={styles.verifiedTag}>
            <Text style={styles.verifiedTagText}>{t('verified')}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionSection}>
        <Text style={styles.fee}>₹{doctor.consultationFee}</Text>
        <View style={styles.bookButton}>
          <Text style={styles.bookButtonText}>{t('bookNow')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // === FULL CARD ===
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    marginBottom: 14,
    ...crossPlatformShadow({ color: Colors.shadowDark, offsetY: 4, opacity: 0.12, radius: 16, elevation: 6 }),
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  imageSection: {
    marginRight: 12,
    position: 'relative',
  },
  doctorImage: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: Colors.borderLight,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.trustGreen,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  verifiedIcon: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  infoSection: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  specialization: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  starIcon: {
    fontSize: 12,
    color: Colors.gold,
    marginRight: 2,
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gold,
  },
  statDot: {
    marginHorizontal: 5,
    color: Colors.textLight,
    fontSize: 12,
  },
  statText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  hospitalIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  hospitalName: {
    fontSize: 11,
    color: Colors.textLight,
    flex: 1,
  },
  verifiedTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.trustGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedTagText: {
    fontSize: 10,
    color: Colors.trustGreen,
    fontWeight: '700',
  },
  actionSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 8,
  },
  fee: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  bookButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    ...crossPlatformShadow({ color: Colors.accentGlow, offsetY: 3, opacity: 1, radius: 8, elevation: 4 }),
  },
  bookButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },

  // === COMPACT CARD ===
  compactContainer: {
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 12,
    width: 150,
    marginRight: 12,
    alignItems: 'center',
    ...crossPlatformShadow({ color: Colors.shadowDark, offsetY: 4, opacity: 0.1, radius: 12, elevation: 5 }),
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  compactImageWrap: {
    position: 'relative',
    marginBottom: 10,
  },
  compactImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.borderLight,
    borderWidth: 2.5,
    borderColor: Colors.primary,
  },
  compactVerified: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    backgroundColor: Colors.trustGreen,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  compactVerifiedIcon: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  compactName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  compactSpec: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
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
    color: Colors.gold,
  },
  compactExp: {
    fontSize: 11,
    color: Colors.textLight,
  },
});
