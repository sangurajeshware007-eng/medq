import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft, Calendar, Clock, Hospital, Stethoscope,
  CheckCircle, CalendarClock, PartyPopper, ArrowRight,
} from 'lucide-react-native';
import { Colors } from '../../../constants/Colors';
import { useBookingDetail, useRescheduleBooking, useDoctorSlots } from '../../../hooks/useApiHooks';
import { crossPlatformShadow } from '../../../utils/shadow';
import type { TimeSlot, Session } from '../../../services/doctorService';

// ─── Constants ───────────────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getUpcomingDates(count: number) {
  const dates = [];
  for (let i = 1; i <= count; i++) {   // start from tomorrow (can't same-day reschedule)
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      label: i === 1 ? 'Tomorrow' : '',
      day: DAY_NAMES[d.getDay()],
      date: String(d.getDate()),
      month: d.toLocaleString('default', { month: 'short' }),
      fullDate: d.toISOString().slice(0, 10),
    });
  }
  return dates;
}

const DATES = getUpcomingDates(14);

// ─── Sub-components ──────────────────────────────────────────────────────

function CurrentBookingCard({
  doctorName, specialization, hospitalName, bookingDate, slotStart, slotEnd, tokenNumber,
}: {
  doctorName: string; specialization: string; hospitalName: string;
  bookingDate: string; slotStart: string; slotEnd: string; tokenNumber: number;
}) {
  return (
    <View style={styles.currentCard}>
      <Text style={styles.currentCardLabel}>Current Appointment</Text>
      <View style={styles.currentCardRow}>
        <Stethoscope size={14} color={Colors.primary} strokeWidth={2} />
        <Text style={styles.currentCardDoctor}>{doctorName}</Text>
        <Text style={styles.currentCardSpec}> · {specialization}</Text>
      </View>
      <View style={styles.currentCardRow}>
        <Hospital size={13} color={Colors.textSecondary} strokeWidth={2} />
        <Text style={styles.currentCardSub}>{hospitalName}</Text>
      </View>
      <View style={[styles.currentCardRow, { marginTop: 6 }]}>
        <Calendar size={13} color={Colors.textSecondary} strokeWidth={2} />
        <Text style={styles.currentCardSub}>{bookingDate}</Text>
        <Clock size={13} color={Colors.textSecondary} strokeWidth={2} style={{ marginLeft: 10 }} />
        <Text style={styles.currentCardSub}>{slotStart} – {slotEnd}</Text>
        <Text style={styles.tokenBadge}>Token #{tokenNumber}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────

export default function RescheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: booking, isLoading: bookingLoading } = useBookingDetail(id);
  const rescheduleMutation = useRescheduleBooking();

  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const [newBookingRef, setNewBookingRef] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<number | null>(null);

  const selectedDateObj = DATES[selectedDateIdx];
  const { data: slotsData, isLoading: slotsLoading } = useDoctorSlots(
    booking?.doctorId ?? '',
    selectedDateObj?.fullDate ?? '',
    { enabled: !!booking?.doctorId },
  );

  const sessions: Session[] = slotsData?.sessions ?? [];
  const allSlots: TimeSlot[] = sessions.flatMap((s) => s.slots);
  const selectedSlot = allSlots.find((s) => s.id === selectedSlotId);

  // ── Handlers ────────────────────────────────────────────────────────────

  function handleConfirm() {
    if (!selectedSlot || !selectedDateObj || !booking) return;
    rescheduleMutation.mutate(
      { id: booking.id, data: { newDate: selectedDateObj.fullDate, newSlotStart: selectedSlot.time } },
      {
        onSuccess: (result) => {
          setNewBookingRef(result.bookingRef);
          setNewToken(result.tokenNumber);
          setStep('success');
        },
        onError: (err: any) => {
          Alert.alert(
            'Reschedule Failed',
            err?.message?.includes('not available')
              ? 'That slot is no longer available. Please pick a different time.'
              : err?.message || 'Something went wrong. Please try again.',
          );
        },
      },
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (bookingLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Booking not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLinkBtn}>
            <Text style={styles.backLinkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Success step ─────────────────────────────────────────────────────────

  if (step === 'success') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.successContainer}>
          <PartyPopper size={64} color={Colors.trustGreen} strokeWidth={1.5} />
          <Text style={styles.successTitle}>Rescheduled!</Text>
          <Text style={styles.successSubtitle}>Your appointment has been moved to a new time.</Text>

          <View style={styles.successCard}>
            <Text style={styles.successLabel}>New Booking Ref</Text>
            <Text style={styles.successRef}>{newBookingRef}</Text>

            <View style={styles.successRow}>
              <Calendar size={14} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.successDetail}>{selectedDateObj?.fullDate}</Text>
              <Clock size={14} color={Colors.primary} strokeWidth={2} style={{ marginLeft: 12 }} />
              <Text style={styles.successDetail}>{selectedSlot?.time}</Text>
            </View>

            {newToken && (
              <View style={styles.tokenRow}>
                <Text style={styles.tokenLabel}>New Token</Text>
                <Text style={styles.tokenValue}>#{newToken}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace('/(tabs)/booking')}
          >
            <Text style={styles.primaryBtnText}>Back to My Bookings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Confirm step ─────────────────────────────────────────────────────────

  if (step === 'confirm') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => setStep('select')} style={styles.backBtn}>
            <ChevronLeft size={22} color={Colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Confirm Reschedule</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.confirmContent}>
          {/* Old → New visual */}
          <View style={styles.changeCard}>
            <View style={styles.changeRow}>
              <View style={styles.changeSide}>
                <Text style={styles.changeLabel}>Current</Text>
                <Text style={styles.changeDate}>{booking.bookingDate}</Text>
                <Text style={styles.changeSlot}>{booking.slotStart} – {booking.slotEnd}</Text>
                <Text style={styles.changeToken}>Token #{booking.tokenNumber}</Text>
              </View>
              <ArrowRight size={22} color={Colors.primary} strokeWidth={2.5} />
              <View style={styles.changeSide}>
                <Text style={[styles.changeLabel, { color: Colors.primary }]}>New</Text>
                <Text style={[styles.changeDate, { color: Colors.primary }]}>
                  {selectedDateObj?.day}, {selectedDateObj?.date} {selectedDateObj?.month}
                </Text>
                <Text style={[styles.changeSlot, { color: Colors.primary }]}>{selectedSlot?.time}</Text>
                <Text style={[styles.changeToken, { color: Colors.textSecondary }]}>New token assigned</Text>
              </View>
            </View>
          </View>

          <CurrentBookingCard
            doctorName={booking.doctorName}
            specialization={booking.specialization}
            hospitalName={booking.hospitalName}
            bookingDate={booking.bookingDate}
            slotStart={booking.slotStart}
            slotEnd={booking.slotEnd}
            tokenNumber={booking.tokenNumber}
          />

          <View style={styles.noticeCard}>
            <CheckCircle size={16} color={Colors.trustGreen} strokeWidth={2} />
            <Text style={styles.noticeText}>
              Your current booking will be cancelled and a new one created with the same doctor and hospital.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, rescheduleMutation.isPending && styles.primaryBtnDisabled]}
            onPress={handleConfirm}
            disabled={rescheduleMutation.isPending}
          >
            {rescheduleMutation.isPending ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>Confirm Reschedule</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Select step ──────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={Colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Reschedule</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.sectionPad}>
          <CurrentBookingCard
            doctorName={booking.doctorName}
            specialization={booking.specialization}
            hospitalName={booking.hospitalName}
            bookingDate={booking.bookingDate}
            slotStart={booking.slotStart}
            slotEnd={booking.slotEnd}
            tokenNumber={booking.tokenNumber}
          />
        </View>

        {/* Date picker */}
        <View style={styles.sectionPad}>
          <Text style={styles.sectionTitle}>Choose a New Date</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
          {DATES.map((d, idx) => {
            const active = idx === selectedDateIdx;
            return (
              <TouchableOpacity
                key={d.fullDate}
                onPress={() => { setSelectedDateIdx(idx); setSelectedSlotId(null); }}
                style={[styles.datePill, active && styles.datePillActive]}
              >
                {d.label ? <Text style={[styles.dateLabel, active && styles.dateLabelActive]}>{d.label}</Text> : null}
                <Text style={[styles.dateDay, active && styles.dateDayActive]}>{d.day}</Text>
                <Text style={[styles.dateNum, active && styles.dateNumActive]}>{d.date}</Text>
                <Text style={[styles.dateMon, active && styles.dateMonActive]}>{d.month}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Slot picker */}
        <View style={styles.sectionPad}>
          <Text style={styles.sectionTitle}>Choose a Time Slot</Text>
        </View>

        {slotsLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.centered}>
            <CalendarClock size={32} color={Colors.textLight} strokeWidth={1.5} />
            <Text style={styles.noSlotsText}>No slots available on this day</Text>
          </View>
        ) : (
          sessions.map((session) => (
            <View key={session.sessionName} style={styles.sessionBlock}>
              <Text style={styles.sessionName}>{session.sessionName}</Text>
              <View style={styles.slotGrid}>
                {session.slots.map((slot) => {
                  const unavailable = !slot.available || slot.isPast;
                  const active = slot.id === selectedSlotId;
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      onPress={() => !unavailable && setSelectedSlotId(slot.id)}
                      disabled={unavailable}
                      style={[
                        styles.slotPill,
                        active && styles.slotPillActive,
                        unavailable && styles.slotPillDisabled,
                      ]}
                    >
                      <Text style={[
                        styles.slotTime,
                        active && styles.slotTimeActive,
                        unavailable && styles.slotTimeDisabled,
                      ]}>
                        {slot.time.split('-')[0]}
                      </Text>
                      {!unavailable && slot.remaining <= 3 && (
                        <Text style={styles.slotRemaining}>{slot.remaining} left</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom CTA */}
      {selectedSlotId && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomBarDate}>
              {selectedDateObj?.day}, {selectedDateObj?.date} {selectedDateObj?.month}
            </Text>
            <Text style={styles.bottomBarSlot}>{selectedSlot?.time}</Text>
          </View>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => setStep('confirm')}>
            <Text style={styles.ctaBtnText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 16, color: Colors.textSecondary, marginBottom: 12 },
  backLinkBtn: { paddingVertical: 8 },
  backLinkText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },

  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },

  sectionPad: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },

  currentCard: {
    backgroundColor: Colors.primaryLight, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  currentCardLabel: { fontSize: 11, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  currentCardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  currentCardDoctor: { fontSize: 14, fontWeight: '700', color: Colors.text },
  currentCardSpec: { fontSize: 13, color: Colors.primary },
  currentCardSub: { fontSize: 13, color: Colors.textSecondary },
  tokenBadge: { marginLeft: 'auto', fontSize: 11, fontWeight: '700', color: Colors.primary, backgroundColor: Colors.white, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },

  dateRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  datePill: {
    alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.borderLight, minWidth: 58,
    ...crossPlatformShadow({ color: Colors.shadow, offsetY: 1, opacity: 1, radius: 4, elevation: 1 }),
  },
  datePillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateLabel: { fontSize: 9, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', marginBottom: 1 },
  dateLabelActive: { color: Colors.white },
  dateDay: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  dateDayActive: { color: Colors.white + 'CC' },
  dateNum: { fontSize: 20, fontWeight: '900', color: Colors.text, lineHeight: 24 },
  dateNumActive: { color: Colors.white },
  dateMon: { fontSize: 10, color: Colors.textSecondary },
  dateMonActive: { color: Colors.white + 'CC' },

  sessionBlock: { paddingHorizontal: 16, marginTop: 16 },
  sessionName: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotPill: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.borderLight,
    alignItems: 'center', minWidth: 80,
  },
  slotPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  slotPillDisabled: { backgroundColor: Colors.borderLight, borderColor: Colors.borderLight },
  slotTime: { fontSize: 13, fontWeight: '700', color: Colors.text },
  slotTimeActive: { color: Colors.white },
  slotTimeDisabled: { color: Colors.textLight },
  slotRemaining: { fontSize: 10, color: Colors.error, fontWeight: '600', marginTop: 1 },

  noSlotsText: { fontSize: 14, color: Colors.textSecondary, marginTop: 8 },

  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
    ...crossPlatformShadow({ color: Colors.shadowDark, offsetY: -2, opacity: 1, radius: 8, elevation: 8 }),
  },
  bottomBarDate: { fontSize: 13, fontWeight: '700', color: Colors.text },
  bottomBarSlot: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  ctaBtn: { backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  ctaBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },

  // Confirm step
  confirmContent: { padding: 16, gap: 14 },
  changeCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.borderLight,
    ...crossPlatformShadow({ color: Colors.shadow, offsetY: 2, opacity: 1, radius: 8, elevation: 2 }),
  },
  changeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  changeSide: { flex: 1, alignItems: 'center', gap: 3 },
  changeLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: Colors.textSecondary },
  changeDate: { fontSize: 14, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  changeSlot: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  changeToken: { fontSize: 11, color: Colors.textSecondary },
  noticeCard: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: Colors.trustGreenLight, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.trustGreen + '40',
  },
  noticeText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 18 },

  primaryBtn: {
    backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', marginTop: 4,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },

  // Success step
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  successTitle: { fontSize: 26, fontWeight: '900', color: Colors.text },
  successSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  successCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 20, width: '100%',
    alignItems: 'center', gap: 10,
    ...crossPlatformShadow({ color: Colors.shadow, offsetY: 2, opacity: 1, radius: 8, elevation: 2 }),
  },
  successLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  successRef: { fontSize: 20, fontWeight: '900', color: Colors.primary },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  successDetail: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  tokenRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primaryLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  tokenLabel: { fontSize: 12, color: Colors.textSecondary },
  tokenValue: { fontSize: 22, fontWeight: '900', color: Colors.primary },
});
