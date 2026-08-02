/**
 * HospitalManagerDashboard — shown on the Home tab for HOSPITAL_MANAGER role.
 * Displays: hospital status, linked doctors list, booking and revenue stats.
 */
import {
  Building2,
  Users,
  Calendar,
  TrendingUp,
  Stethoscope,
  IndianRupee,
  CheckCircle,
  Clock,
} from 'lucide-react-native';
import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';

import { Colors } from '../../constants/Colors';
import { useHospitalManagerDashboard } from '../../hooks/useApiHooks';
import type { LinkedDoctor } from '../../services/dashboardService';
import Card from '../Card';

import { contentColumn } from '@/theme';

function DoctorRow({ doctor }: { doctor: LinkedDoctor }) {
  const isApproved = doctor.approvalStatus === 'APPROVED';
  return (
    <View style={styles.doctorRow}>
      <View style={styles.doctorAvatar}>
        <Stethoscope size={16} color={Colors.primary} strokeWidth={2} />
      </View>
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>{doctor.name}</Text>
        <Text style={styles.doctorSpec}>{doctor.specialization.replace(/_/g, ' ')}</Text>
      </View>
      <View style={styles.doctorRight}>
        <Text style={styles.doctorFee}>₹{Number(doctor.consultationFee).toFixed(0)}</Text>
        <View
          style={[
            styles.approvalDot,
            { backgroundColor: isApproved ? Colors.trustGreen : Colors.gold },
          ]}
        />
      </View>
    </View>
  );
}

export default function HospitalManagerDashboard() {
  const { data, isLoading, isError } = useHospitalManagerDashboard();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.center}>
        <Building2 size={48} color={Colors.textLight} strokeWidth={1.5} />
        <Text style={styles.emptyText}>Hospital profile not found.</Text>
        <Text style={styles.emptySubText}>
          Complete your hospital onboarding to access the dashboard.
        </Text>
      </View>
    );
  }

  const isApproved = data.approvalStatus === 'APPROVED';

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      {/* Hospital Card */}
      <Card style={styles.hospitalCard}>
        <View style={styles.hospitalHeader}>
          <View style={styles.hospitalIcon}>
            <Building2 size={26} color={Colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.hospitalText}>
            <Text style={styles.hospitalName}>{data.hospitalName}</Text>
            <Text style={styles.hospitalDepts} numberOfLines={1}>
              {data.departments.slice(0, 3).join(' · ')}
            </Text>
          </View>
          <View
            style={[styles.statusBadge, isApproved ? styles.badgeApproved : styles.badgePending]}
          >
            {isApproved ? (
              <CheckCircle size={14} color={Colors.trustGreen} strokeWidth={2.5} />
            ) : (
              <Clock size={14} color={Colors.primary} strokeWidth={2.5} />
            )}
            <Text
              style={[styles.badgeText, { color: isApproved ? Colors.trustGreen : Colors.primary }]}
            >
              {data.approvalStatus}
            </Text>
          </View>
        </View>

        {!isApproved && (
          <View style={styles.pendingBanner}>
            <Text style={styles.pendingText}>
              Your hospital is under review. Doctors can be linked once approved.
            </Text>
          </View>
        )}
      </Card>

      {/* Stats Row */}
      <Text style={styles.sectionTitle}>This Month</Text>
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Calendar size={18} color={Colors.primary} strokeWidth={2} />
          <Text style={styles.statValue}>{data.stats.monthBookings}</Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </Card>
        <Card style={styles.statCard}>
          <Users size={18} color={Colors.accent} strokeWidth={2} />
          <Text style={[styles.statValue, { color: Colors.accent }]}>{data.totalDoctors}</Text>
          <Text style={styles.statLabel}>Doctors</Text>
        </Card>
        <Card style={styles.statCard}>
          <IndianRupee size={18} color={Colors.gold} strokeWidth={2} />
          <Text style={[styles.statValue, { color: Colors.gold }]}>
            ₹{Number(data.stats.monthRevenue).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </Card>
      </View>

      {/* Revenue Detail */}
      <Card style={styles.revenueCard}>
        <View style={styles.revenueHeader}>
          <TrendingUp size={18} color={Colors.primary} strokeWidth={2} />
          <Text style={styles.revenueTitle}>Revenue Summary</Text>
        </View>
        <View style={styles.revenueCols}>
          <View style={styles.revenueCol}>
            <Text style={styles.revenueLabel}>Today</Text>
            <Text style={styles.revenueValue}>
              ₹{Number(data.stats.todayBookings).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.revenueSubLabel}>{data.stats.todayBookings} bookings</Text>
          </View>
          <View style={styles.revenueDiv} />
          <View style={styles.revenueCol}>
            <Text style={styles.revenueLabel}>This Week</Text>
            <Text style={styles.revenueValue}>
              ₹{Number(data.stats.weekRevenue).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.revenueSubLabel}>{data.stats.weekBookings} bookings</Text>
          </View>
        </View>
      </Card>

      {/* Linked Doctors */}
      <Text style={styles.sectionTitle}>Linked Doctors ({data.totalDoctors})</Text>
      {data.linkedDoctors.length === 0 ? (
        <Card style={styles.emptyDoctorsCard}>
          <Stethoscope size={32} color={Colors.textLight} strokeWidth={1.5} />
          <Text style={styles.emptyDoctorsText}>No doctors linked yet.</Text>
          <Text style={styles.emptyDoctorsSubText}>
            Doctors can link to your hospital during their onboarding.
          </Text>
        </Card>
      ) : (
        <Card style={styles.doctorListCard}>
          {data.linkedDoctors.map((doc, idx) => (
            <View key={doc.doctorId}>
              <DoctorRow doctor={doc} />
              {idx < data.linkedDoctors.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { ...contentColumn, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: { fontSize: 13, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  hospitalCard: { marginBottom: 16 },
  hospitalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hospitalIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospitalText: { flex: 1 },
  hospitalName: { fontSize: 16, fontWeight: '800', color: Colors.text },
  hospitalDepts: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeApproved: { backgroundColor: Colors.trustGreenLight },
  badgePending: { backgroundColor: Colors.primaryLight },
  badgeText: { fontSize: 11, fontWeight: '700' },
  pendingBanner: {
    marginTop: 12,
    padding: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
  },
  pendingText: { fontSize: 12, color: Colors.primary, lineHeight: 17 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
    marginTop: 4,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'center', padding: 12, gap: 6 },
  statValue: { fontSize: 18, fontWeight: '900', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  revenueCard: { marginBottom: 16 },
  revenueHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  revenueTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  revenueCols: { flexDirection: 'row' },
  revenueCol: { flex: 1, alignItems: 'center' },
  revenueDiv: { width: 1, backgroundColor: Colors.borderLight },
  revenueLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  revenueValue: { fontSize: 16, fontWeight: '800', color: Colors.text },
  revenueSubLabel: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  doctorListCard: { padding: 0 },
  doctorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  doctorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  doctorSpec: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  doctorRight: { alignItems: 'flex-end', gap: 4 },
  doctorFee: { fontSize: 14, fontWeight: '700', color: Colors.gold },
  approvalDot: { width: 8, height: 8, borderRadius: 4 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 14 },
  emptyDoctorsCard: { alignItems: 'center', padding: 24, gap: 8 },
  emptyDoctorsText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  emptyDoctorsSubText: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 17,
  },
});
