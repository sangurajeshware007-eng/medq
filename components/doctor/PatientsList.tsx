/**
 * PatientsList — searchable, paginated list of every patient the doctor
 * has seen (distinct, latest visit first). Rows open the patient's visit
 * history at /doctor/patient/[id].
 */
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Search, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../constants/Colors';
import { useDoctorPatients } from '../../hooks/useApiHooks';
import type { DoctorPatientSummary } from '../../services/doctorPatientService';

const SEARCH_DEBOUNCE_MS = 400;

function initialOf(name: string | null): string {
  return name?.trim().charAt(0).toUpperCase() || '?';
}

function formatVisitDate(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function PatientRow({ patient, onPress }: { patient: DoctorPatientSummary; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initialOf(patient.name)}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {patient.name ?? 'Patient'}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {patient.phone ?? 'No phone'} · Last visit {formatVisitDate(patient.lastVisitDate)}
        </Text>
      </View>
      <View style={styles.visitChip}>
        <Text style={styles.visitChipText}>
          {patient.visitCount} visit{patient.visitCount === 1 ? '' : 's'}
        </Text>
      </View>
      <ChevronRight size={16} color={Colors.textLight} strokeWidth={2} />
    </TouchableOpacity>
  );
}

export default function PatientsList() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  // Debounce typing into the query param; reset to page 0 on a new search.
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError } = useDoctorPatients(page, search);

  const openHistory = (p: DoctorPatientSummary) =>
    router.push({
      pathname: '/doctor/patient/[id]',
      params: { id: p.userId, name: p.name ?? '', phone: p.phone ?? '' },
    });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <ChevronLeft size={22} color={Colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Patients</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.searchWrap}>
        <Search size={16} color={Colors.textLight} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone"
          placeholderTextColor={Colors.textLight}
          value={searchInput}
          onChangeText={setSearchInput}
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Users size={44} color={Colors.textLight} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Couldn’t load patients.</Text>
        </View>
      ) : !data || data.content.length === 0 ? (
        <View style={styles.center}>
          <Users size={44} color={Colors.textLight} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>
            {search ? 'No patients match your search.' : 'No patients yet.'}
          </Text>
          <Text style={styles.emptyDesc}>
            Patients appear here after their first booking with you.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.countLine}>
            {data.totalElements} patient{data.totalElements === 1 ? '' : 's'}
          </Text>
          <View style={styles.list}>
            {data.content.map((p) => (
              <PatientRow key={p.userId} patient={p} onPress={() => openHistory(p)} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 2 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.cardBg,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: Colors.text },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  emptyDesc: { fontSize: 12, color: Colors.textLight, textAlign: 'center' },

  listContent: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  countLine: { fontSize: 12, color: Colors.textLight, marginBottom: 8 },
  list: { gap: 8 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  rowMeta: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  visitChip: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  visitChipText: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },

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
