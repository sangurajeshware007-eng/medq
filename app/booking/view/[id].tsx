/**
 * Booking detail viewer.
 * Opened when a user taps a card in the Bookings tab — shows the entire booking
 * (doctor, hospital, date/time, ref, fee, status, payment, notes) in a richer
 * layout than the list card. The token tracker has its own dedicated screen.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Calendar,
  Clock,
  Hospital,
  Stethoscope,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  CreditCard,
  Share2,
  Radio,
  CalendarClock,
  XCircle,
  Ticket,
  Star,
  Pencil,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../../components/Button';
import RatingForm from '../../../components/RatingForm';
import { Colors } from '../../../constants/Colors';
import { useLanguage } from '../../../context/LanguageContext';
import {
  useBookingDetail,
  useCancelBooking,
  useMyReviewForBooking,
} from '../../../hooks/useApiHooks';
import { getApiErrorMessage } from '../../../utils/apiError';
import { crossPlatformShadow } from '../../../utils/shadow';

function formatBookingDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function ensureDoctorPrefix(name: string): string {
  if (!name) return '';
  return /^dr\.?\s/i.test(name.trim()) ? name.trim() : `Dr. ${name.trim()}`;
}

function statusToTone(status: string) {
  const s = status.toUpperCase();
  if (s === 'CONFIRMED') return { bg: '#E8F8EE', fg: Colors.trustGreen, label: 'Confirmed' };
  if (s === 'COMPLETED') return { bg: '#E0E7FF', fg: '#4338CA', label: 'Completed' };
  if (s === 'CANCELLED') return { bg: Colors.errorLight, fg: Colors.error, label: 'Cancelled' };
  if (s === 'PENDING') return { bg: '#FFF8E7', fg: Colors.gold, label: 'Pending' };
  if (s === 'NO_SHOW') return { bg: '#FEF2F2', fg: Colors.error, label: 'No-show' };
  return { bg: Colors.borderLight, fg: Colors.textSecondary, label: status };
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const { data, isLoading, error, refetch } = useBookingDetail(id);
  const cancelMutation = useCancelBooking();
  // Only query the review endpoint once we know the booking is COMPLETED — avoids a 404 on incomplete bookings.
  const reviewQuery = useMyReviewForBooking(data?.status === 'COMPLETED' ? id : null);
  const review = reviewQuery.data;
  const [ratingOpen, setRatingOpen] = useState(false);

  // 7-day edit window starts from the audit completedAt; the FE computes the cutoff locally
  // to avoid an "Edit" CTA that the backend would just reject.
  const completedAt = data?.completedAt ? new Date(data.completedAt).getTime() : null;
  const canEditReview = completedAt ? Date.now() - completedAt < 7 * 24 * 60 * 60 * 1000 : false;

  const tone = data ? statusToTone(data.status) : statusToTone('PENDING');

  async function shareBooking() {
    if (!data) return;
    const date = formatBookingDate(data.bookingDate);
    const message =
      `MedQ+ Booking\n` +
      `Ref: ${data.bookingRef}\n` +
      `${ensureDoctorPrefix(data.doctorName)} · ${data.specialization}\n` +
      `${data.hospitalName}\n` +
      `${date} · ${data.slotStart}–${data.slotEnd}\n` +
      `Token #${data.tokenNumber} · ₹${data.amount.toFixed(0)}`;
    try {
      await Share.share({ message });
    } catch {
      /* user cancelled */
    }
  }

  function handleCancel() {
    if (!data) return;
    Alert.alert(
      'Cancel booking?',
      `This will release your token and free the slot. This cannot be undone.`,
      [
        { text: 'Keep booking', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: () => {
            cancelMutation.mutate(data.id, {
              onSuccess: () => {
                refetch();
              },
              onError: (e) =>
                Alert.alert('Could not cancel', getApiErrorMessage(e, 'Please try again.')),
            });
          },
        },
      ],
    );
  }

  // ─── Loading / error / empty ───────────────────────────────────────────
  if (isLoading || (!data && !error)) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header title="Booking" onBack={() => router.back()} />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header title="Booking" onBack={() => router.back()} />
        <View style={styles.centerState}>
          <AlertCircle size={48} color={Colors.error} strokeWidth={1.5} />
          <Text style={styles.errorText}>
            {getApiErrorMessage(error, 'Could not load this booking.')}
          </Text>
          <Button
            title="Try again"
            onPress={() => refetch()}
            variant="outline"
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header
        title="Booking Details"
        onBack={() => router.back()}
        right={
          <TouchableOpacity onPress={shareBooking} style={styles.iconBtn} activeOpacity={0.7}>
            <Share2 size={18} color={Colors.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Hero — status + booking ref ───────────────────────────── */}
        <View style={[styles.hero, { backgroundColor: tone.bg }]}>
          <View style={styles.heroTop}>
            <View style={[styles.statusPill, { backgroundColor: tone.fg }]}>
              <CheckCircle2 size={11} color="#fff" strokeWidth={3} />
              <Text style={styles.statusPillText}>{tone.label.toUpperCase()}</Text>
            </View>
            <Text style={[styles.heroSub, { color: tone.fg }]}>MedQ+ Booking</Text>
          </View>
          <Text style={styles.refLabel}>Booking Reference</Text>
          <Text style={styles.refValue} selectable>
            {data.bookingRef}
          </Text>
          <Text style={[styles.refHint, { color: tone.fg }]}>
            Long-press to copy · tap share above to send
          </Text>
        </View>

        {/* ── Doctor card ──────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardAccent} />
          <View style={styles.doctorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{data.doctorName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName} numberOfLines={1}>
                {ensureDoctorPrefix(data.doctorName)}
              </Text>
              <View style={styles.specRow}>
                <Stethoscope size={11} color={Colors.primary} strokeWidth={2.5} />
                <Text style={styles.specText} numberOfLines={1}>
                  {data.specialization?.replace(/_/g, ' ')}
                </Text>
              </View>
              <View style={styles.hospitalRow}>
                <Hospital size={11} color={Colors.textSecondary} strokeWidth={2} />
                <Text style={styles.hospitalText} numberOfLines={1}>
                  {data.hospitalName}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── When card ────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>When</Text>
          <Row Icon={Calendar} value={formatBookingDate(data.bookingDate)} primary />
          <Row Icon={Clock} value={`${data.slotStart} – ${data.slotEnd}`} />
          <Row Icon={Ticket} value={`Token #${data.tokenNumber}`} secondary />
        </View>

        {/* ── Payment card ─────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Payment</Text>
          <View style={styles.paymentRow}>
            <View style={styles.paymentLeft}>
              <Text style={styles.paymentLabel}>Consultation Fee</Text>
              <View style={styles.feeAmountRow}>
                <IndianRupee size={20} color={Colors.text} strokeWidth={2.5} />
                <Text style={styles.feeAmount}>{data.amount.toFixed(0)}</Text>
              </View>
            </View>
            <View style={styles.paymentRight}>
              <View style={styles.paymentBadge}>
                <CreditCard size={11} color={Colors.primary} strokeWidth={2.5} />
                <Text style={styles.paymentBadgeText}>{data.paymentMethod}</Text>
              </View>
              <View
                style={[
                  styles.paymentStatusBadge,
                  data.paymentStatus === 'PAID'
                    ? { backgroundColor: Colors.trustGreenLight }
                    : { backgroundColor: '#FFF8E7' },
                ]}
              >
                <Text
                  style={[
                    styles.paymentStatusText,
                    { color: data.paymentStatus === 'PAID' ? Colors.trustGreen : Colors.gold },
                  ]}
                >
                  {data.paymentStatus}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Notes (only if present) ───────────────────────────────── */}
        {data.notes && data.notes.trim().length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardLabelRow}>
              <FileText size={13} color={Colors.textSecondary} strokeWidth={2.5} />
              <Text style={styles.cardLabel}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* ── Trust footer — verifies why MedQ+ is reliable ───────── */}
        <View style={styles.trustCard}>
          <ShieldCheck size={16} color={Colors.trustGreen} strokeWidth={2.5} />
          <Text style={styles.trustText}>
            This booking is confirmed at the hospital. Show this reference at the front desk.
          </Text>
        </View>

        {/* ── Rate-your-visit card — only on COMPLETED bookings ───── */}
        {data.status === 'COMPLETED' && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t('reviewsAndRatings') || 'Your rating'}</Text>
            {review ? (
              <View style={styles.ratedDetail}>
                <View style={styles.ratedDetailStars}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={20}
                      color={n <= review.rating ? Colors.gold : Colors.textSecondary}
                      fill={n <= review.rating ? Colors.gold : 'transparent'}
                      strokeWidth={2}
                    />
                  ))}
                </View>
                {review.comment ? (
                  <Text style={styles.ratedDetailComment}>{review.comment}</Text>
                ) : null}
                {canEditReview && (
                  <TouchableOpacity
                    onPress={() => setRatingOpen(true)}
                    style={styles.ratedDetailEdit}
                    accessibilityLabel={t('editRating') || 'Edit rating'}
                  >
                    <Pencil size={13} color={Colors.primary} strokeWidth={2.5} />
                    <Text style={styles.ratedDetailEditText}>
                      {t('editRating') || 'Edit rating'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <>
                <Text style={styles.notesText}>
                  {t('howWasYourExperience') || 'How was your experience?'}
                </Text>
                <Button
                  title={t('rateYourVisit') || 'Rate your visit'}
                  variant="primary"
                  size="medium"
                  icon={<Star size={15} color={Colors.white} strokeWidth={2.5} />}
                  onPress={() => setRatingOpen(true)}
                  style={{ marginTop: 12 }}
                />
              </>
            )}
          </View>
        )}

        {/* ── Action row (only if API permits) ─────────────────────── */}
        {(data.canCancel || data.canReschedule) && (
          <View style={styles.actionRow}>
            {data.canReschedule && (
              <Button
                title="Reschedule"
                variant="outline"
                size="medium"
                icon={<CalendarClock size={15} color={Colors.primary} strokeWidth={2} />}
                onPress={() =>
                  router.push({
                    pathname: '/booking/reschedule/[id]',
                    params: { id: data.id },
                  })
                }
                style={{ flex: 1 }}
              />
            )}
            {data.canCancel && (
              <Button
                title="Cancel"
                variant="danger"
                size="medium"
                icon={<XCircle size={15} color={Colors.white} strokeWidth={2} />}
                onPress={handleCancel}
                loading={cancelMutation.isPending}
                style={{ flex: 1 }}
              />
            )}
          </View>
        )}

        {/* Track live token — moved here as a secondary action */}
        {data.status?.toUpperCase() === 'CONFIRMED' && (
          <TouchableOpacity
            style={styles.trackLink}
            onPress={() =>
              router.push({
                pathname: '/token/[id]',
                params: { id: data.doctorId },
              })
            }
            activeOpacity={0.75}
          >
            <Radio size={14} color={Colors.primary} strokeWidth={2.5} />
            <Text style={styles.trackLinkText}>View live token queue</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
      {ratingOpen && data && (
        <RatingForm
          visible
          bookingId={data.id}
          doctorName={ensureDoctorPrefix(data.doctorName)}
          reviewId={review?.id ?? null}
          initialRating={review?.rating ?? 0}
          initialComment={review?.comment ?? ''}
          onClose={() => setRatingOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ── Header ──────────────────────────────────────────────────────────────
function Header({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.iconBtn} activeOpacity={0.7}>
        <ChevronLeft size={22} color={Colors.text} strokeWidth={2.5} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerRight}>{right ?? <View style={{ width: 34 }} />}</View>
    </View>
  );
}

// ── Row helper ──────────────────────────────────────────────────────────
function Row({
  Icon,
  value,
  primary,
  secondary,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  value: string;
  primary?: boolean;
  secondary?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon size={14} color={Colors.primary} strokeWidth={2.5} />
      </View>
      <Text
        style={[
          styles.rowValue,
          primary && styles.rowValuePrimary,
          secondary && styles.rowValueSecondary,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, letterSpacing: 0.2 },
  headerRight: { width: 34, alignItems: 'flex-end' },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  errorText: { fontSize: 14, color: Colors.text, textAlign: 'center', lineHeight: 20 },
  content: { padding: 16, gap: 14 },

  // Hero
  hero: {
    borderRadius: 22,
    padding: 18,
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusPillText: { fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 0.6 },
  heroSub: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, opacity: 0.7 },
  refLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.text,
    opacity: 0.6,
    letterSpacing: 0.6,
  },
  refValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
    marginTop: 6,
  },
  refHint: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    opacity: 0.7,
  },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingVertical: 14,
    paddingLeft: 18,
    paddingRight: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    position: 'relative',
    ...crossPlatformShadow({
      color: Colors.shadow,
      opacity: 0.05,
      offsetY: 2,
      radius: 8,
      elevation: 2,
    }),
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.primary,
  },
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 8,
    textTransform: 'uppercase',
  },

  // Doctor row
  doctorRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarText: { fontSize: 22, fontWeight: '900', color: Colors.primary },
  doctorInfo: { flex: 1, flexShrink: 1, minWidth: 0, gap: 3 },
  doctorName: { fontSize: 18, fontWeight: '900', color: Colors.text },
  specRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  specText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  hospitalRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hospitalText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', flex: 1 },

  // Row helper
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 5 },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowValue: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  rowValuePrimary: { fontSize: 15, fontWeight: '800' },
  rowValueSecondary: { color: Colors.textSecondary },

  // Payment
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  paymentLeft: { flex: 1 },
  paymentLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },
  feeAmountRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  feeAmount: { fontSize: 26, fontWeight: '900', color: Colors.text, fontVariant: ['tabular-nums'] },
  paymentRight: { alignItems: 'flex-end', gap: 6 },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
  },
  paymentBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.primary, letterSpacing: 0.3 },
  paymentStatusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  paymentStatusText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },

  // Notes
  notesText: { fontSize: 13, color: Colors.text, lineHeight: 19, marginTop: 4 },

  // Trust footer
  trustCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.trustGreenLight,
    borderWidth: 1,
    borderColor: Colors.trustGreen + '30',
  },
  trustText: { flex: 1, fontSize: 12, color: Colors.text, lineHeight: 18, fontWeight: '600' },

  // Actions
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  trackLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
  },
  trackLinkText: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  ratedDetail: { marginTop: 8 },
  ratedDetailStars: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  ratedDetailComment: { fontSize: 13, color: Colors.text, lineHeight: 19, marginBottom: 8 },
  ratedDetailEdit: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  ratedDetailEditText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
});
