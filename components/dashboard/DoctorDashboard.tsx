/**
 * DoctorDashboard — redesigned home screen for doctor role.
 *
 * Layout:
 *  1. Doctor header card  (name, hospital, status)
 *  2. 14-day date strip   (3 past + today + 10 future, horizontally scrollable)
 *  3. Per-date stats      (Total / Confirmed / Completed / Revenue)
 *  4. Appointment list    (for selected date, all statuses)
 *  5. Revenue panel       (Today / Week / Month tabs)
 */
import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import {
  Stethoscope, Building2, TrendingUp,
  IndianRupee, Calendar, CheckCircle2,
  XCircle, Clock, ChevronRight, User,
} from 'lucide-react-native';

import { Colors } from '../../constants/Colors';
import { useDoctorDashboard, useDoctorAppointments } from '../../hooks/useApiHooks';
import { crossPlatformShadow } from '../../utils/shadow';
import Card from '../Card';

// ─── Helpers ──────────────────────────────────────────────────────────────

/** YYYY-MM-DD string for a Date object */
const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

/** Build array of Date objects: 3 days back … today … 10 days forward */
function buildDateRange(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 3 + i);
    return d;
  });
}

const DAY_NAMES  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON_NAMES  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatHeaderDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = toDateStr(new Date());
  if (dateStr === today) return 'Today';
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateStr === toDateStr(tomorrow)) return 'Tomorrow';
  return `${d.getDate()} ${MON_NAMES[d.getMonth()]}`;
}

// ─── Status helpers ────────────────────────────────────────────────────────

function statusColor(s: string) {
  switch (s) {
    case 'CONFIRMED': return Colors.trustGreen;
    case 'COMPLETED': return Colors.primary;
    case 'CANCELLED': return Colors.error;
    case 'NO_SHOW':   return Colors.gold;
    default:          return Colors.textSecondary;
  }
}

function statusBg(s: string) {
  switch (s) {
    case 'CONFIRMED': return Colors.trustGreenLight;
    case 'COMPLETED': return Colors.primaryLight;
    case 'CANCELLED': return Colors.errorLight;
    case 'NO_SHOW':   return Colors.goldLight;
    default:          return Colors.borderLight;
  }
}

function statusLabel(s: string) {
  switch (s) {
    case 'CONFIRMED': return 'Confirmed';
    case 'COMPLETED': return 'Completed';
    case 'CANCELLED': return 'Cancelled';
    case 'NO_SHOW':   return 'No Show';
    default:          return s;
  }
}

// ─── Component ────────────────────────────────────────────────────────────

export default function DoctorDashboard() {
  const todayStr   = toDateStr(new Date());
  const dates      = buildDateRange();
  const todayIndex = dates.findIndex(d => toDateStr(d) === todayStr);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [revenueTab,   setRevenueTab]   = useState<'today' | 'week' | 'month'>('today');

  const stripRef = useRef<ScrollView>(null);

  // Scroll date strip so "today" is roughly centred on mount
  useEffect(() => {
    if (stripRef.current && todayIndex >= 0) {
      // Each date cell is ~56px wide + 8px gap
      stripRef.current.scrollTo({ x: Math.max(0, (todayIndex - 2) * 64), animated: false });
    }
  }, [todayIndex]);

  const { data: dashboard, isLoading: dashLoading, isError } = useDoctorDashboard();
  const { data: dateData,  isLoading: dateLoading }          = useDoctorAppointments(selectedDate);

  // ── Loading / error ────────────────────────────────────────────────────
  if (dashLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isError || !dashboard) {
    return (
      <View style={styles.center}>
        <Stethoscope size={48} color={Colors.textLight} strokeWidth={1.5} />
        <Text style={styles.emptyTitle}>Doctor profile not found.</Text>
        <Text style={styles.emptyDesc}>Complete onboarding to access the dashboard.</Text>
      </View>
    );
  }

  const isApproved = dashboard.approvalStatus === 'APPROVED';
  const isRejected = dashboard.approvalStatus === 'REJECTED';

  const revenueAmount =
    revenueTab === 'today' ? dashboard.revenue.todayRevenue
    : revenueTab === 'week' ? dashboard.revenue.weekRevenue
    : dashboard.revenue.monthRevenue;

  const appointments = dateData?.appointments ?? [];

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>

      {/* ── Approval banner ── */}
      {!isApproved && (
        <View style={[styles.banner, isRejected ? styles.bannerRejected : styles.bannerPending]}>
          <Text style={styles.bannerText}>
            {isRejected
              ? 'Profile rejected. Please contact support.'
              : 'Profile under review — you\'ll be notified once approved.'}
          </Text>
        </View>
      )}

      {/* ── Doctor header card ── */}
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.avatarCircle}>
            <Stethoscope size={26} color={Colors.primary} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.doctorName}>Dr. {dashboard.name}</Text>
            <Text style={styles.doctorSpec}>{dashboard.specialization.replace(/_/g, ' ')}</Text>
          </View>
          <View style={[styles.statusPill, isApproved ? styles.pillGreen : styles.pillAmber]}>
            <Text style={[styles.pillText, isApproved ? styles.pillTextGreen : styles.pillTextAmber]}>
              {isApproved ? 'Active' : 'Pending'}
            </Text>
          </View>
        </View>

        {dashboard.primaryHospital && (
          <View style={styles.hospitalRow}>
            <Building2 size={13} color={Colors.textSecondary} strokeWidth={2} />
            <Text style={styles.hospitalText} numberOfLines={1}>
              {dashboard.primaryHospital.hospitalName}
            </Text>
            {dashboard.primaryHospital.roomNumber && (
              <View style={styles.roomChip}>
                <Text style={styles.roomText}>Room {dashboard.primaryHospital.roomNumber}</Text>
              </View>
            )}
          </View>
        )}
      </Card>

      {/* ── 14-day date strip ── */}
      <ScrollView
        ref={stripRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stripContent}
        style={styles.strip}
      >
        {dates.map(d => {
          const ds       = toDateStr(d);
          const isToday  = ds === todayStr;
          const isSel    = ds === selectedDate;
          return (
            <TouchableOpacity
              key={ds}
              onPress={() => setSelectedDate(ds)}
              style={[styles.dateCell, isSel && styles.dateCellSel]}
              activeOpacity={0.7}
            >
              <Text style={[styles.dateDayName, isSel && styles.dateDayNameSel]}>
                {DAY_NAMES[d.getDay()]}
              </Text>
              <Text style={[styles.dateNum, isSel && styles.dateNumSel]}>
                {d.getDate()}
              </Text>
              {isToday && <View style={[styles.todayDot, isSel && styles.todayDotSel]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Per-date header ── */}
      <View style={styles.dateHeader}>
        <Calendar size={14} color={Colors.primary} strokeWidth={2} />
        <Text style={styles.dateHeaderText}>{formatHeaderDate(selectedDate)}</Text>
      </View>

      {/* ── Per-date stats ── */}
      {dateLoading ? (
        <View style={styles.statsLoadingRow}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : (
        <View style={styles.statsGrid}>
          <StatCell
            icon={<Calendar size={16} color={Colors.primary} strokeWidth={2} />}
            value={String(dateData?.totalBookings ?? 0)}
            label="Total"
            valueColor={Colors.text}
          />
          <StatCell
            icon={<CheckCircle2 size={16} color={Colors.trustGreen} strokeWidth={2} />}
            value={String(dateData?.confirmedBookings ?? 0)}
            label="Confirmed"
            valueColor={Colors.trustGreen}
          />
          <StatCell
            icon={<Clock size={16} color={Colors.primary} strokeWidth={2} />}
            value={String(dateData?.completedBookings ?? 0)}
            label="Completed"
            valueColor={Colors.primary}
          />
          <StatCell
            icon={<IndianRupee size={16} color={Colors.gold} strokeWidth={2} />}
            value={`₹${Number(dateData?.dateRevenue ?? 0).toLocaleString('en-IN')}`}
            label="Revenue"
            valueColor={Colors.gold}
          />
        </View>
      )}

      {/* ── Appointment list ── */}
      <Text style={styles.sectionTitle}>Appointments</Text>

      {dateLoading ? (
        <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 16 }} />
      ) : appointments.length === 0 ? (
        <Card style={styles.emptyCard}>
          <XCircle size={32} color={Colors.textLight} strokeWidth={1.5} />
          <Text style={styles.emptyCardText}>No appointments on {formatHeaderDate(selectedDate)}</Text>
        </Card>
      ) : (
        appointments.map(appt => (
          <Card key={appt.bookingId} style={styles.apptCard}>
            <View style={styles.apptRow}>
              {/* Token badge */}
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenText}>#{appt.tokenNumber}</Text>
              </View>

              {/* Patient avatar + info */}
              <View style={styles.patientAvatarCircle}>
                <Text style={styles.patientAvatarText}>
                  {appt.patientName ? appt.patientName.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.patientName} numberOfLines={1}>
                  {appt.patientName ?? 'Patient'}
                </Text>
                <Text style={styles.slotTime}>{appt.slotStart} – {appt.slotEnd}</Text>
              </View>

              {/* Status + fee */}
              <View style={styles.apptRight}>
                <View style={[styles.statusBadge, { backgroundColor: statusBg(appt.status) }]}>
                  <Text style={[styles.statusText, { color: statusColor(appt.status) }]}>
                    {statusLabel(appt.status)}
                  </Text>
                </View>
                <Text style={styles.apptFee}>₹{Number(appt.amount).toFixed(0)}</Text>
              </View>
            </View>
          </Card>
        ))
      )}

      {/* ── Revenue panel ── */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Revenue</Text>
      <Card style={styles.revenueCard}>
        {/* Tab strip */}
        <View style={styles.revenueTabs}>
          {(['today', 'week', 'month'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setRevenueTab(tab)}
              style={[styles.revenueTab, revenueTab === tab && styles.revenueTabActive]}
            >
              <Text style={[styles.revenueTabText, revenueTab === tab && styles.revenueTabTextActive]}>
                {tab === 'today' ? 'Today' : tab === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <View style={styles.revenueAmountRow}>
          <TrendingUp size={20} color={Colors.primary} strokeWidth={2} />
          <Text style={styles.revenueAmount}>
            ₹{Number(revenueAmount).toLocaleString('en-IN')}
          </Text>
        </View>

        {/* Three-col summary always visible */}
        <View style={styles.revenueSummaryRow}>
          <RevenuePill label="Today"  amount={dashboard.revenue.todayRevenue} />
          <View style={styles.revDivider} />
          <RevenuePill label="Week"   amount={dashboard.revenue.weekRevenue}  />
          <View style={styles.revDivider} />
          <RevenuePill label="Month"  amount={dashboard.revenue.monthRevenue} highlight />
        </View>
      </Card>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function StatCell({
  icon, value, label, valueColor,
}: { icon: React.ReactNode; value: string; label: string; valueColor: string }) {
  return (
    <Card style={styles.statCell}>
      {icon}
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function RevenuePill({ label, amount, highlight }: { label: string; amount: number; highlight?: boolean }) {
  return (
    <View style={styles.revPill}>
      <Text style={styles.revPillLabel}>{label}</Text>
      <Text style={[styles.revPillAmount, highlight && { color: Colors.primary }]}>
        ₹{Number(amount).toLocaleString('en-IN')}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:      { padding: 16 },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle:     { fontSize: 16, fontWeight: '700', color: Colors.text,          marginTop: 14, textAlign: 'center' },
  emptyDesc:      { fontSize: 13, color: Colors.textSecondary, marginTop: 6,      textAlign: 'center' },

  // ── Banner ──
  banner:         { borderRadius: 12, padding: 12, marginBottom: 12 },
  bannerPending:  { backgroundColor: Colors.goldLight },
  bannerRejected: { backgroundColor: Colors.errorLight },
  bannerText:     { fontSize: 13, color: Colors.text, lineHeight: 18 },

  // ── Header card ──
  headerCard:  { marginBottom: 14 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatarCircle:{ width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  doctorName:  { fontSize: 16, fontWeight: '800', color: Colors.text },
  doctorSpec:  { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  statusPill:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pillGreen:   { backgroundColor: Colors.trustGreenLight },
  pillAmber:   { backgroundColor: Colors.goldLight },
  pillText:    { fontSize: 11, fontWeight: '700' },
  pillTextGreen: { color: Colors.trustGreen },
  pillTextAmber: { color: Colors.gold },
  hospitalRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hospitalText:{ flex: 1, fontSize: 12, color: Colors.textSecondary },
  roomChip:    { backgroundColor: Colors.borderLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  roomText:    { fontSize: 11, color: Colors.textLight },

  // ── Date strip ──
  strip:        { marginBottom: 14 },
  stripContent: { paddingHorizontal: 4, gap: 8 },
  dateCell:     {
    width: 52, paddingVertical: 8, borderRadius: 14,
    alignItems: 'center', gap: 2,
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.borderLight,
    ...crossPlatformShadow({ color: Colors.shadowDark, offsetY: 2, opacity: 0.06, radius: 6, elevation: 2 }),
  },
  dateCellSel:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateDayName:    { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
  dateDayNameSel: { color: Colors.white },
  dateNum:        { fontSize: 17, fontWeight: '800', color: Colors.text },
  dateNumSel:     { color: Colors.white },
  todayDot:       { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.primary },
  todayDotSel:    { backgroundColor: Colors.white },

  // ── Date header ──
  dateHeader:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  dateHeaderText: { fontSize: 15, fontWeight: '700', color: Colors.text },

  // ── Stats grid ──
  statsGrid:       { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statsLoadingRow: { height: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  statCell:        { flex: 1, alignItems: 'center', padding: 10, gap: 4 },
  statValue:       { fontSize: 18, fontWeight: '900' },
  statLabel:       { fontSize: 10, color: Colors.textSecondary, textAlign: 'center' },

  // ── Section title ──
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 10 },

  // ── Empty card ──
  emptyCard:     { alignItems: 'center', paddingVertical: 28, gap: 10 },
  emptyCardText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

  // ── Appointment cards ──
  apptCard: { marginBottom: 10, padding: 12 },
  apptRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },

  tokenBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.tokenPurpleLight,
    alignItems: 'center', justifyContent: 'center',
  },
  tokenText: { fontSize: 11, fontWeight: '800', color: Colors.tokenPurple },

  patientAvatarCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryLight, borderWidth: 1.5, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  patientAvatarText: { fontSize: 15, fontWeight: '800', color: Colors.primary },

  patientName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  slotTime:    { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },

  apptRight:   { alignItems: 'flex-end', gap: 5 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText:  { fontSize: 11, fontWeight: '700' },
  apptFee:     { fontSize: 13, fontWeight: '800', color: Colors.gold },

  // ── Revenue card ──
  revenueCard: { marginBottom: 8 },

  revenueTabs:     { flexDirection: 'row', backgroundColor: Colors.borderLight, borderRadius: 10, padding: 3, marginBottom: 16 },
  revenueTab:      { flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  revenueTabActive:{ backgroundColor: Colors.white, ...crossPlatformShadow({ color: Colors.shadowDark, offsetY: 1, opacity: 0.08, radius: 4, elevation: 2 }) },
  revenueTabText:  { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  revenueTabTextActive: { color: Colors.primary, fontWeight: '700' },

  revenueAmountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, paddingHorizontal: 4 },
  revenueAmount:    { fontSize: 28, fontWeight: '900', color: Colors.text },

  revenueSummaryRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 12 },
  revDivider:        { width: 1, backgroundColor: Colors.borderLight },
  revPill:           { flex: 1, alignItems: 'center', gap: 2 },
  revPillLabel:      { fontSize: 11, color: Colors.textSecondary },
  revPillAmount:     { fontSize: 14, fontWeight: '800', color: Colors.text },
});
