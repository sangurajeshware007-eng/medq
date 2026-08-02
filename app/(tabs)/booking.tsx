import { Redirect, useRouter } from 'expo-router';
import {
  ClipboardList,
  Hospital,
  XCircle,
  CalendarClock,
  IndianRupee,
  Calendar,
  Clock,
  CheckCircle2,
  History,
  CalendarCheck,
  AlertCircle,
  UserX,
  Star,
  Pencil,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../components/Button';
import Card from '../../components/Card';
import EcgLoader from '../../components/EcgLoader';
import LogoHeader from '../../components/LogoHeader';
import RatingForm from '../../components/RatingForm';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  useUpcomingBookings,
  usePastBookings,
  useCancelBooking,
  useMyReviewForBooking,
} from '../../hooks/useApiHooks';
import { crossPlatformShadow } from '../../utils/shadow';

import { contentColumn } from '@/theme';

/** Render "2026-05-08" → "Fri, 8 May" — easier to scan on a card */
function formatBookingDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Ensure the doctor name is prefixed with "Dr." once (idempotent) */
function ensureDoctorPrefix(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  return /^dr\.?\s/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`;
}

/** Browsing is anonymous; bookings are personal — gate before any inner hooks run. */
export default function BookingScreen() {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }
  return <BookingScreenInner />;
}

function BookingScreenInner() {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [upcomingPage, setUpcomingPage] = useState(0);
  const [pastPage, setPastPage] = useState(0);
  // Holds the booking being rated/edited so the modal can show its context (doctor name etc.).
  const [ratingTarget, setRatingTarget] = useState<{
    bookingId: string;
    doctorName: string;
    reviewId?: string | null;
  } | null>(null);

  // ─── Fetch upcoming bookings ─────────────────────────────────────────
  const {
    data: upcomingBookings,
    isLoading: upcomingLoading,
    error: upcomingError,
  } = useUpcomingBookings();

  // ─── Fetch past bookings ────────────────────────────────────────────
  const { data: pastBookings, isLoading: pastLoading, error: pastError } = usePastBookings();

  const cancelBooking = useCancelBooking();

  // ─── Derived state ──────────────────────────────────────────────────
  const isUpcoming = activeTab === 'upcoming';
  const bookings = isUpcoming ? (upcomingBookings ?? []) : (pastBookings ?? []);
  const isLoading = isUpcoming ? upcomingLoading : pastLoading;
  const error = isUpcoming ? upcomingError : pastError;

  // ─── Error handling ─────────────────────────────────────────────────
  const handleError = useCallback(
    (err: unknown) => {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        logout();
        router.replace('/(auth)/login' as never);
        return;
      }
      // 404 or 500 are shown inline via the UI
    },
    [logout, router],
  );

  // Trigger error handler when error changes
  React.useEffect(() => {
    if (error) handleError(error);
  }, [error, handleError]);

  const getErrorMessage = (err: unknown): string => {
    const status = (err as { status?: number })?.status;
    if (status === 404) return t('noBookings') || 'No bookings found';
    return 'Something went wrong. Please try again later.';
  };

  // ─── Status helpers ─────────────────────────────────────────────────
  // Past-date CONFIRMED bookings haven't been transitioned by the backend yet,
  // so we present them as "Pending" — a confirmed appointment whose outcome
  // (consulted / no-show) is awaiting status update — rather than mis-labeling
  // them as still-Confirmed.
  const todayIso = new Date().toISOString().slice(0, 10);
  const resolveDisplayStatus = (status: string, bookingDate: string): string => {
    if (status === 'CONFIRMED' && bookingDate < todayIso) return 'PENDING';
    return status;
  };

  const statusStyle = (status: string): { color: string; label: string; Icon: LucideIcon } => {
    switch (status) {
      case 'CONFIRMED':
        return {
          color: Colors.trustGreen,
          label: t('confirmed') || 'Confirmed',
          Icon: CheckCircle2,
        };
      case 'COMPLETED':
        return { color: Colors.primary, label: t('consulted') || 'Consulted', Icon: CheckCircle2 };
      case 'CANCELLED':
        return { color: Colors.error, label: t('cancelled') || 'Cancelled', Icon: XCircle };
      case 'PENDING':
        return { color: Colors.gold, label: t('pending') || 'Pending', Icon: AlertCircle };
      case 'NO_SHOW':
        return {
          color: Colors.error,
          label: t('patientDidNotVisit') || 'Patient did not visit',
          Icon: UserX,
        };
      default:
        return { color: Colors.textSecondary, label: status, Icon: AlertCircle };
    }
  };

  // ─── Cancel handler ─────────────────────────────────────────────────
  const handleCancel = (bookingId: string) => {
    Alert.alert(
      t('cancelBooking') || 'Cancel Booking',
      t('cancelBookingConfirm') || 'Are you sure you want to cancel this booking?',
      [
        { text: t('no') || 'No', style: 'cancel' },
        {
          text: t('yes') || 'Yes',
          style: 'destructive',
          onPress: () => cancelBooking.mutate(bookingId),
        },
      ],
    );
  };

  // Pagination handles removed since API is a flat array DTO

  // ─── Tab switch resets page ─────────────────────────────────────────
  const switchTab = (tab: 'upcoming' | 'past') => {
    setActiveTab(tab);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* App-wide logo header */}
      <LogoHeader />

      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ClipboardList size={20} color={Colors.text} strokeWidth={2.5} />
          <Text style={styles.headerTitle}>{t('bookings')}</Text>
        </View>
      </View>

      {/* Tabs — icon + short label, centered, soft shadow on the active pill */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => switchTab('upcoming')}
          activeOpacity={0.85}
        >
          <CalendarCheck
            size={16}
            color={activeTab === 'upcoming' ? Colors.primary : Colors.textSecondary}
            strokeWidth={2.5}
          />
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => switchTab('past')}
          activeOpacity={0.85}
        >
          <History
            size={16}
            color={activeTab === 'past' ? Colors.primary : Colors.textSecondary}
            strokeWidth={2.5}
          />
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>Past</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {/* Loading state */}
        {isLoading ? (
          <View style={styles.emptyState}>
            <EcgLoader width={140} height={36} />
          </View>
        ) : error ? (
          /* Error state */
          <View style={styles.emptyState}>
            <XCircle size={48} color={Colors.error} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>{getErrorMessage(error)}</Text>
          </View>
        ) : bookings.length === 0 ? (
          /* Empty state */
          <View style={styles.emptyState}>
            <ClipboardList size={48} color={Colors.textLight} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>{t('noBookings')}</Text>
            <Text style={styles.emptyDesc}>{t('noBookingsDesc')}</Text>
            <Button
              title={t('findDoctor')}
              onPress={() => router.push('/(tabs)')}
              style={styles.findDoctorBtn}
            />
          </View>
        ) : (
          <>
            {bookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: '/booking/view/[id]',
                    params: { id: booking.id },
                  })
                }
              >
                <Card style={styles.bookingCard}>
                  {/* Brand accent stripe on the left edge */}
                  <View style={styles.cardAccent} />

                  {/* Top — date + time stacked left, status pill right.
                      Stacking keeps everything legible on iPhone 12 / SE without overlap. */}
                  <View style={styles.bookingHeader}>
                    <View style={styles.headerLeft}>
                      <View style={styles.dateLine}>
                        <Calendar size={12} color={Colors.primary} strokeWidth={2.5} />
                        <Text style={styles.dateText} numberOfLines={1}>
                          {formatBookingDate(booking.bookingDate)}
                        </Text>
                      </View>
                      <View style={styles.timeLine}>
                        <Clock size={11} color={Colors.textSecondary} strokeWidth={2.5} />
                        <Text style={styles.timeText} numberOfLines={1}>
                          {booking.slotStart} – {booking.slotEnd}
                        </Text>
                      </View>
                    </View>
                    {(() => {
                      const display = resolveDisplayStatus(booking.status, booking.bookingDate);
                      const { color, label, Icon } = statusStyle(display);
                      return (
                        <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
                          <Icon size={11} color={color} strokeWidth={2.5} />
                          <Text style={[styles.statusText, { color }]} numberOfLines={1}>
                            {label}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>

                  {/* Doctor block */}
                  <View style={styles.bookingBody}>
                    <View style={styles.doctorAvatarPlaceholder}>
                      <Text style={styles.doctorAvatarText}>
                        {booking.doctorName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.doctorInfo}>
                      <Text style={styles.doctorName} numberOfLines={1}>
                        {ensureDoctorPrefix(booking.doctorName)}
                      </Text>
                      <Text style={styles.specialization} numberOfLines={1}>
                        {booking.specialization}
                      </Text>
                      <View style={styles.hospitalRow}>
                        <Hospital size={11} color={Colors.textSecondary} strokeWidth={2} />
                        <Text style={styles.hospitalName} numberOfLines={1}>
                          {booking.hospitalName}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Booking-ref + fee block — ref displayed prominently for support / lookup */}
                  <View style={styles.tokenRow}>
                    <View style={styles.refBlock}>
                      <Text style={styles.refLabel}>BOOKING REFERENCE</Text>
                      <Text style={styles.refValue} numberOfLines={1} selectable>
                        {booking.bookingRef}
                      </Text>
                    </View>
                    <View style={styles.feeBlock}>
                      <Text style={styles.feeLabel}>FEE</Text>
                      <View style={styles.feeAmountRow}>
                        <IndianRupee size={14} color={Colors.text} strokeWidth={2.5} />
                        <Text style={styles.feeAmount}>{booking.amount.toFixed(0)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Cancel / Reschedule */}
                  {(booking.canCancel || booking.canReschedule) && (
                    <View style={styles.actionRow}>
                      {booking.canReschedule && (
                        <Button
                          title="Reschedule"
                          variant="outline"
                          size="small"
                          icon={<CalendarClock size={14} color={Colors.primary} strokeWidth={2} />}
                          onPress={() =>
                            router.push({
                              pathname: '/booking/reschedule/[id]',
                              params: { id: booking.id },
                            })
                          }
                          style={styles.actionBtn}
                        />
                      )}
                      {booking.canCancel && (
                        <Button
                          title="Cancel"
                          variant="danger"
                          size="small"
                          icon={<XCircle size={14} color={Colors.white} strokeWidth={2} />}
                          onPress={() => handleCancel(booking.id)}
                          loading={
                            cancelBooking.isPending && cancelBooking.variables === booking.id
                          }
                          style={styles.actionBtn}
                        />
                      )}
                    </View>
                  )}

                  {/* Rate-your-visit CTA — only on COMPLETED bookings. */}
                  {booking.status === 'COMPLETED' &&
                    (!booking.reviewId ? (
                      <Button
                        title={t('rateYourVisit') || 'Rate your visit'}
                        variant="primary"
                        size="small"
                        icon={<Star size={14} color={Colors.white} strokeWidth={2.5} />}
                        onPress={() =>
                          setRatingTarget({
                            bookingId: booking.id,
                            doctorName: ensureDoctorPrefix(booking.doctorName),
                            reviewId: null,
                          })
                        }
                        style={styles.actionBtn}
                      />
                    ) : (
                      <RatedRow
                        bookingId={booking.id}
                        reviewId={booking.reviewId}
                        doctorName={ensureDoctorPrefix(booking.doctorName)}
                        onEdit={(args) => setRatingTarget(args)}
                      />
                    ))}
                </Card>
              </TouchableOpacity>
            ))}

            {/* No pagination needed for flat array DTO */}
          </>
        )}
      </ScrollView>
      {ratingTarget && (
        <RatingForm
          visible
          bookingId={ratingTarget.bookingId}
          doctorName={ratingTarget.doctorName}
          reviewId={ratingTarget.reviewId ?? null}
          onClose={() => setRatingTarget(null)}
        />
      )}
    </SafeAreaView>
  );
}

/**
 * Inline display for a booking the patient has already rated. Shows the star
 * value the patient gave (fetched fresh — keeps the row in sync after edits)
 * and a pencil affordance to re-open the form.
 */
function RatedRow({
  bookingId,
  reviewId,
  doctorName,
  onEdit,
}: {
  bookingId: string;
  reviewId: string;
  doctorName: string;
  onEdit: (args: { bookingId: string; doctorName: string; reviewId: string }) => void;
}) {
  const { t } = useLanguage();
  const { data: review } = useMyReviewForBooking(bookingId);
  const stars = review?.rating ?? 0;
  return (
    <View style={styles.ratedRow}>
      <View style={styles.ratedStars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={14}
            color={n <= stars ? Colors.gold : Colors.textSecondary}
            fill={n <= stars ? Colors.gold : 'transparent'}
            strokeWidth={2}
          />
        ))}
        <Text style={styles.ratedLabel}>{t('youRated') || 'You rated'}</Text>
      </View>
      <TouchableOpacity
        onPress={() => onEdit({ bookingId, doctorName, reviewId })}
        hitSlop={6}
        accessibilityLabel={t('editRating') || 'Edit rating'}
      >
        <View style={styles.ratedEdit}>
          <Pencil size={12} color={Colors.primary} strokeWidth={2} />
          <Text style={styles.ratedEditText}>{t('edit') || 'Edit'}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 5,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...crossPlatformShadow({
      color: Colors.shadow,
      offsetY: 2,
      opacity: 0.6,
      radius: 8,
      elevation: 2,
    }),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: Colors.white,
    ...crossPlatformShadow({
      color: Colors.primary,
      offsetY: 3,
      opacity: 0.18,
      radius: 8,
      elevation: 4,
    }),
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  list: {
    flex: 1,
  },
  listContent: { ...contentColumn, padding: 16 },
  bookingCard: {
    marginBottom: 14,
    paddingLeft: 18, // make room for the accent stripe
    overflow: 'hidden',
    position: 'relative',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.primary,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // align to top — left col stacks vertically
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 10,
  },
  headerLeft: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    gap: 3,
  },
  dateLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 0.2,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  bookingBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    marginRight: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorAvatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
  },
  doctorInfo: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  specialization: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  hospitalName: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  // ── Booking ref + fee block (replaces the old token + track-live design) ─
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  refBlock: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  refLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  refValue: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  feeBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: Colors.primary + '30',
  },
  feeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  feeAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feeAmount: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  actionBtn: {
    flex: 1,
  },
  ratedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  ratedStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratedLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  ratedEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratedEditText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  findDoctorBtn: {
    paddingHorizontal: 32,
  },
  loadMoreBtn: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 32,
  },
});
