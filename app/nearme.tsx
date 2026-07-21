import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronDown,
  ChevronLeft,
  Clock,
  Hospital,
  MapPin,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Seo from '../components/web/Seo';
import { Colors } from '../constants/Colors';
import { useLanguage } from '../context/LanguageContext';
import { useLocation } from '../context/LocationContext';
import { useNearbyHospitals } from '../hooks/useApiHooks';
import type { HospitalListItem } from '../services/hospitalService';
import { crossPlatformShadow } from '../utils/shadow';

// Bidar, Karnataka — default fallback coords
const DEFAULT_LAT = 17.8674;
const DEFAULT_LNG = 76.9501;

// ─── Filter constants ────────────────────────────────────────────────────────

const DISTANCE_CHIPS = [
  { label: 'Any', km: 0 },
  { label: '< 5 km', km: 5 },
  { label: '< 10 km', km: 10 },
  { label: '< 25 km', km: 25 },
  { label: '< 50 km', km: 50 },
];

// Phase 1: rating sort hidden until reviews ship.
const SORT_OPTIONS = [
  { label: 'Distance', key: 'distance' },
  { label: 'Doctors', key: 'doctors' },
] as const;
type SortKey = 'distance' | 'doctors';

const DEPT_PALETTE = [
  { bg: '#DBEAFE', fg: '#1E40AF' },
  { bg: '#DCF2E8', fg: '#065F46' },
  { bg: '#EDE9FE', fg: '#5B21B6' },
  { bg: '#FFE4E6', fg: '#9F1239' },
  { bg: '#FEF3C7', fg: '#92400E' },
  { bg: '#E0F2FE', fg: '#0369A1' },
  { bg: '#ECFCCB', fg: '#365314' },
  { bg: '#FEF9C3', fg: '#713F12' },
];

function deptColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return DEPT_PALETTE[h % DEPT_PALETTE.length];
}

// ─── Hospital Card ────────────────────────────────────────────────────────────

function HospitalResultCard({ item, onPress }: { item: HospitalListItem; onPress: () => void }) {
  const shown = item.departments.slice(0, 3);
  const extra = item.departments.length - 3;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.cardBody}>
        <View style={styles.thumbWrap}>
          <Image
            source={item.image ?? null}
            style={styles.thumb}
            contentFit="cover"
            transition={250}
          />
          {item.isOpen24x7 && (
            <View style={styles.badge24}>
              <Clock size={8} color="#fff" strokeWidth={2.5} />
              <Text style={styles.badge24Txt}>24×7</Text>
            </View>
          )}
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.hospitalName} numberOfLines={2}>
              {item.name}
            </Text>
            {typeof item.distanceKm === 'number' && (
              <View style={styles.distPill}>
                <MapPin size={9} color={Colors.primary} strokeWidth={2.5} />
                <Text style={styles.distTxt}>{item.distanceKm.toFixed(1)} km</Text>
              </View>
            )}
          </View>

          <View style={styles.addrRow}>
            <MapPin size={10} color={Colors.textLight} strokeWidth={2} />
            <Text style={styles.addrTxt} numberOfLines={1}>
              {item.address}
            </Text>
          </View>

          {/* Phase 1: hospital rating hidden until reviews ship.
              Restore the Star + ratingTxt + reviewTxt block when enabled. */}
          <View style={styles.statsRow}>
            <Users size={11} color={Colors.textSecondary} strokeWidth={2} />
            <Text style={styles.docTxt}>{item.doctorsCount} doctors</Text>
          </View>

          {item.departments.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.deptScroll}
              contentContainerStyle={styles.deptRow}
            >
              {shown.map((d) => {
                const c = deptColor(d);
                return (
                  <View key={d} style={[styles.deptChip, { backgroundColor: c.bg }]}>
                    <Text style={[styles.deptTxt, { color: c.fg }]}>{d}</Text>
                  </View>
                );
              })}
              {extra > 0 && (
                <View style={styles.deptMore}>
                  <Text style={styles.deptMoreTxt}>+{extra}</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NearMeScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { selectedLocation } = useLocation();
  const { lat: latParam, lng: lngParam } = useLocalSearchParams<{
    lat?: string;
    lng?: string;
  }>();

  const effectiveLat =
    selectedLocation?.latitude ?? (latParam ? parseFloat(latParam) : DEFAULT_LAT);
  const effectiveLng =
    selectedLocation?.longitude ?? (lngParam ? parseFloat(lngParam) : DEFAULT_LNG);

  const { data: hospitalsList = [], isLoading } = useNearbyHospitals({
    lat: effectiveLat,
    lng: effectiveLng,
    radius_km: 50,
  });

  // ── Hospital filter state ────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [maxKm, setMaxKm] = useState(0);
  const [open24x7, setOpen24x7] = useState(false);
  const [activeDepts, setActiveDepts] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortKey>('distance');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const allDepts = useMemo(() => {
    const s = new Set<string>();
    hospitalsList.forEach((h) => h.departments.forEach((d) => s.add(d)));
    return Array.from(s).sort();
  }, [hospitalsList]);

  function toggleDept(d: string) {
    setActiveDepts((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  function clearAll() {
    setSearch('');
    setMaxKm(0);
    setOpen24x7(false);
    setActiveDepts(new Set());
    setSortBy('distance');
  }

  const hasFilters = !!search || maxKm > 0 || open24x7 || activeDepts.size > 0;

  const filteredHospitals = useMemo(() => {
    const q = search.toLowerCase();
    let list = hospitalsList.filter((h) => {
      if (
        q &&
        !h.name.toLowerCase().includes(q) &&
        !h.address.toLowerCase().includes(q) &&
        !h.departments.some((d) => d.toLowerCase().includes(q))
      )
        return false;
      if (maxKm > 0 && (h.distanceKm ?? Infinity) > maxKm) return false;
      if (open24x7 && !h.isOpen24x7) return false;
      if (activeDepts.size > 0 && !h.departments.some((d) => activeDepts.has(d))) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'distance') return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      return b.doctorsCount - a.doctorsCount;
    });

    return list;
  }, [hospitalsList, search, maxKm, open24x7, activeDepts, sortBy]);

  const currentSort = SORT_OPTIONS.find((o) => o.key === sortBy)!;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Seo
        title="Hospitals & Clinics Near Me"
        description="Find hospitals and clinics near your location, filter by department and distance — MedQ+."
        path="/nearme"
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={Colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('nearbyHospitals')}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Search size={16} color={Colors.textLight} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search hospitals, departments…"
          placeholderTextColor={Colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={16} color={Colors.textLight} strokeWidth={2} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.filterIconBtn, showFilters && styles.filterIconActive]}
          onPress={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal
            size={16}
            color={showFilters ? Colors.white : Colors.primary}
            strokeWidth={2}
          />
          {hasFilters && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Filter panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Distance</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRow}>
              {DISTANCE_CHIPS.map((c) => (
                <TouchableOpacity
                  key={c.km}
                  style={[styles.chip, maxKm === c.km && styles.chipActive]}
                  onPress={() => setMaxKm(c.km)}
                >
                  <Text style={[styles.chipTxt, maxKm === c.km && styles.chipTxtActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {allDepts.length > 0 && (
            <>
              <Text style={[styles.filterLabel, { marginTop: 12 }]}>Services</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
              >
                <View style={styles.chipRow}>
                  {allDepts.map((d) => {
                    const active = activeDepts.has(d);
                    const c = deptColor(d);
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.chip,
                          active && { backgroundColor: c.bg, borderColor: c.fg },
                        ]}
                        onPress={() => toggleDept(d)}
                      >
                        <Text
                          style={[styles.chipTxt, active && { color: c.fg, fontWeight: '700' }]}
                        >
                          {d}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </>
          )}

          <TouchableOpacity
            style={[styles.toggleRow, open24x7 && styles.toggleRowActive]}
            onPress={() => setOpen24x7((v) => !v)}
          >
            <Clock
              size={14}
              color={open24x7 ? Colors.primary : Colors.textSecondary}
              strokeWidth={2}
            />
            <Text style={[styles.toggleTxt, open24x7 && styles.toggleTxtActive]}>
              Open 24×7 only
            </Text>
            <View style={[styles.toggleSwitch, open24x7 && styles.toggleSwitchOn]}>
              <View style={[styles.toggleThumb, open24x7 && styles.toggleThumbOn]} />
            </View>
          </TouchableOpacity>

          {hasFilters && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
              <X size={12} color={Colors.accent} strokeWidth={2.5} />
              <Text style={styles.clearTxt}>Clear all filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Results bar */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultCount}>
          {isLoading
            ? 'Loading…'
            : `${filteredHospitals.length} hospital${filteredHospitals.length !== 1 ? 's' : ''}`}
        </Text>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSort((v) => !v)}>
          <Text style={styles.sortTxt}>Sort: {currentSort.label}</Text>
          <ChevronDown size={13} color={Colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {showSort && (
        <View style={styles.sortDropdown}>
          {SORT_OPTIONS.map((o) => (
            <TouchableOpacity
              key={o.key}
              style={[styles.sortOption, sortBy === o.key && styles.sortOptionActive]}
              onPress={() => {
                setSortBy(o.key);
                setShowSort(false);
              }}
            >
              <Text style={[styles.sortOptionTxt, sortBy === o.key && styles.sortOptionTxtActive]}>
                {o.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding hospitals near you…</Text>
        </View>
      ) : filteredHospitals.length === 0 ? (
        <View style={styles.centered}>
          <Hospital size={48} color={Colors.textLight} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No hospitals found</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your filters or changing location</Text>
          {hasFilters && (
            <TouchableOpacity style={styles.clearAllBtn} onPress={clearAll}>
              <Text style={styles.clearAllTxt}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredHospitals}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.hospitalList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <HospitalResultCard
              item={item}
              onPress={() =>
                router.push({ pathname: '/hospital/[id]', params: { id: String(item.id) } })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  backBtn: { padding: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  headerSpacer: { width: 32 },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 2,
      opacity: 0.06,
      radius: 8,
      elevation: 2,
    }),
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, padding: 0 },
  filterIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
  },
  filterIconActive: { backgroundColor: Colors.primary },
  filterDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },

  // Filter panel
  filterPanel: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 4,
      opacity: 0.08,
      radius: 12,
      elevation: 4,
    }),
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipScroll: { marginHorizontal: -4 },
  chipRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  chipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipTxt: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  chipTxtActive: { color: Colors.primary, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  toggleRowActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  toggleTxt: { flex: 1, fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  toggleTxtActive: { color: Colors.primary, fontWeight: '700' },
  toggleSwitch: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    padding: 2,
  },
  toggleSwitchOn: { backgroundColor: Colors.primary },
  toggleThumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.white },
  toggleThumbOn: { alignSelf: 'flex-end' },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  clearTxt: { fontSize: 12, color: Colors.accent, fontWeight: '700' },

  // Results bar / sort
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultCount: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortTxt: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  sortDropdown: {
    position: 'absolute',
    top: 170,
    right: 16,
    zIndex: 999,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 8,
      opacity: 0.15,
      radius: 16,
      elevation: 8,
    }),
  },
  sortOption: { paddingHorizontal: 20, paddingVertical: 12 },
  sortOptionActive: { backgroundColor: Colors.primaryLight },
  sortOptionTxt: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  sortOptionTxtActive: { color: Colors.primary, fontWeight: '800' },

  // Hospital card
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 4,
      opacity: 0.1,
      radius: 14,
      elevation: 5,
    }),
  },
  cardBody: { flexDirection: 'row', padding: 14 },
  thumbWrap: { marginRight: 14 },
  thumb: { width: 80, height: 80, borderRadius: 14, backgroundColor: Colors.borderLight },
  badge24: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    marginHorizontal: 4,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    justifyContent: 'center',
  },
  badge24Txt: { fontSize: 8, color: Colors.white, fontWeight: '800' },
  cardDetails: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  hospitalName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    flex: 1,
    marginRight: 6,
    lineHeight: 19,
  },
  distPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 1,
  },
  distTxt: { fontSize: 11, color: Colors.primary, fontWeight: '700' },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  addrTxt: { fontSize: 11, color: Colors.textSecondary, flex: 1 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  docTxt: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  deptScroll: { flexGrow: 0 },
  deptRow: { flexDirection: 'row', gap: 6 },
  deptChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  deptTxt: { fontSize: 10, fontWeight: '700' },
  deptMore: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.borderLight,
  },
  deptMoreTxt: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },

  // States
  hospitalList: { paddingTop: 4, paddingBottom: 24 },
  loadingText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginTop: 8 },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19 },
  clearAllBtn: {
    marginTop: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  clearAllTxt: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
});
