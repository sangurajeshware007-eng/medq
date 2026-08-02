/**
 * PatientHistory — one patient's visit history with the signed-in doctor.
 * Name/phone arrive via route params for an instant header; the visit list
 * is fetched per page.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Building2,
  Calendar,
  ChevronLeft,
  Clock,
  IndianRupee,
  MessageCircle,
  Phone,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../constants/Colors';
import { useDoctorPatientHistory } from '../../hooks/useApiHooks';
import type { PatientVisit } from '../../services/doctorPatientService';

import { sanitizePhone, statusBg, statusColor, statusLabel } from './appointmentStatus';

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function VisitCard({ visit }: { visit: PatientVisit }) {
  return (
    <View style={styles.visitCard}>
      <View style={styles.visitTop}>
        <View style={styles.visitDateWrap}>
          <Calendar size={13} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.visitDate}>{formatDate(visit.date)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusBg(visit.status) }]}>
          <Text style={[styles.badgeText, { color: statusColor(visit.status) }]}>
            {statusLabel(visit.status)}
          </Text>
        </View>
      </View>
      <View style={styles.visitMetaRow}>
        <View style={styles.visitMetaItem}>
          <Clock size={12} color={Colors.textLight} strokeWidth={2} />
          <Text style={styles.visitMetaText}>
            {visit.slotStart}–{visit.slotEnd} · Token #{visit.tokenNumber}
          </Text>
        </View>
        <View style={styles.visitMetaItem}>
          <IndianRupee size={12} color={Colors.textLight} strokeWidth={2} />
          <Text style={styles.visitMetaText}>{Number(visit.amount).toLocaleString('en-IN')}</Text>
        </View>
      </View>
      {visit.hospitalName && (
        <View style={styles.visitMetaItem}>
          <Building2 size={12} color={Colors.textLight} strokeWidth={2} />
          <Text style={styles.visitMetaText} numberOfLines={1}>
            {visit.hospitalName}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function PatientHistory() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; name?: string; phone?: string }>();
  const patientUserId = typeof params.id === 'string' ? params.id : '';
  const name = typeof params.name === 'string' && params.name ? params.name : 'Patient';
  const phone = typeof params.phone === 'string' ? params.phone : '';

  const [page, setPage] = useState(0);
  const { data, isLoading, isFetching, isError } = useDoctorPatientHistory(patientUserId, page);

  const call = () => {
    const num = phone ? sanitizePhone(phone) : '';
    if (num) Linking.openURL(`tel:${num}`).catch(() => {});
  };
  const whatsapp = () => {
    const num = phone ? sanitizePhone(phone).replace(/^\+/, '') : '';
    if (num) Linking.openURL(`https://wa.me/${num}`).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <ChevronLeft size={22} color={Colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {name}
        </Text>
        {phone ? (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={call} style={styles.roundBtn} hitSlop={6}>
              <Phone size={14} color={Colors.primary} strokeWidth={2.4} />
            </TouchableOpacity>
            <TouchableOpacity onPress={whatsapp} style={styles.roundBtnWhatsapp} hitSlop={6}>
              <MessageCircle size={14} color={Colors.whatsappGreenDark} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      {phone ? <Text style={styles.phoneLine}>{phone}</Text> : null}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : isError || !data ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Couldn’t load visit history.</Text>
        </View>
      ) : data.content.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No visits recorded.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.countLine}>
            {data.totalElements} visit{data.totalElements === 1 ? '' : 's'} with you
          </Text>
          <View style={styles.list}>
            {data.content.map((v) => (
              <VisitCard key={v.bookingId} visit={v} />
            ))}
          </View>

          {data.totalPages > 1 && (
            <View style={styles.pager}>
              <TouchableOpacity
                disabled={data.isFirst || isFetching}
                onPress={() => setPage((p) => Math.max(0, p - 1))}
                style={[styles.pagerBtn, (data.isFirst || isFetching) && styles.pagerBtnDisabled]}
              >
                <Text style={styles.pagerText}>Previous</Text>
              </TouchableOpacity>
              <Text style={styles.pagerPage}>
                {data.page + 1} / {data.totalPages}
              </Text>
              <TouchableOpacity
                disabled={data.isLast || isFetching}
                onPress={() => setPage((p) => p + 1)}
                style={[styles.pagerBtn, (data.isLast || isFetching) && styles.pagerBtnDisabled]}
              >
                <Text style={styles.pagerText}>Next</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 2 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.text },
  headerActions: { flexDirection: 'row', gap: 8 },
  roundBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtnWhatsapp: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.trustGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneLine: { fontSize: 12, color: Colors.textLight, paddingHorizontal: 16, marginBottom: 4 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },

  listContent: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  countLine: { fontSize: 12, color: Colors.textLight, marginBottom: 8 },
  list: { gap: 8 },

  visitCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 6,
  },
  visitTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  visitDateWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  visitDate: { fontSize: 13, fontWeight: '600', color: Colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  visitMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  visitMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  visitMetaText: { fontSize: 11, color: Colors.textLight },

  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 16,
  },
  pagerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  pagerBtnDisabled: { opacity: 0.4 },
  pagerText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  pagerPage: { fontSize: 12, color: Colors.textSecondary },
});
