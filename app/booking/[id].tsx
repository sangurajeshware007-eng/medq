import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Hospital, Calendar, Clock, Sunrise, Sun, Sunset,
  DollarSign, Lightbulb, Ticket, CreditCard, Banknote,
  Smartphone, Radio, CheckCircle, PartyPopper, ChevronLeft,
  ShieldCheck, XCircle as XIcon, RefreshCcw,
} from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { useDoctor, useDoctorSlots, useCreateBooking } from '../../hooks/useApiHooks';
import { useQueryClient } from '@tanstack/react-query';
import { crossPlatformShadow } from '../../utils/shadow';
import type { TimeSlot, Session } from '../../services/doctorService';

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

export default function BookingFlowScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const { user, logout } = useAuth(); // Add logout from AuthContext
  const router = useRouter();
  const createBookingMutation = useCreateBooking();
  const queryClient = useQueryClient();

  const { data: doctor, isLoading: doctorLoading } = useDoctor(id || '');

  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
const [step, setStep] = useState<'slots' | 'payment' | 'success'>('slots');
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);

  // Fetch available slots for selected date
  const selectedDateStr = DATES[selectedDate]?.fullDate || '';
  const { data: slotsData, isLoading: slotsLoading } = useDoctorSlots(
    id || '',
    selectedDateStr,
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

  // Derive sessions and a flat slot lookup from API response
  const sessions: Session[] = slotsData?.sessions ?? [];
  const allSlots: TimeSlot[] = sessions.flatMap((s) => s.slots);

  const consultFee = doctor.consultationFee ?? doctor.fee ?? 0;

  const handleConfirm = async () => {
    if (!doctor || !selectedSlot) return;
    setLoading(true);

    const selectedTime = allSlots.find((s) => s.id === selectedSlot)?.time || '';
    const fullDate = DATES[selectedDate]?.fullDate || '';
    const hospitalId = doctor.hospital?.id || '';

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
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [{ text: 'OK', onPress: async () => { await logout(); router.replace('/(auth)/login'); } }],
        );
        return;
      }

      // 409 Conflict — backend returns DUPLICATE_BOOKING or SLOT_NOT_AVAILABLE
      if (status === 409) {
        if (code === 'SLOT_NOT_AVAILABLE') {
          Alert.alert('Slot Unavailable', 'This slot just got filled. Please select a different time.', [{ text: 'OK' }]);
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

      Alert.alert(
        'Booking Failed',
        backendMessage || 'Something went wrong. Please try again.',
        [{ text: 'Retry', onPress: handleConfirm }, { text: 'Cancel' }],
      );
    }
  };

  const tokenNumber = bookingId || Math.floor(Math.random() * 15) + 1;

  if (step === 'success') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
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
                <Text style={styles.successDoctorName}>{doctor.name}</Text>
                <Text style={styles.successSpec}>{doctor.specialization}</Text>
              </View>
            </View>
            <View style={styles.successDivider} />
            <View style={styles.successInfoRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Calendar size={14} color={Colors.textSecondary} strokeWidth={2} />
                <Text style={styles.successInfoLabel}>{DATES[selectedDate].day}, {DATES[selectedDate].date}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Clock size={14} color={Colors.textSecondary} strokeWidth={2} />
                <Text style={styles.successInfoLabel}>
                  {allSlots.find((s) => s.id === selectedSlot)?.time}
                </Text>
              </View>
            </View>
          </Card>

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
    <SafeAreaView style={styles.container} edges={['top']}>
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
              <Text style={styles.miniName}>{doctor.name}</Text>
              <Text style={styles.miniSpec}>{doctor.specialization}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Hospital size={11} color={Colors.textSecondary} strokeWidth={2} />
                <Text style={styles.miniHospital}>{doctor.hospital?.name || ''}</Text>
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dateScroll}
            >
              {DATES.map((d, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.dateCard,
                    selectedDate === i && styles.dateCardActive,
                  ]}
                  onPress={() => setSelectedDate(i)}
                >
                  {d.label ? (
                    <Text
                      style={[
                        styles.dateLabel,
                        selectedDate === i && styles.dateLabelActive,
                      ]}
                    >
                      {d.label === 'Today' ? t('today') : t('tomorrow')}
                    </Text>
                  ) : null}
                  <Text
                    style={[
                      styles.dateDay,
                      selectedDate === i && styles.dateDayActive,
                    ]}
                  >
                    {d.day}
                  </Text>
                  <Text
                    style={[
                      styles.dateNum,
                      selectedDate === i && styles.dateNumActive,
                    ]}
                  >
                    {d.date}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Time Slots by Session */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color={Colors.text} strokeWidth={2} />
              <Text style={styles.sectionTitle}>{t('selectTime')}</Text>
            </View>

            {sessions.length === 0 && !slotsLoading && (
              <Text style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: 12 }}>
                No slots available for this date.
              </Text>
            )}

            {sessions.map((session, sIdx) => {
              const sessionIcon =
                session.sessionType === 'EVENING' ? (
                  <Sunset size={14} color={Colors.textSecondary} strokeWidth={2} />
                ) : session.startTime && Number(session.startTime.split(':')[0]) >= 12 ? (
                  <Sun size={14} color={Colors.textSecondary} strokeWidth={2} />
                ) : (
                  <Sunrise size={14} color={Colors.textSecondary} strokeWidth={2} />
                );

              return (
                <View key={`session-${sIdx}`} style={{ marginBottom: 12 }}>
                  {/* Session Header */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {sessionIcon}
                    <Text style={styles.periodLabel}>
                      {session.sessionName}
                    </Text>
                    <Text style={{ fontSize: 12, color: Colors.textLight, marginLeft: 4 }}>
                      ({session.startTime} – {session.endTime})
                    </Text>
                  </View>

                  {/* Slot Grid */}
                  <View style={styles.slotGrid}>
                    {session.slots.map((slot) => (
                      <SlotPill
                        key={slot.id}
                        slot={slot}
                        selected={selectedSlot === slot.id}
                        onPress={() => slot.available && !slot.isPast && setSelectedSlot(slot.id)}
                      />
                    ))}
                  </View>
                </View>
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
                <Text style={styles.summaryValue}>
                  {allSlots.find((s) => s.id === selectedSlot)?.time}
                </Text>
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

            {/* Total */}
            <Card style={styles.totalCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t('total')}</Text>
                <Text style={[styles.totalValue, { color: Colors.trustGreen }]}>{t('free')}</Text>
              </View>
              <Text style={styles.totalNote}>
                ₹{consultFee} consultation fee to be paid at clinic
              </Text>
            </Card>
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
            disabled={!selectedSlot}
            size="large"
            style={styles.fullBtn}
          />
        ) : (
          <Button
            title={t('confirmBooking')}
            onPress={handleConfirm}
            loading={loading}
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
      style={[
        styles.slotPill,
        disabled && styles.slotUnavailable,
        selected && styles.slotSelected,
      ]}
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
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary + '15',
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
  },
  totalNote: {
    fontSize: 12,
    color: Colors.textSecondary,
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
    ...crossPlatformShadow({ color: Colors.primary, offsetY: -4, opacity: 0.1, radius: 8, elevation: 8 }),
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
