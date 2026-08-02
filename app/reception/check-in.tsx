import { useRouter } from 'expo-router';
import {
  ChevronRight,
  Building2,
  Search,
  CheckCircle,
  Clock,
  User,
  Stethoscope,
  X,
  RefreshCw,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../constants/Colors';
import receptionService, {
  type ReceptionBookingItem,
  type ReceptionHospitalItem,
} from '../../services/receptionService';
import { getApiErrorMessage } from '../../utils/apiError';

import { contentColumn } from '@/theme';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextDays(n: number): string[] {
  const result: string[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

function formatDateLabel(iso: string): { day: string; date: string } {
  const d = new Date(iso + 'T00:00:00');
  const day = d.toLocaleDateString('en-US', { weekday: 'short' });
  const date = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  return { day, date };
}

export default function CheckInAppointmentScreen() {
  const router = useRouter();

  const [hospitals, setHospitals] = useState<ReceptionHospitalItem[]>([]);
  const [hospital, setHospital] = useState<ReceptionHospitalItem | null>(null);
  const [loadingHospitals, setLoadingHospitals] = useState(true);

  const dates = nextDays(3);
  const [date, setDate] = useState<string>(todayIso());

  const [bookings, setBookings] = useState<ReceptionBookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [onlyPending, setOnlyPending] = useState(true);
  const [search, setSearch] = useState('');

  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  useEffect(() => {
    receptionService
      .myHospitals()
      .then((list) => {
        setHospitals(list);
        if (list.length === 1) setHospital(list[0]);
      })
      .catch(() => {})
      .finally(() => setLoadingHospitals(false));
  }, []);

  const load = React.useCallback(async () => {
    if (!hospital) {
      setBookings([]);
      return;
    }
    setLoading(true);
    try {
      const list = await receptionService.listBookings(hospital.hospitalId, date, onlyPending);
      setBookings(list);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [hospital, date, onlyPending]);

  useEffect(() => {
    load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleCheckIn(b: ReceptionBookingItem) {
    Alert.alert('Check in patient', `Mark ${b.patientName} as present for ${b.slotStart}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Check in',
        onPress: async () => {
          setCheckingInId(b.bookingId);
          try {
            await receptionService.checkIn(b.bookingRef);
            await load();
          } catch (e: unknown) {
            Alert.alert('Could not check in', getApiErrorMessage(e, 'Failed to check in.'));
          } finally {
            setCheckingInId(null);
          }
        },
      },
    ]);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter(
      (b) =>
        b.patientName.toLowerCase().includes(q) ||
        b.patientPhone.includes(q) ||
        b.bookingRef.toLowerCase().includes(q) ||
        b.doctorName.toLowerCase().includes(q),
    );
  }, [bookings, search]);

  const pendingCount = bookings.filter((b) => !b.checkedIn).length;
  const checkedCount = bookings.filter((b) => b.checkedIn).length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronRight
            size={20}
            color={Colors.text}
            strokeWidth={2.5}
            style={{ transform: [{ rotate: '180deg' }] }}
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Check-in Appointment</Text>
          {hospital && (
            <Text style={styles.headerSub} numberOfLines={1}>
              {hospital.hospitalName}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.iconBtn}>
          <RefreshCw size={18} color={Colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Hospital picker (only if more than one) */}
      {!loadingHospitals && hospitals.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hospitalsRow}
        >
          {hospitals.map((h) => (
            <TouchableOpacity
              key={h.hospitalId}
              onPress={() => setHospital(h)}
              style={[
                styles.hospitalChip,
                hospital?.hospitalId === h.hospitalId && styles.hospitalChipActive,
              ]}
            >
              <Building2
                size={13}
                color={hospital?.hospitalId === h.hospitalId ? Colors.white : Colors.primary}
                strokeWidth={2.5}
              />
              <Text
                style={[
                  styles.hospitalChipText,
                  hospital?.hospitalId === h.hospitalId && { color: Colors.white },
                ]}
              >
                {h.hospitalName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Date selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.datesRow}
      >
        {dates.map((iso) => {
          const { day, date: lbl } = formatDateLabel(iso);
          const selected = date === iso;
          return (
            <TouchableOpacity
              key={iso}
              onPress={() => setDate(iso)}
              style={[styles.dateChip, selected && styles.dateChipSelected]}
            >
              <Text style={[styles.dateChipDay, selected && { color: Colors.white }]}>{day}</Text>
              <Text style={[styles.dateChipDate, selected && { color: Colors.white }]}>{lbl}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Stats + filter toggle */}
      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <Clock size={11} color={Colors.gold} strokeWidth={2.5} />
          <Text style={styles.statText}>{pendingCount} pending</Text>
        </View>
        <View style={styles.statPill}>
          <CheckCircle size={11} color={Colors.trustGreen} strokeWidth={2.5} />
          <Text style={styles.statText}>{checkedCount} checked in</Text>
        </View>
        <TouchableOpacity
          onPress={() => setOnlyPending((v) => !v)}
          style={[styles.toggle, !onlyPending && styles.toggleActive]}
        >
          <Text style={[styles.toggleText, !onlyPending && { color: Colors.white }]}>
            {onlyPending ? 'Show all' : 'Pending only'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Search size={14} color={Colors.textSecondary} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, ref, doctor"
          placeholderTextColor={Colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={14} color={Colors.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {loadingHospitals ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : !hospital ? (
          <Text style={styles.empty}>You aren't assigned to any hospital yet.</Text>
        ) : loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <CheckCircle size={36} color={Colors.borderLight} strokeWidth={1.5} />
            <Text style={styles.empty}>
              {search
                ? 'No bookings match your search.'
                : onlyPending
                  ? 'No pending check-ins for this date.'
                  : 'No bookings on this date.'}
            </Text>
          </View>
        ) : (
          filtered.map((b) => (
            <View key={b.bookingId} style={[styles.card, b.checkedIn && styles.cardCheckedIn]}>
              <View style={styles.cardLeft}>
                <View style={styles.token}>
                  <Text style={styles.tokenLabel}>TOKEN</Text>
                  <Text style={styles.tokenValue}>{b.tokenNumber}</Text>
                </View>
                <View style={styles.cardSlot}>
                  <Clock size={11} color={Colors.textSecondary} strokeWidth={2.5} />
                  <Text style={styles.cardSlotText}>{b.slotStart}</Text>
                </View>
              </View>

              <View style={styles.cardMid}>
                <View style={styles.cardName}>
                  <User size={13} color={Colors.text} strokeWidth={2.5} />
                  <Text style={styles.cardNameText} numberOfLines={1}>
                    {b.patientName}
                  </Text>
                  {b.source === 'WALK_IN' && (
                    <View style={styles.walkInBadge}>
                      <Text style={styles.walkInText}>Walk-in</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardSub} numberOfLines={1}>
                  {b.patientPhone}
                </Text>
                <View style={styles.cardDoctor}>
                  <Stethoscope size={11} color={Colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.cardDoctorText} numberOfLines={1}>
                    {b.doctorName}
                  </Text>
                </View>
                <Text style={styles.cardRef}>{b.bookingRef}</Text>
              </View>

              <View style={styles.cardRight}>
                {b.checkedIn ? (
                  <View style={styles.checkedBadge}>
                    <CheckCircle size={14} color={Colors.trustGreen} strokeWidth={2.5} />
                    <Text style={styles.checkedText}>In</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.checkInBtn, checkingInId === b.bookingId && { opacity: 0.6 }]}
                    onPress={() => handleCheckIn(b)}
                    disabled={checkingInId === b.bookingId}
                    activeOpacity={0.75}
                  >
                    {checkingInId === b.bookingId ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <CheckCircle size={14} color={Colors.white} strokeWidth={2.5} />
                        <Text style={styles.checkInBtnText}>Check in</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: 4 },
  iconBtn: { padding: 6, borderRadius: 8, backgroundColor: Colors.primaryLight },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  hospitalsRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: Colors.white,
  },
  hospitalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  hospitalChipActive: { backgroundColor: Colors.primary },
  hospitalChipText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  datesRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.white,
    alignItems: 'center',
    minWidth: 60,
  },
  dateChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateChipDay: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },
  dateChipDate: { fontSize: 12, fontWeight: '800', color: Colors.text, marginTop: 1 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  statText: { fontSize: 11, fontWeight: '700', color: Colors.text },
  toggle: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  toggleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleText: { fontSize: 11, fontWeight: '700', color: Colors.text },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, padding: 0 },
  list: { flex: 1 },
  listContent: { ...contentColumn, padding: 16, paddingTop: 4, paddingBottom: 40, gap: 10 },
  empty: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 24 },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardCheckedIn: { backgroundColor: '#F0FDF4', borderColor: Colors.trustGreen },
  cardLeft: { alignItems: 'center', gap: 6 },
  token: {
    minWidth: 56,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
  },
  tokenLabel: { fontSize: 9, fontWeight: '800', color: Colors.primary, letterSpacing: 0.5 },
  tokenValue: { fontSize: 18, fontWeight: '900', color: Colors.text, marginTop: 1 },
  cardSlot: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardSlotText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  cardMid: { flex: 1, gap: 3, justifyContent: 'center' },
  cardName: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardNameText: { flex: 1, fontSize: 14, fontWeight: '800', color: Colors.text },
  walkInBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
  },
  walkInText: { fontSize: 9, fontWeight: '800', color: '#7C3AED' },
  cardSub: { fontSize: 12, color: Colors.textSecondary },
  cardDoctor: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  cardDoctorText: { flex: 1, fontSize: 12, color: Colors.text, fontWeight: '600' },
  cardRef: {
    fontSize: 10,
    color: Colors.textLight,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  cardRight: { justifyContent: 'center' },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  checkInBtnText: { fontSize: 12, fontWeight: '800', color: Colors.white },
  checkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
  },
  checkedText: { fontSize: 12, fontWeight: '800', color: Colors.trustGreen },
});
