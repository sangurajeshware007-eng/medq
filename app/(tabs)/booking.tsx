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
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ClipboardList, Hospital, Radio, XCircle, CalendarClock, IndianRupee } from 'lucide-react-native';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { useUpcomingBookings, usePastBookings, useCancelBooking } from '../../hooks/useApiHooks';
import { crossPlatformShadow } from '../../utils/shadow';
import LogoHeader from '../../components/LogoHeader';
import type { BookingListItem } from '../../services/bookingService';

export default function BookingScreen() {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [upcomingPage, setUpcomingPage] = useState(0);
  const [pastPage, setPastPage] = useState(0);

   // ─── Fetch upcoming bookings ─────────────────────────────────────────
   const {
     data: upcomingBookings,
     isLoading: upcomingLoading,
     error: upcomingError,
   } = useUpcomingBookings();

   // ─── Fetch past bookings ────────────────────────────────────────────
   const {
     data: pastBookings,
     isLoading: pastLoading,
     error: pastError,
   } = usePastBookings();

   const cancelBooking = useCancelBooking();

   // ─── Derived state ──────────────────────────────────────────────────
   const isUpcoming = activeTab === 'upcoming';
   const bookings = isUpcoming
     ? upcomingBookings ?? []
     : pastBookings ?? [];
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
  type BookingStatus = BookingListItem['status'];

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return Colors.trustGreen;
      case 'COMPLETED':
        return Colors.primary;
      case 'CANCELLED':
        return Colors.error;
    }
  };

  const getStatusText = (status: BookingStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return t('confirmed');
      case 'COMPLETED':
        return t('completed');
      case 'CANCELLED':
        return t('cancelled');
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

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => switchTab('upcoming')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'upcoming' && styles.tabTextActive,
            ]}
          >
            {t('upcomingBookings')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => switchTab('past')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'past' && styles.tabTextActive,
            ]}
          >
            {t('pastBookings')}
          </Text>
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
            <ActivityIndicator size="large" color={Colors.primary} />
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
                    pathname: '/token/[id]',
                    params: { id: booking.doctorId },
                  })
                }
              >
                <Card style={styles.bookingCard}>
                  <View style={styles.bookingHeader}>
                    <View style={styles.dateContainer}>
                      <Text style={styles.dateText}>
                        {booking.bookingDate}
                      </Text>
                             <Text style={styles.timeText}>{booking.slotStart} - {booking.slotEnd}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(booking.status) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(booking.status) },
                        ]}
                      >
                        {getStatusText(booking.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bookingBody}>
                    <View style={styles.doctorAvatarPlaceholder}>
                      <Text style={styles.doctorAvatarText}>
                        {booking.doctorName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.doctorInfo}>
                      <Text style={styles.doctorName}>{booking.doctorName}</Text>
                      <Text style={styles.specialization}>{booking.specialization}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Hospital size={12} color={Colors.textSecondary} strokeWidth={2} />
                        <Text style={styles.hospitalName}>{booking.hospitalName}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.tokenRow}>
                    <View style={styles.tokenInfo}>
                      <Text style={styles.tokenLabel}>{t('yourToken')}</Text>
                      <Text style={styles.tokenValue}>#{booking.tokenNumber}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <IndianRupee size={14} color={Colors.primary} strokeWidth={2.5} />
                      <Text style={styles.amountText}>{booking.amount.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.trackButton}
                      onPress={() =>
                        router.push({
                          pathname: '/token/[id]',
                          params: { id: booking.doctorId },
                        })
                      }
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Radio size={12} color={Colors.white} strokeWidth={2.5} />
                        <Text style={styles.trackButtonText}>{t('trackToken')}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Cancel / Reschedule — shown only when API says so */}
                  {(booking.canCancel || booking.canReschedule) && (
                    <View style={styles.actionRow}>
                      {booking.canReschedule && (
                        <Button
                          title={t('reschedule') || 'Reschedule'}
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
                          title={t('cancel') || 'Cancel'}
                          variant="danger"
                          size="small"
                          icon={<XCircle size={14} color={Colors.white} strokeWidth={2} />}
                          onPress={() => handleCancel(booking.id)}
                          loading={cancelBooking.isPending && cancelBooking.variables === booking.id}
                          style={styles.actionBtn}
                        />
                      )}
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            ))}

             {/* No pagination needed for flat array DTO */}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
    ...crossPlatformShadow({ color: Colors.shadow, offsetY: 2, opacity: 1, radius: 8, elevation: 3 }),
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
    backgroundColor: Colors.borderLight,
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.white,
    ...crossPlatformShadow({ color: Colors.shadow, offsetY: 2, opacity: 1, radius: 4, elevation: 2 }),
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  bookingCard: {
    marginBottom: 14,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  timeText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
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
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  specialization: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  hospitalName: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 10,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tokenLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tokenValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  trackButton: {
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  trackButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
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

