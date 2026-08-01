import { useQueryClient } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Hospital,
  Calendar,
  Clock,
  Sunrise,
  Sun,
  Sunset,
  DollarSign,
  Lightbulb,
  Ticket,
  CreditCard,
  Banknote,
  Smartphone,
  Radio,
  CheckCircle,
  PartyPopper,
  ChevronLeft,
  ShieldCheck,
  XCircle as XIcon,
  RefreshCcw,
  Navigation,
  MapPin,
} from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../components/Button';
import Card from '../../components/Card';
import LocalizedName from '../../components/LocalizedName';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDoctor, useDoctorSlots, useCreateBooking } from '../../hooks/useApiHooks';
import type { TimeSlot, Session } from '../../services/doctorService';
import { crossPlatformShadow } from '../../utils/shadow';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getUpcomingDates(count: number) {
  const dates = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : '',
      day: DAY_NAMES[d.getDay()],
      date: String(d.getDate()),
      fullDate: d.toISOString().slice(0, 10), // YYYY-MM-DD for API
    });
  }
  return dates;
}

const DATES = getUpcomingDates(5);

/** Parses "HH:mm-HH:mm" into minutes-since-midnight bounds. Returns null on malformed input. */
function parseSlotTime(time: string): { startMin: number; endMin: number } | null {
  const [a, b] = time.split('-').map((s) => s.trim());
  if (!a || !b) return null;
  const toMin = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN;
  };
  const startMin = toMin(a);
  const endMin = toMin(b);
  return Number.isFinite(startMin) && Number.isFinite(endMin) ? { startMin, endMin } : null;
}

/** Browsing is anonymous; creating a booking requires an account. */
export default function BookingFlowScreen() {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }
  return <BookingFlowScreenInner />;
}

function BookingFlowScreenInner() {
  const { id, hospitalId: hospitalIdParam } = useLocalSearchParams<{
    id: string;
    hospitalId?: string;
  }>();
  const { t } = useLanguage();
  const { user, logout } = useAuth(); // Add logout from AuthContext
  const router = useRouter();
  const createBookingMutation = useCreateBooking();
  const queryClient = useQueryClient();

  const { data: doctor, isLoading: doctorLoading } = useDoctor(id || '');

  const [selectedDate, setSelectedDate] = useState(0);
  // Track BOTH the slot and the hospital it belongs to — doctors who practice
  // at multiple hospitals get one section per hospital, so the slot alone is
  // not enough to know where to send the booking.
  const [selection, setSelection] = useState<{ hospitalId: string; slot: TimeSlot } | null>(null);
  const [step, setStep] = useState<'slots' | 'payment' | 'success'>('slots');
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);

  // List of hospitals to render. Prefer the new affiliations array; fall back
  // to the legacy single `hospital` field so older payloads still work.
  const hospitalList = useMemo(() => {
    if (!doctor) return [];
    if (doctor.hospitals && doctor.hospitals.length > 0) {
      // Primary first, then the rest in their original order.
      return [...doctor.hospitals].sort((a, b) =>
        a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1,
      );
    }
    if (doctor.hospital) {
      return [
        {
          hospitalId: doctor.hospital.id,
          hospitalName: doctor.hospital.name,
          address: doctor.hospital.address ?? '',
          locationLat: doctor.hospital.locationLat ?? 0,
          locationLng: doctor.hospital.locationLng ?? 0,
          consultationFee: doctor.consultationFee ?? doctor.fee ?? 0,
          isPrimary: true,
          availableDays: [],
        },
      ];
    }
    return [];
  }, [doctor]);

  const hasMultipleHospitals = hospitalList.length > 1;

  // Always show every hospital the doctor works at — the patient should be
  // able to compare slots across hospitals on the same day. If the route
  // pre-selected one (e.g. via a chip on the doctor screen), bump it to the
  // top instead of filtering the rest out.
  const renderedHospitals = useMemo(() => {
    if (!hospitalIdParam) return hospitalList;
    const idx = hospitalList.findIndex((h) => h.hospitalId === hospitalIdParam);
    if (idx <= 0) return hospitalList;
    const reordered = [...hospitalList];
    const [picked] = reordered.splice(idx, 1);
    reordered.unshift(picked);
    return reordered;
  }, [hospitalList, hospitalIdParam]);

  // The hospital reflected in the header card. Driven by the user's slot pick;
  // before any pick, falls back to the primary affiliation.
  const displayedHospital = useMemo(() => {
    if (selection) {
      return hospitalList.find((h) => h.hospitalId === selection.hospitalId) ?? null;
    }
    return hospitalList.find((h) => h.isPrimary) ?? hospitalList[0] ?? null;
  }, [selection, hospitalList]);

  const selectedDateStr = DATES[selectedDate]?.fullDate || '';

  // When a slot is picked at one hospital, slots at OTHER hospitals that
  // overlap the same time window are physically impossible (one doctor,
  // two places) — we hide them in those sections.
  const excludedRange = useMemo(
    () => (selection ? parseSlotTime(selection.slot.time) : null),
    [selection],
  );
  const selectedHospitalName = useMemo(
    () =>
      selection
        ? (hospitalList.find((h) => h.hospitalId === selection.hospitalId)?.hospitalName ?? '')
        : '',
    [selection, hospitalList],
  );

  if (doctorLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: Colors.textSecondary }}>Loading doctor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Doctor not found</Text>
      </SafeAreaView>
    );
  }

  // Per-hospital fee used by the payment summary. Falls back to the doctor's
  // default fee if the selected hospital doesn't have one set.
  const consultFee =
    displayedHospital?.consultationFee ?? doctor.consultationFee ?? doctor.fee ?? 0;

  const handleConfirm = async () => {
    if (!doctor || !selection) return;
    setLoading(true);

    const selectedTime = selection.slot.time;
    const fullDate = DATES[selectedDate]?.fullDate || '';
    const hospitalId = selection.hospitalId;

    try {
      // Map frontend fields to backend contract
      const response = await createBookingMutation.mutateAsync({
        doctorId: String(doctor.id),
        hospitalId,
        bookingDate: fullDate,
        slotStart: selectedTime,
        paymentMethod: 'CASH',
      });
      setBookingId(String(response.bookingId));
      setBookingRef(response.bookingRef);
      // Invalidate slots query so availability updates immediately
      queryClient.invalidateQueries({ queryKey: ['doctor', id, 'slots', selectedDateStr] });
      setLoading(false);
      setStep('success');
    } catch (err: any) {
      setLoading(false);
      // AxiosError keeps status on err.response; plain ApiError puts it on err directly
      const status: number | undefined = err?.response?.status ?? err?.status;
      const errBody = err?.response?.data ?? err?.data;
      const apiError = errBody?.error ?? errBody;
      const code: string | undefined = apiError?.code;
      const backendMessage: string | undefined = apiError?.message ?? err?.message;

      if (status === 401) {
        Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
              router.replace('/(auth)/login');
            },
          },
        ]);
        return;
      }

      // 409 Conflict — backend returns DUPLICATE_BOOKING or SLOT_NOT_AVAILABLE
      if (status === 409) {
        if (code === 'SLOT_NOT_AVAILABLE') {
          Alert.alert(
            'Slot Unavailable',
            'This slot just got filled. Please select a different time.',
            [{ text: 'OK' }],
          );
        } else {
          // DUPLICATE_BOOKING (or any other 409)
          Alert.alert(
            'Already Booked',
            `You already have an appointment with ${doctor.name} on this date. Only one booking per doctor per day is allowed.`,
            [{ text: 'OK' }],
          );
        }
        return;
      }

      Alert.alert('Booking Failed', backendMessage || 'Something went wrong. Please try again.', [
        { text: 'Retry', onPress: handleConfirm },
        { text: 'Cancel' },
      ]);
    }
  };

  const tokenNumber = bookingId || Math.floor(Math.random() * 15) + 1;

  const openDirectionsToHospital = () => {
    const lat = doctor?.hospital?.locationLat;
    const lng = doctor?.hospital?.locationLng;
    const name = doctor?.hospital?.name ?? '';
    const address = doctor?.hospital?.address ?? '';
    const label = encodeURIComponent(name || address);

    // Prefer coordinates when we have them — opens turn-by-turn directions.
    // Fall back to address search if the hospital didn't pin a precise location.
    const url =
      lat && lng
        ? Platform.select({
            ios: `http://maps.apple.com/?daddr=${lat},${lng}&q=${label}`,
            default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
          })
        : address
          ? Platform.select({
              ios: `http://maps.apple.com/?daddr=${encodeURIComponent(address)}`,
              default: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
            })
          : null;

    if (!url) {
      Alert.alert('No location', 'This hospital has not set a precise location yet.');
      return;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert('Could not open Maps', 'Please open your maps app manually.');
    });
  };

  if (step === 'success') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successContainer}>
          <PartyPopper size={64} color={Colors.trustGreen} strokeWidth={1.5} />
          <Text style={styles.successTitle}>{t('bookingConfirmed')}</Text>
          <Text style={styles.successSubtitle}>{t('bookingSuccess')}</Text>

          <Card style={styles.bookingRefCard}>
            <Text style={styles.bookingRefLabel}>Booking Reference</Text>
            <Text style={styles.bookingRefValue}>{bookingRef ?? '—'}</Text>
          </Card>

          <Card style={styles.successCard}>
            <View style={styles.successDoctorRow}>
              <Image source={{ uri: doctor.photo }} style={styles.successAvatar} />
              <View>
                <LocalizedName name={doctor.name} style={styles.successDoctorName} />
                <Text style={styles.successSpec}>{doctor.specialization}</Text>
              </View>
            </View>
            <View style={styles.successDivider} />
            <View style={styles.successInfoRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Calendar size={14} color={Colors.textSecondary} strokeWidth={2} />
                <Text style={styles.successInfoLabel}>
                  {DATES[selectedDate].day}, {DATES[selectedDate].date}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Clock size={14} color={Colors.textSecondary} strokeWidth={2} />
                <Text style={styles.successInfoLabel}>{selection?.slot.time}</Text>
              </View>
            </View>
          </Card>

          {/* Hospital location card — directions to the appointment */}
          {doctor.hospital && (doctor.hospital.locationLat || doctor.hospital.address) && (
            <TouchableOpacity
              style={styles.directionsCard}
              onPress={openDirectionsToHospital}
              activeOpacity={0.85}
            >
              <View style={styles.directionsIconWrap}>
                <Navigation size={20} color={Colors.primary} strokeWidth={2.2} />
              </View>
              <View style={styles.directionsBody}>
                <Text style={styles.directionsTitle}>Get Directions</Text>
                <View style={styles.directionsRow}>
                  <MapPin size={11} color={Colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.directionsAddr} numberOfLines={2}>
                    <LocalizedName name={doctor.hospital.name} />
                    {doctor.hospital.address ? ` · ${doctor.hospital.address}` : ''}
                  </Text>
                </View>
              </View>
              <Text style={styles.directionsCta}>Open Maps →</Text>
            </TouchableOpacity>
          )}

          <View style={styles.successActions}>
            {/* Track Token feature hidden for MVP */}
            <Button
              title={t('goHome')}
              variant="outline"
              onPress={() => router.replace('/(tabs)')}
              size="medium"
              style={styles.successBtn}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (step === 'payment' ? setStep('slots') : router.back())}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 'slots' ? t('bookAppointment') : t('paymentDetails')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Doctor Mini Card */}
        <Card style={styles.miniCard}>
          <View style={styles.miniRow}>
            <Image source={{ uri: doctor.photo }} style={styles.miniAvatar} />
            <View style={styles.miniInfo}>
              <LocalizedName name={doctor.name} style={styles.miniName} />
              <Text style={styles.miniSpec}>{doctor.specialization}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Hospital size={11} color={Colors.textSecondary} strokeWidth={2} />
                <Text style={styles.miniHospital}>
                  {hasMultipleHospitals
                    ? `${hospitalList.length} hospitals · pick a slot below`
                    : displayedHospital?.hospitalName || doctor.hospital?.name || ''}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {step === 'slots' && (
          <>
            {/* Date Selection */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Calendar size={16} color={Colors.text} strokeWidth={2} />
              <Text style={styles.sectionTitle}>{t('selectDate')}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {DATES.map((d, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.dateCard, selectedDate === i && styles.dateCardActive]}
                  onPress={() => setSelectedDate(i)}
                >
                  {d.label ? (
                    <Text style={[styles.dateLabel, selectedDate === i && styles.dateLabelActive]}>
                      {d.label === 'Today' ? t('today') : t('tomorrow')}
                    </Text>
                  ) : null}
                  <Text style={[styles.dateDay, selectedDate === i && styles.dateDayActive]}>
                    {d.day}
                  </Text>
                  <Text style={[styles.dateNum, selectedDate === i && styles.dateNumActive]}>
                    {d.date}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Time Slots by Session — grouped per hospital when the doctor
                practices at more than one location. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color={Colors.text} strokeWidth={2} />
              <Text style={styles.sectionTitle}>{t('selectTime')}</Text>
            </View>

            {renderedHospitals.length === 0 && (
              <Text style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: 12 }}>
                No hospitals linked for this doctor yet.
              </Text>
            )}

            {renderedHospitals.map((h) => {
              const isSelectedHospital = selection?.hospitalId === h.hospitalId;
              return (
                <HospitalSlotsSection
                  key={h.hospitalId}
                  doctorId={id || ''}
                  date={selectedDateStr}
                  hospitalId={h.hospitalId}
                  hospitalName={h.hospitalName}
                  hospitalAddress={h.address}
                  hospitalFee={h.consultationFee}
                  showHospitalHeader={hasMultipleHospitals}
                  selectedSlotId={isSelectedHospital ? selection!.slot.id : null}
                  // Only OTHER hospitals get a filter — the picked hospital
                  // keeps its full grid so the user can change their pick.
                  excludedRange={!isSelectedHospital ? excludedRange : null}
                  excludedHospitalName={!isSelectedHospital ? selectedHospitalName : ''}
                  onSelect={(slot) => setSelection({ hospitalId: h.hospitalId, slot })}
                  onClearSelection={() => setSelection(null)}
                />
              );
            })}
          </>
        )}

        {step === 'payment' && (
          <>
            {/* Selected Slot Summary */}
            <Card style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Calendar size={13} color={Colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.summaryLabel}>Date</Text>
                </View>
                <Text style={styles.summaryValue}>
                  {DATES[selectedDate].day}, {DATES[selectedDate].date}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} color={Colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.summaryLabel}>Time</Text>
                </View>
                <Text style={styles.summaryValue}>{selection?.slot.time}</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <DollarSign size={13} color={Colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.summaryLabel}>Consultation Fee</Text>
                </View>
                <Text style={styles.summaryValue}>₹{consultFee}</Text>
              </View>
            </Card>

            {/* Fee Reassurance */}
            <View style={styles.reassurance}>
              <Lightbulb size={16} color={Colors.trustGreen} strokeWidth={2} />
              <Text style={styles.reassuranceText}>{t('consultationFee')}</Text>
            </View>

            {/* Platform Fee - 100% OFF */}
            <Card style={styles.platformFeeCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ticket size={16} color={Colors.text} strokeWidth={2} />
                <Text style={styles.platformFeeTitle}>{t('platformFee')}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>100% OFF</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.platformFeeStrike}>₹20</Text>
                <Text style={styles.platformFeeFree}>FREE</Text>
              </View>
            </Card>

            {/* Total — emphasises the actual amount the patient pays at the clinic.
                The previous "Total: FREE" line was misleading (only the platform fee
                is free; the consultation fee is still payable). */}
            <View style={styles.totalCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Payable</Text>
                <View style={styles.totalAmountWrap}>
                  <Text style={styles.totalCurrency}>₹</Text>
                  <Text style={styles.totalAmount}>{consultFee}</Text>
                </View>
              </View>
              <View style={styles.totalNoteRow}>
                <Lightbulb size={12} color={Colors.primary} strokeWidth={2.5} />
                <Text style={styles.totalNote}>Pay directly at the clinic</Text>
              </View>
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        {step === 'slots' ? (
          <Button
            title={t('confirmBooking')}
            onPress={() => setStep('payment')}
            disabled={!selection}
            size="large"
            style={styles.fullBtn}
          />
        ) : (
          <Button
            title={t('confirmBooking')}
            onPress={handleConfirm}
            loading={loading}
            loadingIndicator="injection"
            size="large"
            variant="success"
            style={styles.fullBtn}
            icon={<CheckCircle size={16} color={Colors.white} strokeWidth={2} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

/**
 * One section of the booking screen — renders the slot grid for a single
 * hospital. Doctors who practice at multiple hospitals get one of these per
 * hospital, stacked vertically, so the patient can pick a hospital + time in
 * a single screen. The hook is called inside this component (not in a parent
 * loop) so the Rules of Hooks aren't violated.
 */
function HospitalSlotsSection({
  doctorId,
  date,
  hospitalId,
  hospitalName,
  hospitalAddress,
  hospitalFee,
  showHospitalHeader,
  selectedSlotId,
  excludedRange,
  excludedHospitalName,
  onSelect,
  onClearSelection,
}: {
  doctorId: string;
  date: string;
  hospitalId: string;
  hospitalName: string;
  hospitalAddress?: string;
  hospitalFee?: number;
  showHospitalHeader: boolean;
  selectedSlotId: string | null;
  excludedRange?: { startMin: number; endMin: number } | null;
  excludedHospitalName?: string;
  onSelect: (slot: TimeSlot) => void;
  onClearSelection?: () => void;
}) {
  const { data, isLoading } = useDoctorSlots(doctorId, date, hospitalId);
  const sessions: Session[] = data?.sessions ?? [];

  // When the patient has already picked a slot at another hospital, drop any
  // slots here whose time window overlaps that pick — one doctor can't be in
  // two places at once. If a session has no slots left, drop the session too.
  const sessionsToRender = useMemo(() => {
    if (!excludedRange) return sessions;
    return sessions
      .map((s) => ({
        ...s,
        slots: s.slots.filter((slot) => {
          const range = parseSlotTime(slot.time);
          if (!range) return true;
          // Non-overlap condition: this slot ends before the excluded starts,
          // or begins after the excluded ends.
          return range.endMin <= excludedRange.startMin || range.startMin >= excludedRange.endMin;
        }),
      }))
      .filter((s) => s.slots.length > 0);
  }, [sessions, excludedRange]);

  const allHidden =
    !!excludedRange && !isLoading && sessions.length > 0 && sessionsToRender.length === 0;

  return (
    <View style={styles.hospitalSection}>
      {showHospitalHeader && (
        <View style={styles.hospitalSectionHeader}>
          <View style={styles.hospitalSectionTitleRow}>
            <Hospital size={14} color={Colors.primary} strokeWidth={2.5} />
            <Text style={styles.hospitalSectionName} numberOfLines={1}>
              {hospitalName}
            </Text>
          </View>
          {typeof hospitalFee === 'number' && hospitalFee > 0 && (
            <Text style={styles.hospitalSectionFee}>₹{hospitalFee}</Text>
          )}
        </View>
      )}
      {showHospitalHeader && hospitalAddress ? (
        <Text style={styles.hospitalSectionAddress} numberOfLines={1}>
          {hospitalAddress}
        </Text>
      ) : null}

      {isLoading && <Text style={styles.hospitalSectionEmpty}>Checking availability…</Text>}
      {!isLoading && sessions.length === 0 && (
        <Text style={styles.hospitalSectionEmpty}>No slots available for this date.</Text>
      )}

      {allHidden && (
        <TouchableOpacity
          style={styles.conflictHint}
          onPress={onClearSelection}
          activeOpacity={0.75}
        >
          <Text style={styles.conflictHintText}>
            All time slots conflict with your pick
            {excludedHospitalName ? ` at ${excludedHospitalName}` : ''}.{' '}
            <Text style={styles.conflictHintCta}>Tap to switch.</Text>
          </Text>
        </TouchableOpacity>
      )}

      {sessionsToRender.map((session, sIdx) => {
        const sessionIcon =
          session.sessionType === 'EVENING' ? (
            <Sunset size={14} color={Colors.textSecondary} strokeWidth={2} />
          ) : session.startTime && Number(session.startTime.split(':')[0]) >= 12 ? (
            <Sun size={14} color={Colors.textSecondary} strokeWidth={2} />
          ) : (
            <Sunrise size={14} color={Colors.textSecondary} strokeWidth={2} />
          );

        return (
          <View key={`session-${hospitalId}-${sIdx}`} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {sessionIcon}
              <Text style={styles.periodLabel}>{session.sessionName}</Text>
              <Text style={{ fontSize: 12, color: Colors.textLight, marginLeft: 4 }}>
                ({session.startTime} – {session.endTime})
              </Text>
            </View>
            <View style={styles.slotGrid}>
              {session.slots.map((slot) => (
                <SlotPill
                  key={slot.id}
                  slot={slot}
                  selected={selectedSlotId === slot.id}
                  onPress={() => slot.available && !slot.isPast && onSelect(slot)}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function SlotPill({
  slot,
  selected,
  onPress,
}: {
  slot: TimeSlot;
  selected: boolean;
  onPress: () => void;
}) {
  const disabled = !slot.available || slot.isPast;
  return (
    <TouchableOpacity
      style={[styles.slotPill, disabled && styles.slotUnavailable, selected && styles.slotSelected]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={{ width: '100%' }}>
        <Text
          style={[
            styles.slotText,
            disabled && styles.slotTextUnavailable,
            selected && styles.slotTextSelected,
          ]}
        >
          {slot.time}
        </Text>
        {/* Progress bar */}
        {!slot.isPast && typeof slot.percentFilled === 'number' && (
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(0, slot.percentFilled))}%` },
              ]}
            />
          </View>
        )}
        {/* Remaining count */}
        {!slot.isPast && typeof slot.remaining === 'number' && (
          <Text style={styles.remainingText}>{slot.remaining} remaining</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  slotPill: {
    minWidth: 80,
    margin: 4,
    padding: 10,
    borderRadius: 20, // More curved
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 8,
    zIndex: 10, // Make sure it's on top
    // Optionally, add a slight scale for selected below
  },
  slotSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
    elevation: 16, // Even higher when selected
    zIndex: 20,
    shadowOpacity: 0.28, // Stronger shadow
    shadowRadius: 12,
    transform: [{ scale: 1.04 }], // Slightly larger
  },
  slotTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  slotUnavailable: {
    backgroundColor: Colors.borderLight,
    borderColor: Colors.border,
    opacity: 0.6,
  },
  slotText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  slotTextUnavailable: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  backBtn: {
    padding: 4,
  },
  backText: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  headerRight: {
    width: 32,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  miniCard: {
    marginBottom: 16,
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.borderLight,
    marginRight: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  miniInfo: {
    flex: 1,
  },
  miniName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  miniSpec: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  miniHospital: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  dateScroll: {
    marginBottom: 20,
  },
  dateCard: {
    width: 70,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  dateCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 2,
  },
  dateLabelActive: {
    color: Colors.white,
  },
  dateDay: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dateDayActive: {
    color: Colors.white,
  },
  dateNum: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  dateNumActive: {
    color: Colors.white,
  },
  hospitalSection: {
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  hospitalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 2,
  },
  hospitalSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingRight: 8,
  },
  hospitalSectionName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    flexShrink: 1,
  },
  hospitalSectionFee: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  hospitalSectionAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 20,
  },
  hospitalSectionEmpty: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginVertical: 8,
    marginLeft: 4,
  },
  conflictHint: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginVertical: 6,
  },
  conflictHintText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  conflictHintCta: {
    color: Colors.primary,
    fontWeight: '800',
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  slotPill: {
    minWidth: 80,
    margin: 4,
    padding: 10,
    borderRadius: 20, // More curved
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 8,
    zIndex: 10, // Make sure it's on top
    // Optionally, add a slight scale for selected below
  },
  slotSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
    elevation: 16, // Even higher when selected
    zIndex: 20,
    shadowOpacity: 0.28, // Stronger shadow
    shadowRadius: 12,
    transform: [{ scale: 1.04 }], // Slightly larger
  },
  progressBarBg: {
    width: '100%',
    height: 5,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 5,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  remainingText: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  summaryCard: {
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  reassurance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.trustGreenLight,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  reassuranceIcon: {
    fontSize: 18,
  },
  reassuranceText: {
    fontSize: 13,
    color: Colors.trustGreen,
    fontWeight: '600',
    flex: 1,
  },
  platformFeeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  platformFeeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  platformFeeAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  discountBadge: {
    backgroundColor: Colors.trustGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
  },
  platformFeeStrike: {
    fontSize: 13,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  platformFeeFree: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.trustGreen,
  },
  paymentOptions: {
    gap: 10,
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 12,
  },
  paymentOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  paymentOptionIcon: {
    fontSize: 22,
  },
  paymentOptionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  paymentOptionTextActive: {
    color: Colors.primary,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.trustGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  upiCard: {
    marginBottom: 16,
  },
  upiTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  upiApps: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  upiApp: {
    alignItems: 'center',
    gap: 4,
  },
  upiAppIcon: {
    fontSize: 28,
  },
  upiAppName: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  totalCard: {
    backgroundColor: Colors.primary, // solid teal — highlight the total
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
    ...crossPlatformShadow({
      color: Colors.primary,
      opacity: 0.3,
      offsetY: 6,
      radius: 14,
      elevation: 8,
    }),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  totalAmountWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalCurrency: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    marginRight: 2,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 0.3,
    fontVariant: ['tabular-nums'],
  },
  totalNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
  },
  totalNote: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.2,
  },
  bottomSpacer: {
    height: 100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 32,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...crossPlatformShadow({
      color: Colors.primary,
      offsetY: -4,
      opacity: 0.1,
      radius: 8,
      elevation: 8,
    }),
  },
  fullBtn: {
    width: '100%',
  },
  // Success
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.trustGreen,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  successCard: {
    width: '100%',
    marginBottom: 16,
  },
  successDoctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  successAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.borderLight,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  successDoctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  successSpec: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  successDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: 12,
  },
  successInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  successInfoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tokenCard: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: Colors.tokenPurpleLight,
    borderColor: Colors.tokenPurple + '30',
    marginBottom: 24,
  },
  tokenCardLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  tokenCardNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.tokenPurple,
  },
  successActions: {
    width: '100%',
    gap: 12,
  },
  successBtn: {
    width: '100%',
  },
  directionsCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: Colors.white,
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
  directionsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionsBody: { flex: 1 },
  directionsTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  directionsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  directionsAddr: { flex: 1, fontSize: 11, color: Colors.textSecondary, lineHeight: 15 },
  directionsCta: { fontSize: 11, color: Colors.primary, fontWeight: '700' },
});
// Remove slotPill and slotSelected from this export, as they are already defined above
export const { slotUnavailable, slotText, slotTextUnavailable } = StyleSheet.create({
  slotTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  slotUnavailable: {
    backgroundColor: Colors.borderLight,
    borderColor: Colors.border,
    opacity: 0.6,
  },
  slotText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  slotTextUnavailable: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
});
