import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Bed,
  Calendar,
  ChevronLeft,
  Clock,
  Globe,
  Hospital,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  ShieldAlert,
  Stethoscope,
  Tag,
  UserRound,
  X,
} from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LocalizedName from '../../components/LocalizedName';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../context/LanguageContext';
import { useHospital } from '../../hooks/useApiHooks';
import { crossPlatformShadow } from '../../utils/shadow';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GALLERY_HEIGHT = 240;

const DEPT_PALETTE = [
  { bg: '#DBEAFE', fg: '#1E40AF' },
  { bg: '#DCF2E8', fg: '#065F46' },
  { bg: '#EDE9FE', fg: '#5B21B6' },
  { bg: '#FFE4E6', fg: '#9F1239' },
  { bg: '#FEF3C7', fg: '#92400E' },
  { bg: '#E0F2FE', fg: '#0369A1' },
  { bg: '#ECFCCB', fg: '#365314' },
  { bg: '#FEF9C3', fg: '#713F12' },
];

function deptColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return DEPT_PALETTE[h % DEPT_PALETTE.length];
}

function sanitizePhone(raw: string) {
  return raw.replace(/[^\d+]/g, '');
}

export default function HospitalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const router = useRouter();

  const { data: hospital, isLoading, error } = useHospital(id || '');
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const galleryRef = useRef<ScrollView>(null);
  const lightboxRef = useRef<ScrollView>(null);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.errorTitle}>Loading hospital…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !hospital) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <Hospital size={56} color={Colors.textLight} strokeWidth={1.5} />
          <Text style={styles.errorTitle}>Hospital not found</Text>
          <TouchableOpacity style={styles.backCta} onPress={() => router.back()}>
            <Text style={styles.backCtaText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const gallery =
    hospital.imageUrls.length > 0 ? hospital.imageUrls : hospital.image ? [hospital.image] : [];
  const specializations = Array.from(
    new Set(hospital.doctors?.map((d) => d.specialization).filter(Boolean) ?? []),
  );

  const onScrollGallery = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (idx !== galleryIdx) setGalleryIdx(idx);
  };

  const onScrollLightbox = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (idx !== lightboxIdx) setLightboxIdx(idx);
  };

  const openLightbox = (idx: number) => {
    setLightboxIdx(idx);
    setLightboxOpen(true);
    // Scroll to the tapped image once the modal mounts
    requestAnimationFrame(() => {
      lightboxRef.current?.scrollTo({ x: idx * SCREEN_WIDTH, animated: false });
    });
  };

  const callNumber = (raw: string) => {
    const num = sanitizePhone(raw);
    if (num) Linking.openURL(`tel:${num}`).catch(() => {});
  };

  const openWhatsApp = (raw: string) => {
    const num = sanitizePhone(raw).replace(/^\+/, '');
    if (num) Linking.openURL(`https://wa.me/${num}`).catch(() => {});
  };

  const openMaps = () => {
    const { locationLat: lat, locationLng: lng } = hospital;
    const label = encodeURIComponent(hospital.name);
    const url =
      lat && lng
        ? Platform.select({
            ios: `http://maps.apple.com/?q=${label}&ll=${lat},${lng}`,
            default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
          })
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.address)}`;
    if (url) Linking.openURL(url).catch(() => {});
  };

  const openWebsite = (url: string) => {
    const safe = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(safe).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Sticky header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
          <ChevronLeft size={20} color={Colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <LocalizedName name={hospital.name} style={styles.headerTitle} numberOfLines={1} />
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Image gallery ─────────────────────────────────────────────── */}
        <View style={styles.galleryWrap}>
          {gallery.length > 0 ? (
            <ScrollView
              ref={galleryRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScrollGallery}
              scrollEventThrottle={16}
            >
              {gallery.map((src, i) => (
                <TouchableOpacity
                  key={`${src}-${i}`}
                  activeOpacity={0.95}
                  onPress={() => openLightbox(i)}
                >
                  <Image
                    source={src}
                    style={styles.galleryImage}
                    contentFit="cover"
                    transition={300}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.galleryImage, styles.galleryFallback]}>
              <Hospital size={56} color={Colors.primary} strokeWidth={1.5} />
            </View>
          )}

          <View style={styles.galleryOverlay} pointerEvents="none" />

          {gallery.length > 1 && (
            <View style={styles.counterChip} pointerEvents="none">
              <Text style={styles.counterTxt}>
                {galleryIdx + 1} / {gallery.length}
              </Text>
            </View>
          )}

          {hospital.isOpen24x7 && (
            <View style={styles.open24Badge}>
              <Clock size={11} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.open24Txt}>OPEN 24×7</Text>
            </View>
          )}

          <View style={styles.galleryCaption}>
            <LocalizedName name={hospital.name} style={styles.galleryName} numberOfLines={2} />
            <View style={styles.galleryAddrRow}>
              <MapPin size={13} color="rgba(255,255,255,0.92)" strokeWidth={2.5} />
              <Text style={styles.galleryAddr} numberOfLines={2}>
                {hospital.address}
              </Text>
            </View>
          </View>

          {gallery.length > 1 && (
            <View style={styles.dotsRow}>
              {gallery.map((_, i) => (
                <View key={i} style={[styles.dot, galleryIdx === i && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* ── Action row ─────────────────────────────────────────────────── */}
        <View style={styles.actionRow}>
          {hospital.phone ? (
            <TouchableOpacity style={styles.actionBtn} onPress={() => callNumber(hospital.phone!)}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.trustGreen + '1A' }]}>
                <Phone size={18} color={Colors.trustGreen} strokeWidth={2.2} />
              </View>
              <Text style={styles.actionLabel}>Call</Text>
            </TouchableOpacity>
          ) : null}
          {hospital.phone ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => openWhatsApp(hospital.phone!)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#25D36622' }]}>
                <MessageCircle size={18} color="#128C7E" strokeWidth={2.2} />
              </View>
              <Text style={styles.actionLabel}>WhatsApp</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.actionBtn} onPress={openMaps}>
            <View style={[styles.actionIcon, { backgroundColor: Colors.primary + '1A' }]}>
              <Navigation size={18} color={Colors.primary} strokeWidth={2.2} />
            </View>
            <Text style={styles.actionLabel}>Directions</Text>
          </TouchableOpacity>
          {hospital.websiteUrl ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => openWebsite(hospital.websiteUrl!)}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.gold + '22' }]}>
                <Globe size={18} color={Colors.gold} strokeWidth={2.2} />
              </View>
              <Text style={styles.actionLabel}>Website</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── Info stats grid ────────────────────────────────────────────── */}
        <View style={styles.statsCard}>
          <StatTile
            icon={<UserRound size={20} color={Colors.primary} strokeWidth={2} />}
            value={String(hospital.doctors?.length ?? 0)}
            label="Doctors"
          />
          <View style={styles.statDivider} />
          <StatTile
            icon={<Bed size={20} color={Colors.tokenPurple} strokeWidth={2} />}
            value={typeof hospital.totalBeds === 'number' ? String(hospital.totalBeds) : '—'}
            label="Beds"
          />
          <View style={styles.statDivider} />
          <StatTile
            icon={
              <Clock
                size={20}
                color={hospital.isOpen24x7 ? Colors.trustGreen : Colors.textSecondary}
                strokeWidth={2}
              />
            }
            value={hospital.isOpen24x7 ? '24×7' : 'Hours'}
            label={hospital.isOpen24x7 ? 'Always open' : 'Schedule'}
          />
          <View style={styles.statDivider} />
          <StatTile
            icon={<Calendar size={20} color={Colors.gold} strokeWidth={2} />}
            value={
              typeof hospital.establishedYear === 'number' ? String(hospital.establishedYear) : '—'
            }
            label="Founded"
          />
        </View>

        {/* ── Contact card ───────────────────────────────────────────────── */}
        {(hospital.phone || hospital.emergencyContact) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.contactCard}>
              {hospital.phone ? (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => callNumber(hospital.phone!)}
                >
                  <View style={[styles.contactIcon, { backgroundColor: Colors.trustGreen + '1A' }]}>
                    <Phone size={16} color={Colors.trustGreen} strokeWidth={2.2} />
                  </View>
                  <View style={styles.contactBody}>
                    <Text style={styles.contactLabel}>Phone</Text>
                    <Text style={styles.contactValue}>{hospital.phone}</Text>
                  </View>
                  <Text style={styles.contactCta}>Tap to call</Text>
                </TouchableOpacity>
              ) : null}
              {hospital.emergencyContact ? (
                <>
                  <View style={styles.contactSep} />
                  <TouchableOpacity
                    style={styles.contactRow}
                    onPress={() => callNumber(hospital.emergencyContact!)}
                  >
                    <View style={[styles.contactIcon, { backgroundColor: '#EF444422' }]}>
                      <ShieldAlert size={16} color="#EF4444" strokeWidth={2.2} />
                    </View>
                    <View style={styles.contactBody}>
                      <Text style={styles.contactLabel}>Emergency</Text>
                      <Text style={styles.contactValue}>{hospital.emergencyContact}</Text>
                    </View>
                    <Text style={styles.contactCta}>Tap to call</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>
        )}

        {/* ── Address + map preview ──────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <TouchableOpacity style={styles.addressCard} onPress={openMaps} activeOpacity={0.85}>
            <View style={styles.mapPreview}>
              <View style={styles.mapPreviewBg}>
                <View style={styles.mapGridA} />
                <View style={styles.mapGridB} />
                <View style={styles.mapGridC} />
              </View>
              <View style={styles.mapPin}>
                <MapPin size={26} color={Colors.accent} strokeWidth={2.5} fill={Colors.accent} />
              </View>
            </View>
            <View style={styles.addressBody}>
              <Text style={styles.addressTxt} numberOfLines={3}>
                {hospital.address}
              </Text>
              <View style={styles.directionsRow}>
                <Navigation size={13} color={Colors.primary} strokeWidth={2.5} />
                <Text style={styles.directionsTxt}>Open in Maps</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Departments grid ───────────────────────────────────────────── */}
        {hospital.departments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Stethoscope size={16} color={Colors.text} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Departments</Text>
            </View>
            <View style={styles.deptGrid}>
              {hospital.departments.map((d) => {
                const c = deptColor(d);
                return (
                  <View key={d} style={[styles.deptCard, { backgroundColor: c.bg }]}>
                    <Text style={[styles.deptCardTxt, { color: c.fg }]}>{d}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Specialities (from doctors) ────────────────────────────────── */}
        {specializations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Tag size={16} color={Colors.text} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Specialities</Text>
            </View>
            <View style={styles.specTags}>
              {specializations.map((spec) => (
                <View key={spec} style={styles.specTag}>
                  <Text style={styles.specTagTxt}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Doctors ────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <UserRound size={18} color={Colors.text} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Doctors at {hospital.name}</Text>
          </View>
          {hospital.doctors && hospital.doctors.length > 0 ? (
            hospital.doctors.map((doctor) => (
              <TouchableOpacity
                key={doctor.id}
                style={styles.doctorCard}
                onPress={() =>
                  router.push({ pathname: '/doctor/[id]', params: { id: String(doctor.id) } })
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
                  <LocalizedName name={doctor.name} style={styles.doctorName} numberOfLines={1} />
                  <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
                  <View style={styles.doctorMetaRow}>
                    {typeof doctor.rating === 'number' && (
                      <Text style={styles.doctorRating}>★ {doctor.rating}</Text>
                    )}
                    {typeof doctor.consultationFee === 'number' &&
                      doctor.consultationFee > 0 && (
                        <Text style={styles.doctorFee}>
                          ₹{doctor.consultationFee} consultation
                        </Text>
                      )}
                  </View>
                </View>
                <View style={styles.doctorAction}>
                  <Text style={styles.bookBtnText}>{t('bookNow')}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyDoctors}>
              <Stethoscope size={40} color={Colors.textLight} strokeWidth={1.5} />
              <Text style={styles.emptyText}>No doctors listed yet for this hospital.</Text>
              <Text style={styles.emptySubtext}>
                Check back soon — we're adding more doctors every day!
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ── Fullscreen image lightbox ─────────────────────────────────── */}
      <Modal
        visible={lightboxOpen}
        animationType="fade"
        transparent={false}
        statusBarTranslucent
        onRequestClose={() => setLightboxOpen(false)}
      >
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.lightbox}>
          <ScrollView
            ref={lightboxRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScrollLightbox}
            scrollEventThrottle={16}
          >
            {gallery.map((src, i) => (
              <View key={`lb-${src}-${i}`} style={styles.lightboxPage}>
                <Image
                  source={src}
                  style={styles.lightboxImage}
                  contentFit="contain"
                  transition={200}
                />
              </View>
            ))}
          </ScrollView>

          <SafeAreaView style={styles.lightboxHeader} pointerEvents="box-none">
            <View style={styles.lightboxHeaderRow}>
              <View style={styles.lightboxCounter}>
                <Text style={styles.lightboxCounterTxt}>
                  {lightboxIdx + 1} / {gallery.length}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.lightboxClose}
                onPress={() => setLightboxOpen(false)}
                hitSlop={10}
              >
                <X size={22} color={Colors.white} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Stat tile ───────────────────────────────────────────────────────────────

function StatTile({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={styles.statTile}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerSpacer: { width: 36 },

  scrollContent: { paddingBottom: 24 },

  // Gallery
  galleryWrap: {
    height: GALLERY_HEIGHT,
    position: 'relative',
    backgroundColor: Colors.borderLight,
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: GALLERY_HEIGHT,
    backgroundColor: Colors.borderLight,
  },
  galleryFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  galleryOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  open24Badge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.trustGreen,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 2,
      opacity: 0.2,
      radius: 4,
      elevation: 3,
    }),
  },
  open24Txt: { fontSize: 10, color: Colors.white, fontWeight: '900', letterSpacing: 0.5 },
  galleryCaption: { position: 'absolute', left: 16, right: 16, bottom: 26 },
  galleryName: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.white,
    marginBottom: 4,
    ...Platform.select({ web: { textShadow: '0 2px 8px rgba(0,0,0,0.5)' } }),
  },
  galleryAddrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  galleryAddr: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '500',
    lineHeight: 18,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { width: 18, backgroundColor: Colors.white },
  counterChip: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterTxt: { fontSize: 11, color: Colors.white, fontWeight: '800', letterSpacing: 0.3 },

  // Lightbox
  lightbox: { flex: 1, backgroundColor: '#000' },
  lightboxPage: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: { width: SCREEN_WIDTH, height: '100%' },
  lightboxHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  lightboxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  lightboxCounter: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  lightboxCounterTxt: { fontSize: 13, color: Colors.white, fontWeight: '800', letterSpacing: 0.3 },
  lightboxClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Action row
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: -28,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 4,
      opacity: 0.12,
      radius: 16,
      elevation: 6,
    }),
  },
  actionBtn: { alignItems: 'center', gap: 6, flex: 1 },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 11, fontWeight: '700', color: Colors.text },

  // Stats card
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
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
  statTile: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 16, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.borderLight },

  // Section
  section: { paddingHorizontal: 16, marginTop: 22 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 10 },

  // Contact
  contactCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
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
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBody: { flex: 1 },
  contactLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', marginBottom: 2 },
  contactValue: { fontSize: 14, color: Colors.text, fontWeight: '700' },
  contactCta: { fontSize: 11, color: Colors.primary, fontWeight: '700' },
  contactSep: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 14 },

  // Address card
  addressCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
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
  mapPreview: {
    width: 110,
    height: 110,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  mapPreviewBg: { ...StyleSheet.absoluteFillObject },
  mapGridA: {
    position: 'absolute',
    top: 20,
    left: -10,
    right: -10,
    height: 1,
    backgroundColor: Colors.primary + '30',
    transform: [{ rotate: '-12deg' }],
  },
  mapGridB: {
    position: 'absolute',
    top: 60,
    left: -10,
    right: -10,
    height: 1,
    backgroundColor: Colors.primary + '30',
    transform: [{ rotate: '8deg' }],
  },
  mapGridC: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 30,
    width: 1,
    backgroundColor: Colors.primary + '30',
    transform: [{ rotate: '-3deg' }],
  },
  mapPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 2,
      opacity: 0.15,
      radius: 6,
      elevation: 4,
    }),
  },
  addressBody: { flex: 1, padding: 14, justifyContent: 'space-between' },
  addressTxt: { fontSize: 13, color: Colors.text, fontWeight: '500', lineHeight: 18 },
  directionsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  directionsTxt: { fontSize: 12, color: Colors.primary, fontWeight: '700' },

  // Departments grid
  deptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  deptCard: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  deptCardTxt: { fontSize: 13, fontWeight: '700' },

  // Specialities (legacy tags)
  specTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  specTagTxt: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // Doctor card
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
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  doctorSpec: { fontSize: 12, color: Colors.primary, fontWeight: '700', marginBottom: 4 },
  doctorMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  doctorRating: { fontSize: 12, color: Colors.gold, fontWeight: '700' },
  doctorFee: { fontSize: 12, color: Colors.text, fontWeight: '700' },
  doctorAction: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  bookBtnText: { color: Colors.white, fontSize: 12, fontWeight: '700' },

  // Empty / error
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
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 32,
  },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 20 },
  backCta: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backCtaText: { color: Colors.white, fontSize: 15, fontWeight: '700' },

  bottomSpacer: { height: 40 },
});
