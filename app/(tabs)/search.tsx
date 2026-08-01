import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Search as SearchIcon,
  Hospital,
  SlidersHorizontal,
  Star,
  IndianRupee,
  Frown,
  Clock,
  Mic,
} from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CategoryCard from '../../components/CategoryCard';
import LocalizedName from '../../components/LocalizedName';
import LogoHeader from '../../components/LogoHeader';
import SkeletonCard from '../../components/SkeletonCard';
import HoverLift from '../../components/web/HoverLift';
import Seo from '../../components/web/Seo';
import WebFooter from '../../components/web/WebFooter';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation } from '../../context/LocationContext';
import { useHospitals, useNearbyDoctors } from '../../hooks/useApiHooks';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';
import type { DoctorListItem } from '../../services/doctorService';
import type { HospitalListItem } from '../../services/hospitalService';
import { isAvailableToday } from '../../utils/availability';
import { formatShortCredential } from '../../utils/doctorCredential';
import { matchDoctors, matchHospitals, matchedSpecializations } from '../../utils/fuzzySearch';
import { categories, diseaseMapping } from '../../utils/mockData';
import { crossPlatformShadow } from '../../utils/shadow';

// ─── Sort options ─────────────────────────────────────────────────────────

type SortKey = 'rating' | 'distance' | 'experience' | 'fee';

const SORT_OPTIONS: { key: SortKey; labelKey: string }[] = [
  { key: 'rating', labelKey: 'sortTopRated' },
  { key: 'distance', labelKey: 'sortNearest' },
  { key: 'experience', labelKey: 'sortMostExperience' },
  { key: 'fee', labelKey: 'sortLowFee' },
];

// ─── Fee presets ──────────────────────────────────────────────────────────
// `labelKey` runs through t(); when absent the literal `label` is shown as-is
// (numeric ranges are language-agnostic).

const FEE_PRESETS: { label: string; labelKey?: string; min: number; max: number }[] = [
  { label: 'Any fee', labelKey: 'feeAny', min: 0, max: Infinity },
  { label: '< ₹300', min: 0, max: 299 },
  { label: '₹300–600', min: 300, max: 600 },
  { label: '₹600–1000', min: 601, max: 1000 },
  { label: '> ₹1000', min: 1001, max: Infinity },
];

// ─── Screen ───────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { selectedLocation } = useLocation();
  // Seed the query from the hero search box (/search?q=fever).
  const { q: qParam } = useLocalSearchParams<{ q?: string }>();
  // Result cards flow into 2 (md) / 3 (lg) columns on wide screens (web).
  const { select } = useBreakpoint();
  const resultColumns = select({ sm: 1, md: 2, lg: 3 });

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  React.useEffect(() => {
    if (qParam) {
      setQuery(String(qParam));
      setSelectedCategory(null);
    }
  }, [qParam]);
  const [sortKey, setSortKey] = useState<SortKey>('rating');
  const [feePresetIdx, setFeePresetIdx] = useState(0); // 0 = "Any fee"
  const [showFilters, setShowFilters] = useState(false);

  const gpsCoords = selectedLocation
    ? { lat: selectedLocation.latitude, lng: selectedLocation.longitude, radius_km: 25, size: 100 }
    : null;

  const { data: allDoctors = [], isLoading: doctorsLoading } = useNearbyDoctors(gpsCoords);
  const { data: allHospitals = [] } = useHospitals();

  const {
    isAvailable: voiceAvailable,
    isListening,
    partialTranscript,
    error: voiceError,
    toggle: toggleVoice,
  } = useVoiceSearch({
    onResult: (transcript) => {
      setQuery(transcript);
      setSelectedCategory(null);
    },
  });

  const feePreset = FEE_PRESETS[feePresetIdx];
  const activeFilterCount = (sortKey !== 'rating' ? 1 : 0) + (feePresetIdx !== 0 ? 1 : 0);

  // ── Client-side filter + sort ─────────────────────────────────────────
  const filteredDoctors = useMemo(() => {
    let result = allDoctors;

    // Category filter
    if (selectedCategory) {
      result = result.filter(
        (d) =>
          d.specialization?.toUpperCase().replace(/[\s-]+/g, '_') ===
            selectedCategory.toUpperCase() ||
          d.specialization?.toLowerCase().includes(selectedCategory.toLowerCase()),
      );
    }

    // Disease / text search — fuzzy via Fuse.js so "fevr", "cogh", "Shrma"
    // still resolve to the right doctors.
    if (query.length >= 2) {
      const matchedSpecs = matchedSpecializations(query, diseaseMapping);
      const normalizeSpec = (s: string) => s.toLowerCase().replace(/[\s-]+/g, '');
      const fuzzyHits = matchDoctors(query, result);
      // Fuse already ranks by score; union with specialization expansion so a
      // disease typo still surfaces every doctor in the relevant specialty,
      // even if the doctor's name doesn't fuzz-match the query directly.
      const seen = new Set(fuzzyHits.map((d) => d.id));
      const specExpansion = matchedSpecs.size
        ? result.filter(
            (d) => !seen.has(d.id) && matchedSpecs.has(normalizeSpec(d.specialization || '')),
          )
        : [];
      result = [...fuzzyHits, ...specExpansion];
    }

    // Fee range filter
    if (feePreset.min > 0 || feePreset.max !== Infinity) {
      result = result.filter((d) => {
        const fee = d.consultationFee ?? 0;
        return fee >= feePreset.min && fee <= feePreset.max;
      });
    }

    // Sort — when a fuzzy query is active and the user hasn't picked an
    // explicit sort (sortKey === 'rating' is the default), preserve Fuse's
    // relevance order so the closest typo match shows first.
    const isFuzzyDefault = query.length >= 2 && sortKey === 'rating';
    if (!isFuzzyDefault) {
      switch (sortKey) {
        case 'distance':
          result = [...result].sort(
            (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
          );
          break;
        case 'experience':
          result = [...result].sort((a, b) => (b.experience ?? 0) - (a.experience ?? 0));
          break;
        case 'fee':
          result = [...result].sort((a, b) => (a.consultationFee ?? 0) - (b.consultationFee ?? 0));
          break;
        default: // 'rating'
          result = [...result].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      }
    }

    return result;
  }, [allDoctors, selectedCategory, query, sortKey, feePreset]);

  // Fuzzy-matched hospitals — only populated while a search is active.
  const filteredHospitals = useMemo<HospitalListItem[]>(() => {
    if (query.length < 2) return [];
    return matchHospitals(query, allHospitals);
  }, [allHospitals, query]);

  // Fallback for empty results: the 3 nearest doctors regardless of filters —
  // an empty state is where a patient gives up; give them a next step.
  const nearestFallback = useMemo(() => {
    if (filteredDoctors.length > 0) return [];
    return [...allDoctors]
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
      .slice(0, 3);
  }, [filteredDoctors.length, allDoctors]);

  const isSearching = query.length >= 2;
  const selectedCategoryName = selectedCategory
    ? categories.find((c) => c.nameKey === selectedCategory)?.nameKey || ''
    : '';

  const handleCategoryPress = (nameKey: string) => {
    setQuery('');
    setSelectedCategory(selectedCategory === nameKey ? null : nameKey);
  };

  const clearAll = () => {
    setQuery('');
    setSelectedCategory(null);
    setSortKey('rating');
    setFeePresetIdx(0);
  };

  const hasActiveFilters = query.length > 0 || selectedCategory || activeFilterCount > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Seo
        title="Search Doctors by Specialty, Disease, or Name"
        description="Search doctors and hospitals by specialization, disease, or name — filter by fee, distance, and rating on MedQ+."
        path="/search"
      />
      <LogoHeader />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <SearchIcon size={20} color={Colors.text} strokeWidth={2.5} />
          <Text style={styles.headerTitle}>{t('search')}</Text>
        </View>
        <Text style={styles.headerSub}>{t('searchHint')}</Text>
      </View>

      {/* Search bar + Filter toggle */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <SearchIcon size={16} color={Colors.textLight} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder={
                voiceAvailable && isListening
                  ? partialTranscript || 'Listening…'
                  : t('searchDoctorDisease')
              }
              placeholderTextColor={
                voiceAvailable && isListening ? Colors.primary : Colors.textLight
              }
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                if (text.length > 0) setSelectedCategory(null);
              }}
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={toggleVoice}
              style={[
                styles.micBtn,
                !voiceAvailable && styles.micBtnDisabled,
                isListening && styles.micBtnActive,
              ]}
              accessibilityLabel={
                !voiceAvailable
                  ? 'Voice search unavailable in Expo Go'
                  : isListening
                    ? 'Stop voice search'
                    : 'Start voice search'
              }
              accessibilityRole="button"
            >
              <Mic
                size={16}
                color={
                  isListening ? Colors.white : voiceAvailable ? Colors.primary : Colors.textLight
                }
                strokeWidth={2.5}
              />
            </TouchableOpacity>
            {hasActiveFilters && (
              <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
                <Text style={styles.clearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filter toggle button */}
          <TouchableOpacity
            onPress={() => setShowFilters((v) => !v)}
            style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
          >
            <SlidersHorizontal
              size={16}
              color={showFilters ? Colors.white : Colors.primary}
              strokeWidth={2.5}
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {voiceError && <Text style={styles.voiceError}>{voiceError}</Text>}

        {/* Expandable filter panel */}
        {showFilters && (
          <View style={styles.filterPanel}>
            {/* Sort */}
            <Text style={styles.filterLabel}>{t('sortBy')}</Text>
            <View style={styles.chipRow}>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setSortKey(opt.key)}
                  style={[styles.chip, sortKey === opt.key && styles.chipActive]}
                >
                  <Text style={[styles.chipText, sortKey === opt.key && styles.chipTextActive]}>
                    {t(opt.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Fee range */}
            <Text style={[styles.filterLabel, { marginTop: 10 }]}>{t('feeRange')}</Text>
            <View style={styles.chipRow}>
              {FEE_PRESETS.map((preset, idx) => (
                <TouchableOpacity
                  key={preset.label}
                  onPress={() => setFeePresetIdx(idx)}
                  style={[styles.chip, feePresetIdx === idx && styles.chipActive]}
                >
                  <Text style={[styles.chipText, feePresetIdx === idx && styles.chipTextActive]}>
                    {preset.labelKey ? t(preset.labelKey) : preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('browseByCategory')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                icon={cat.icon}
                nameKey={cat.nameKey}
                color={selectedCategory === cat.nameKey ? Colors.primary : cat.color}
                isSelected={selectedCategory === cat.nameKey}
                onPress={() => handleCategoryPress(cat.nameKey)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Loading */}
        {doctorsLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('loading')}</Text>
            <SkeletonCard variant="row" />
            <SkeletonCard variant="row" />
            <SkeletonCard variant="row" />
          </View>
        )}

        {/* Hospitals — only when actively searching and there are matches. */}
        {!doctorsLoading && isSearching && filteredHospitals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.resultsHeader}>
              <Text style={styles.sectionTitle}>{t('hospitals')}</Text>
              <Text style={styles.resultCount}>
                {filteredHospitals.length} {t('found')}
              </Text>
            </View>
            <View style={resultColumns > 1 && styles.resultsGrid}>
              {filteredHospitals.map((hospital) => (
                <View
                  key={hospital.id}
                  style={resultColumns > 1 && { width: `${100 / resultColumns - 1.5}%` }}
                >
                  <HoverLift>
                    <HospitalCard
                      hospital={hospital}
                      onPress={() =>
                        router.push({
                          pathname: '/hospital/[id]',
                          params: { id: String(hospital.id) },
                        })
                      }
                    />
                  </HoverLift>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Results */}
        {!doctorsLoading && (
          <View style={styles.section}>
            <View style={styles.resultsHeader}>
              <Text style={styles.sectionTitle}>
                {isSearching
                  ? `Doctors matching "${query}"`
                  : selectedCategory
                    ? `${t(selectedCategoryName)} ${t('categoryDoctors')}`
                    : 'All Nearby Doctors'}
              </Text>
              <Text style={styles.resultCount}>
                {filteredDoctors.length} {t('doctorsFound')}
              </Text>
            </View>

            {/* Active filter summary */}
            {(sortKey !== 'rating' || feePresetIdx !== 0) && (
              <View style={styles.activeSummary}>
                {sortKey !== 'rating' && (
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>
                      {(() => {
                        const opt = SORT_OPTIONS.find((o) => o.key === sortKey);
                        return opt ? t(opt.labelKey) : '';
                      })()}
                    </Text>
                  </View>
                )}
                {feePresetIdx !== 0 && (
                  <View style={styles.activePill}>
                    <IndianRupee size={10} color={Colors.primary} strokeWidth={2.5} />
                    <Text style={styles.activePillText}>
                      {FEE_PRESETS[feePresetIdx].labelKey
                        ? t(FEE_PRESETS[feePresetIdx].labelKey as string)
                        : FEE_PRESETS[feePresetIdx].label}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {filteredDoctors.length > 0 ? (
              <View style={resultColumns > 1 && styles.resultsGrid}>
                {filteredDoctors.map((doctor) => (
                  <View
                    key={doctor.id}
                    style={resultColumns > 1 && { width: `${100 / resultColumns - 1.5}%` }}
                  >
                    <HoverLift>
                      <DoctorCard
                        doctor={doctor}
                        onPress={() =>
                          router.push({
                            pathname: '/doctor/[id]',
                            params: { id: String(doctor.id) },
                          })
                        }
                      />
                    </HoverLift>
                  </View>
                ))}
              </View>
            ) : (
              // Hide the "no doctors" message when we did surface matching
              // hospitals — the section above already gives the user a result.
              filteredHospitals.length === 0 && (
                <View style={styles.emptyState}>
                  <Frown size={40} color={Colors.textLight} strokeWidth={1.5} />
                  <Text style={styles.emptyTitle}>{t('noMatches')}</Text>
                  <Text style={styles.emptyDesc}>
                    {feePresetIdx !== 0 ? t('wideFeeHint') : t('spellingsOkHint')}
                  </Text>
                  <TouchableOpacity style={styles.clearFiltersBtn} onPress={clearAll}>
                    <Text style={styles.clearFiltersTxt}>Clear filters & search</Text>
                  </TouchableOpacity>

                  {/* Never a dead end: surface the nearest doctors who can at
                      least see the patient and refer onward. */}
                  {nearestFallback.length > 0 && (
                    <View style={styles.fallbackBlock}>
                      <Text style={styles.fallbackTitle}>
                        Nearby doctors you can consult instead
                      </Text>
                      {nearestFallback.map((doctor) => (
                        <DoctorCard
                          key={doctor.id}
                          doctor={doctor}
                          onPress={() =>
                            router.push({
                              pathname: '/doctor/[id]',
                              params: { id: String(doctor.id) },
                            })
                          }
                        />
                      ))}
                    </View>
                  )}
                </View>
              )
            )}
          </View>
        )}

        <View style={{ height: 24 }} />
        <WebFooter style={styles.footerBleed} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Doctor card ──────────────────────────────────────────────────────────

function DoctorCard({ doctor, onPress }: { doctor: DoctorListItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.doctorCard} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: doctor.photo }} style={styles.doctorImage} />

      <View style={styles.doctorInfo}>
        <LocalizedName name={doctor.name} style={styles.doctorName} numberOfLines={1} />
        <Text style={styles.doctorSpec}>{doctor.specialization}</Text>

        <View style={styles.doctorStatsRow}>
          {/* Social proof when it exists; never an empty/zero rating */}
          {typeof doctor.rating === 'number' && doctor.rating > 0 && (
            <>
              <Star size={11} color={Colors.gold} fill={Colors.gold} strokeWidth={0} />
              <Text style={styles.doctorStar}>{doctor.rating.toFixed(1)} · </Text>
            </>
          )}
          {formatShortCredential(doctor.degree) !== '' && (
            <Text style={styles.doctorStar}>{formatShortCredential(doctor.degree)}</Text>
          )}
          {doctor.experience > 0 && (
            <Text style={styles.doctorMeta}> · {doctor.experience}yr exp</Text>
          )}
          {doctor.distanceKm != null && (
            <Text style={styles.doctorDist}> · {doctor.distanceKm.toFixed(1)}km</Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Hospital size={11} color={Colors.textLight} strokeWidth={2} />
          <LocalizedName
            name={doctor.hospitalName}
            style={styles.doctorHospital}
            numberOfLines={1}
          />
        </View>

        {isAvailableToday(doctor.availableDays) && (
          <View style={styles.availableTodayChip}>
            <Text style={styles.availableTodayText}>Available today</Text>
          </View>
        )}
      </View>

      <View style={styles.doctorAction}>
        {doctor.consultationFee != null && (
          <View style={styles.feeTag}>
            <IndianRupee size={10} color={Colors.primary} strokeWidth={2.5} />
            <Text style={styles.feeText}>{doctor.consultationFee}</Text>
          </View>
        )}
        <Text style={styles.bookBtn}>{'Book'}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Hospital card ────────────────────────────────────────────────────────

function HospitalCard({ hospital, onPress }: { hospital: HospitalListItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.hospitalCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.hospitalIconWrap}>
        {hospital.image ? (
          <Image source={{ uri: hospital.image }} style={styles.hospitalImage} />
        ) : (
          <Hospital size={22} color={Colors.primary} strokeWidth={2} />
        )}
      </View>
      <View style={styles.hospitalInfo}>
        <LocalizedName name={hospital.name} style={styles.hospitalName} numberOfLines={1} />
        {hospital.address ? (
          <Text style={styles.hospitalAddr} numberOfLines={1}>
            {hospital.address}
          </Text>
        ) : null}
        <View style={styles.hospitalMetaRow}>
          {hospital.rating > 0 && (
            <>
              <Star size={11} color={Colors.gold} fill={Colors.gold} strokeWidth={0} />
              <Text style={styles.hospitalRating}>{hospital.rating.toFixed(1)}</Text>
            </>
          )}
          {hospital.doctorsCount > 0 && (
            <Text style={styles.hospitalMeta}> · {hospital.doctorsCount} doctors</Text>
          )}
          {hospital.distance ? (
            <Text style={styles.hospitalDist}> · {hospital.distance}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, backgroundColor: Colors.white },
  headerTitle: { fontSize: 24, fontWeight: '900', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textLight, marginTop: 2 },

  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 4,
      opacity: 0.08,
      radius: 12,
      elevation: 5,
    }),
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 13 },
  micBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  micBtnActive: { backgroundColor: Colors.primary },
  micBtnDisabled: { opacity: 0.45 },
  voiceError: { marginTop: 8, fontSize: 12, color: Colors.error, fontWeight: '600' },
  clearBtn: { padding: 6 },
  clearText: { fontSize: 16, color: Colors.textLight, fontWeight: '600' },

  filterToggle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
  },
  filterToggleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: { fontSize: 9, color: Colors.white, fontWeight: '800' },

  filterPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },

  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 14 },
  categoryScroll: { paddingRight: 16, gap: 12 },

  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultCount: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  // Wide screens (web): cards flow into 2–3 columns.
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
    justifyContent: 'flex-start',
  },
  // Footer runs full-bleed past scrollContent's horizontal padding.
  footerBleed: {
    marginHorizontal: -16,
  },

  activeSummary: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  activePillText: { fontSize: 11, color: Colors.primary, fontWeight: '700' },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  loadingText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  clearFiltersBtn: {
    marginTop: 14,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  clearFiltersTxt: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  fallbackBlock: { marginTop: 24, alignSelf: 'stretch' },
  fallbackTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    marginTop: 12,
  },
  emptyDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

  // Doctor card
  doctorCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 3,
      opacity: 0.1,
      radius: 12,
      elevation: 4,
    }),
  },
  doctorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.borderLight,
    marginRight: 12,
  },
  doctorInfo: { flex: 1, justifyContent: 'center' },
  doctorName: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  doctorSpec: { fontSize: 12, color: Colors.primary, fontWeight: '700', marginBottom: 4 },
  doctorStatsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  doctorStar: { fontSize: 12, color: Colors.gold, fontWeight: '700', marginLeft: 2 },
  doctorMeta: { fontSize: 11, color: Colors.textSecondary },
  doctorDist: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  doctorHospital: { fontSize: 11, color: Colors.textLight },
  availableTodayChip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.trustGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  availableTodayText: { fontSize: 10, fontWeight: '800', color: Colors.trustGreen },

  doctorAction: { justifyContent: 'center', alignItems: 'center', marginLeft: 8, gap: 6 },
  feeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  feeText: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  bookBtn: {
    backgroundColor: Colors.primary,
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },

  // Hospital card
  hospitalCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 3,
      opacity: 0.08,
      radius: 10,
      elevation: 3,
    }),
  },
  hospitalIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  hospitalImage: { width: '100%', height: '100%' },
  hospitalInfo: { flex: 1, justifyContent: 'center' },
  hospitalName: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  hospitalAddr: { fontSize: 12, color: Colors.textLight, marginBottom: 4 },
  hospitalMetaRow: { flexDirection: 'row', alignItems: 'center' },
  hospitalRating: { fontSize: 12, color: Colors.gold, fontWeight: '700', marginLeft: 2 },
  hospitalMeta: { fontSize: 11, color: Colors.textSecondary },
  hospitalDist: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
});
