import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MapPin } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { useLanguage } from '../context/LanguageContext';
import { crossPlatformShadow } from '../utils/shadow';

interface HospitalCardProps {
  name: string;
  image: string;
  distance: string;
  rating: number;
  doctorsCount: number;
  onPress: () => void;
}

export default function HospitalCard({
  name,
  image,
  distance,
  rating,
  doctorsCount,
  onPress,
}: HospitalCardProps) {
  const { t } = useLanguage();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <Image source={image} style={styles.image} contentFit="cover" transition={300} />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.distance}>{distance}</Text>
          {/* Phase 1: star rating hidden until reviews ship.
              Restore when the review feature is enabled: */}
          {/* <View style={styles.ratingPill}>
            <Text style={styles.ratingStar}>★</Text>
            <Text style={styles.ratingText}>{rating}</Text>
          </View> */}
        </View>
        <Text style={styles.doctors}>{doctorsCount} {t('topDoctors').toLowerCase()}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 220,
    height: 160,
    borderRadius: 18,
    marginRight: 14,
    overflow: 'hidden',
    ...crossPlatformShadow({ color: Colors.shadowDark, offsetY: 6, opacity: 0.15, radius: 16, elevation: 6 }),
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    backgroundColor: Colors.borderLight,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 18,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 3,
  },
  distance: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingStar: {
    fontSize: 11,
    color: Colors.gold,
    marginRight: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  doctors: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
});
