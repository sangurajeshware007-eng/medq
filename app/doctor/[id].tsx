import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import LocalizedName from '../../components/LocalizedName';
import {
  ChevronLeft,
  Shield,
  GraduationCap,
  Award,
  Hospital as HospitalIcon,
  Languages,
  FileText,
  Star,
  Frown,
  CheckCircle,
  Stethoscope,
  Briefcase,
  IdCard,
} from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../context/LanguageContext';
import { crossPlatformShadow } from '../../utils/shadow';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import DoctorProfileStrength from '../../components/DoctorProfileStrength';
import { useDoctor, useReviews, useSubmitReview } from '../../hooks/useApiHooks';

// Sub-components
import HeroSection from '../../components/DoctorProfile/HeroSection';

export default function DoctorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const { data: doctor, isLoading: doctorLoading } = useDoctor(id || '');
  const { data: reviews, isLoading: reviewsLoading } = useReviews(id || '1');

  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | undefined>(undefined);

  // Initialize selected hospital once doctor loads. Prefer the primary affiliation;
  // fall back to the first listed hospital, then to legacy doctor.hospital.id.
  React.useEffect(() => {
    if (!doctor) return;
    if (selectedHospitalId) return;
    const primary = doctor.hospitals?.find((h) => h.isPrimary);
    const fallback = primary?.hospitalId
      ?? doctor.hospitals?.[0]?.hospitalId
      ?? doctor.hospital?.id;
    if (fallback) setSelectedHospitalId(fallback);
  }, [doctor, selectedHospitalId]);

  const selectedHospital = useMemo(() => {
    if (!doctor) return null;
    if (doctor.hospitals?.length) {
      return doctor.hospitals.find((h) => h.hospitalId === selectedHospitalId) ?? doctor.hospitals[0];
    }
    return null;
  }, [doctor, selectedHospitalId]);

  const hasMultipleHospitals = (doctor?.hospitals?.length ?? 0) > 1;

  if (doctorLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading doctor details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Frown size={56} color={Colors.textLight} strokeWidth={1.5} />
          <Text style={styles.errorText}>Doctor not found</Text>
          <Button title={t('goHome')} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const aboutText = doctor.bio || doctor.about || '';
  const shouldShowReadMore = aboutText.length > 150;
  const displayedAbout = isAboutExpanded ? aboutText : aboutText.slice(0, 150) + (shouldShowReadMore ? '...' : '');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('aboutDoctor')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HERO SECTION — leads with the doctor's identity, not the meta widget */}
        <View style={styles.sectionMargin}>
           <HeroSection doctor={doctor} />
        </View>

        {/* ABOUT SECTION */}
        {aboutText.length > 0 && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>{t('aboutDoctor')}</Text>
            </View>
            <Text style={styles.aboutContent}>
              {displayedAbout}
            </Text>
            {shouldShowReadMore && (
              <TouchableOpacity onPress={() => setIsAboutExpanded(!isAboutExpanded)} style={styles.readMoreContainer}>
                 <Text style={styles.readMoreText}>{isAboutExpanded ? 'Read Less' : 'Read More'}</Text>
              </TouchableOpacity>
            )}
          </Card>
        )}

        {/* REGISTRATION & VERIFIED */}
        <Card style={styles.idCard}>
          <View style={styles.idRow}>
             <View style={styles.idInfo}>
                <View style={styles.labelRow}>
                   <IdCard size={14} color={Colors.textSecondary} />
                   <Text style={styles.idLabel}>Registration No.</Text>
                </View>
                <Text style={styles.idValue}>{doctor.registrationNo || 'KMC-23456'}</Text>
             </View>
             <View style={styles.verticalDivider} />
             <View style={styles.idInfo}>
                <View style={styles.labelRow}>
                   <Shield size={14} color={Colors.trustGreen} />
                   <Text style={styles.idLabel}>Status</Text>
                </View>
                <Text style={[styles.idValue, { color: Colors.trustGreen }]}>Verified Doctor</Text>
             </View>
          </View>
        </Card>

        {/* QUALIFICATIONS & EDUCATION */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <GraduationCap size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Qualifications & Education</Text>
          </View>
          {(doctor.qualifications || []).map((q: any, i: number) => (
            <View key={i} style={styles.listRow}>
               <View style={styles.bulletDot} />
               <View style={styles.listContent}>
                  <Text style={styles.listTitle}>{q.degree}</Text>
                  <Text style={styles.listSubtitle}>{q.institution} • {q.year}</Text>
               </View>
            </View>
          ))}
          {(!doctor.qualifications || doctor.qualifications.length === 0) && (
             <View style={styles.listRow}>
                <View style={styles.bulletDot} />
                <View style={styles.listContent}>
                   <Text style={styles.listTitle}>{doctor.degree || doctor.specialization}</Text>
                   <Text style={styles.listSubtitle}>{doctor.institution || 'Recognized Medical College'}</Text>
                </View>
             </View>
          )}
        </Card>

        {/* CONDITIONS TREATED (WHICH PATIENT DOCTOR WILL SEE) */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Stethoscope size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Which patients we see</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Common conditions and cases treated by <LocalizedName name={doctor.name} />:
          </Text>
          <View style={styles.tagsGrid}>
            {(doctor.conditions || doctor.diseases || []).map((d: any, i: number) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{typeof d === 'string' ? d : d.condition}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* SERVICES OFFERED */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Briefcase size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Services Offered</Text>
          </View>
          <View style={styles.servicesList}>
             {(doctor.services || []).map((s: any, i: number) => (
               <View key={i} style={styles.serviceItem}>
                  <CheckCircle size={14} color={Colors.trustGreen} />
                  <Text style={styles.serviceText}>{s}</Text>
               </View>
             ))}
          </View>
        </Card>

        {/* AWARDS & RECOGNITION */}
        {doctor.awards && doctor.awards.length > 0 && (
           <Card style={[styles.sectionCard, { backgroundColor: Colors.goldLight, borderColor: Colors.gold + '20' }]}>
              <View style={styles.sectionHeader}>
                <Award size={20} color={Colors.gold} />
                <Text style={styles.sectionTitle}>Awards & Recognition</Text>
              </View>
              {doctor.awards.map((award: any, i: number) => (
                 <View key={i} style={styles.awardItem}>
                    <Text style={styles.awardText}>{award}</Text>
                 </View>
              ))}
           </Card>
        )}

        {/* LANGUAGES */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Languages size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Languages Spoken</Text>
          </View>
          <View style={styles.tagsGrid}>
            {(doctor.languages || []).map((lang: string, i: number) => (
              <View key={i} style={styles.langTag}>
                <Text style={styles.langText}>{lang}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* CLINIC LOCATION */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <HospitalIcon size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>
              {hasMultipleHospitals ? 'Hospitals' : 'Clinic Details'}
            </Text>
          </View>

          {hasMultipleHospitals && (
            <View style={styles.hospitalChipsRow}>
              {doctor.hospitals.map((h) => {
                const isActive = h.hospitalId === selectedHospitalId;
                return (
                  <TouchableOpacity
                    key={h.hospitalId}
                    style={[styles.hospitalChip, isActive && styles.hospitalChipActive]}
                    onPress={() => setSelectedHospitalId(h.hospitalId)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[styles.hospitalChipText, isActive && styles.hospitalChipTextActive]}
                      numberOfLines={1}
                    >
                      {h.hospitalName}
                    </Text>
                    {h.isPrimary && (
                      <Text style={[styles.hospitalChipBadge, isActive && styles.hospitalChipBadgeActive]}>
                        PRIMARY
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.clinicBox}>
            <LocalizedName
              name={
                selectedHospital?.hospitalName
                || doctor.hospital?.name
                || (doctor.hospitals && doctor.hospitals[0]?.hospitalName)
                || ''
              }
              style={styles.clinicName}
            />
            <Text style={styles.clinicAddress}>
              {selectedHospital?.address || doctor.clinicAddress || doctor.hospital?.address}
            </Text>
            <View style={styles.feeBadge}>
              <Text style={styles.feeLabel}>In-Clinic Consultation Fee:</Text>
              <Text style={styles.feeValue}>
                ₹{selectedHospital?.consultationFee ?? doctor.consultationFee ?? doctor.fee}
              </Text>
            </View>
          </View>
        </Card>

        {/* REVIEWS & RATINGS */}
        {(doctor.totalReviews ?? 0) > 0 && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Star size={20} color={Colors.gold} fill={Colors.gold} />
              <Text style={styles.sectionTitle}>{t('reviewsAndRatings') || 'Reviews & Ratings'}</Text>
              <Text style={styles.reviewsAggregate}>
                ★ {(doctor.rating ?? 0).toFixed(1)} · {doctor.totalReviews} {t('reviewsCountSuffix') || 'reviews'}
              </Text>
            </View>
            {reviewsLoading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <>
                {(reviews ?? []).slice(0, 5).map((r) => (
                  <View key={r.id} style={styles.reviewItem}>
                    <View style={styles.reviewItemHeader}>
                      <Text style={styles.reviewerName}>{r.userName}</Text>
                      <View style={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={12}
                            color={n <= r.rating ? Colors.gold : Colors.textSecondary}
                            fill={n <= r.rating ? Colors.gold : 'transparent'}
                            strokeWidth={2}
                          />
                        ))}
                      </View>
                    </View>
                    {r.comment ? (
                      <Text style={styles.reviewComment} numberOfLines={4}>
                        {r.comment}
                      </Text>
                    ) : null}
                  </View>
                ))}
                {(doctor.totalReviews ?? 0) > (reviews?.length ?? 0) && (
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/doctor/[id]/reviews', params: { id: id ?? '' } })}
                    style={styles.seeAllReviews}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.seeAllReviewsText}>
                      {t('seeAllReviews') || 'See all reviews'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </Card>
        )}

        {/* Profile Strength — moved to the bottom so it doesn't compete with
            primary booking content (doctor identity, qualifications, fee). */}
        <View style={styles.sectionMargin}>
          <DoctorProfileStrength
            photo={!!doctor.photo || !!doctor.avatarUrl}
            education={!!(doctor.qualifications && doctor.qualifications.length > 0) || !!(doctor.education && doctor.education.length > 0)}
            specialization={!!doctor.specialization}
            experience={(doctor.experienceYears || doctor.experience) > 0}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* STICKY BOTTOM BOOK BUTTON */}
      <View style={styles.stickyBar}>
        <View style={styles.priceContainer}>
           <Text style={styles.priceLabel}>Consultation</Text>
           <Text style={styles.priceValue}>₹{doctor.consultationFee || doctor.fee}</Text>
        </View>
        <Button
          title="Book Appointment"
          onPress={() => router.push({
            pathname: '/booking/[id]',
            params: {
              id: doctor.id,
              ...(selectedHospitalId ? { hospitalId: selectedHospitalId } : {}),
            },
          })}
          size="large"
          style={styles.bookBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionMargin: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
    borderRadius: 24,
  },
  aboutContent: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    fontWeight: '500',
  },
  readMoreContainer: {
    marginTop: 8,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  idCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.white,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  idInfo: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  idLabel: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  idValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  sectionDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  listRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 8,
  },
  listContent: {
    flex: 1,
  },
  reviewsAggregate: {
    marginLeft: 'auto',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  seeAllReviews: {
    alignItems: 'center',
    paddingTop: 12,
  },
  seeAllReviewsText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 2,
  },
  listSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  servicesList: {
    gap: 10,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  awardItem: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  awardText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    fontWeight: '600',
  },
  langTag: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  hospitalChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  hospitalChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hospitalChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  hospitalChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    maxWidth: 180,
  },
  hospitalChipTextActive: {
    color: Colors.white,
  },
  hospitalChipBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  hospitalChipBadgeActive: {
    color: Colors.primary,
    backgroundColor: Colors.white,
  },
  clinicBox: {
    gap: 6,
  },
  clinicName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  clinicAddress: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontWeight: '600',
  },
  feeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: Colors.trustGreenLight,
    padding: 12,
    borderRadius: 12,
  },
  feeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  feeValue: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.trustGreen,
  },
  bottomSpacer: {
    height: 120,
  },
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,        // was 20 — gives the button ~8 px more room on narrow phones
    paddingTop: 14,
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,                      // was 20
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...crossPlatformShadow({ color: Colors.primary, offsetY: -4, opacity: 0.1, radius: 12, elevation: 12 }),
  },
  priceContainer: {
    gap: 2,
    flexShrink: 0,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
  },
  priceValue: {
    fontSize: 20,                 // was 24 — leaves more horizontal room for the button
    fontWeight: '900',
    color: Colors.text,
  },
  bookBtn: {
    flex: 1,
    borderRadius: 18,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginVertical: 16,
  },
});
