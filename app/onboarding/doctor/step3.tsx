/**
 * Doctor Onboarding Step 3 — Link Hospitals & Availability
 */
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, MapPin, X, Building2, Star, Plus } from 'lucide-react-native';
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../../components/Button';
import Input from '../../../components/Input';
import AvailabilityBuilder from '../../../components/onboarding/AvailabilityBuilder';
import StepProgressBar from '../../../components/onboarding/StepProgressBar';
import { Colors } from '../../../constants/Colors';
import hospitalService from '../../../services/hospitalService';
import onboardingService from '../../../services/onboardingService';
import {
  useDoctorOnboardingStore,
  type LinkedHospital,
} from '../../../store/doctorOnboardingStore';
import { crossPlatformShadow } from '../../../utils/shadow';

import { formColumn } from '@/theme';

const STEP_LABELS = ['Profile', 'Details', 'Hospitals', 'Review'];

interface HospitalSearchResult {
  id: string;
  name: string;
  address: string;
  rating: number;
}

export default function DoctorStep3() {
  const router = useRouter();
  const store = useDoctorOnboardingStore();
  const {
    linkedHospitals,
    addLinkedHospital,
    removeLinkedHospital,
    updateHospitalAvailability,
    completedSteps,
  } = store;
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HospitalSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [selectedResult, setSelectedResult] = useState<HospitalSearchResult | null>(null);
  const [linkFee, setLinkFee] = useState(store.profile.consultationFee);
  const [linkRoom, setLinkRoom] = useState('');
  const [linkPrimary, setLinkPrimary] = useState(linkedHospitals.length === 0);

  // Refs used by the "Link Another Hospital" CTA to bounce the user back to the
  // search field after they've already linked one — saves them scrolling.
  const scrollRef = useRef<ScrollView>(null);
  const searchInputRef = useRef<TextInput>(null);
  const focusSearch = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    setTimeout(() => searchInputRef.current?.focus(), 250);
  };
  const hasLinked = linkedHospitals.length > 0;

  const searchHospitals = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await hospitalService.getAll({ search: query });
      setSearchResults(
        results.map((h) => ({
          id: h.id,
          name: h.name,
          address: h.address,
          rating: h.rating,
        })),
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    searchHospitals(text);
  };

  const selectHospital = (hospital: HospitalSearchResult) => {
    if (linkedHospitals.some((h) => h.hospitalId === hospital.id)) {
      Alert.alert('Already Added', 'This hospital is already linked to your profile.');
      return;
    }
    setSelectedResult(hospital);
    setLinkFee(store.profile.consultationFee);
    setLinkRoom('');
    setLinkPrimary(linkedHospitals.length === 0);
    setShowBottomSheet(true);
  };

  const confirmLink = () => {
    if (!selectedResult) return;
    const newHospital: LinkedHospital = {
      hospitalId: selectedResult.id,
      hospitalName: selectedResult.name,
      address: selectedResult.address,
      consultationFee: linkFee,
      roomNumber: linkRoom,
      isPrimary: linkPrimary,
      availability: [],
    };
    addLinkedHospital(newHospital);
    setShowBottomSheet(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Backend expects a flat list of AvailabilityDto, one row per session per day
  const DAY_TO_INT: Record<string, number> = {
    SUN: 0,
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    FRI: 5,
    SAT: 6,
  };

  const handleSaveAndContinue = async () => {
    if (linkedHospitals.length === 0) {
      Alert.alert('Required', 'Please link at least one hospital.');
      return;
    }
    setLoading(true);
    try {
      await onboardingService.saveDoctorHospitals({
        hospitals: linkedHospitals.map((h) => ({
          hospitalId: h.hospitalId,
          consultationFee: Number(h.consultationFee) || 0,
          roomNumber: h.roomNumber || undefined,
          isPrimary: h.isPrimary,
          // Flatten day+sessions[] → flat AvailabilityEntryPayload[] (skip empty days)
          availability: h.availability.flatMap((a) =>
            a.sessions.map((s) => ({
              dayOfWeek: DAY_TO_INT[a.day] ?? 1,
              sessionName: s.sessionName,
              sessionType: s.sessionType,
              startTime: s.startTime,
              endTime: s.endTime,
              slotDurationMinutes: s.slotDurationMinutes,
              maxPatientsPerSlot: s.maxPatientsPerSlot,
            })),
          ),
        })),
      });
      store.markStepCompleted(3);
      store.setCurrentStep(4);
      router.push('/onboarding/doctor/step4');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save hospitals';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Link Hospitals</Text>
        <View style={{ width: 32 }} />
      </View>

      <StepProgressBar
        currentStep={3}
        totalSteps={4}
        labels={STEP_LABELS}
        completedSteps={completedSteps}
        onStepPress={(step) => router.push(`/onboarding/doctor/step${step}` as never)}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hospital Search */}
        <Text style={styles.sectionTitle}>
          {hasLinked ? 'Link Another Hospital' : 'Search & Link Hospitals'}
        </Text>
        {hasLinked && (
          <Text style={styles.sectionHint}>
            You can practice at multiple hospitals — search below to add another.
          </Text>
        )}
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textLight} strokeWidth={2} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder={
              hasLinked ? 'Search to add another hospital…' : 'Search hospitals by name...'
            }
            placeholderTextColor={Colors.textLight}
          />
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.resultsList}>
            {searchResults.map((hospital) => (
              <TouchableOpacity
                key={hospital.id}
                style={styles.resultItem}
                onPress={() => selectHospital(hospital)}
              >
                <Building2 size={18} color={Colors.primary} strokeWidth={2} />
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{hospital.name}</Text>
                  <View style={styles.resultMeta}>
                    <MapPin size={12} color={Colors.textSecondary} strokeWidth={2} />
                    <Text style={styles.resultAddress} numberOfLines={1}>
                      {hospital.address}
                    </Text>
                  </View>
                </View>
                {hospital.rating > 0 && (
                  <View style={styles.ratingBadge}>
                    <Star size={12} color="#F5A623" fill="#F5A623" strokeWidth={0} />
                    <Text style={styles.ratingText}>{hospital.rating.toFixed(1)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {searching && <Text style={styles.searchingText}>Searching...</Text>}

        {/* No-match empty state — shown after a search returns nothing */}
        {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
          <View style={styles.emptyMatch}>
            <Building2 size={28} color={Colors.textLight} strokeWidth={1.5} />
            <Text style={styles.emptyMatchTitle}>No hospital matches "{searchQuery}"</Text>
            <Text style={styles.emptyMatchHint}>
              If your hospital isn't listed yet, register it now.
            </Text>
          </View>
        )}

        {/* Add Hospital CTA — always visible so doctors can register a new hospital
            without leaving onboarding. State is persisted in Zustand, so they can
            come back to this step seamlessly. */}
        <TouchableOpacity
          style={styles.addHospitalBtn}
          onPress={() => router.push('/onboarding/hospital/step1')}
          activeOpacity={0.75}
        >
          <View style={styles.addHospitalIcon}>
            <Plus size={16} color={Colors.primary} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addHospitalTitle}>Add Hospital</Text>
            <Text style={styles.addHospitalSub}>Can't find your hospital? Register it.</Text>
          </View>
        </TouchableOpacity>

        {/* Linked Hospitals */}
        {linkedHospitals.length > 0 && (
          <>
            <View style={styles.linkedHeaderRow}>
              <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 4 }]}>
                Linked Hospitals ({linkedHospitals.length})
              </Text>
            </View>
            <Text style={styles.linkedListHint}>
              Add as many hospitals as you practice at. Each gets its own fee and schedule.
            </Text>
            {linkedHospitals.map((hospital) => {
              // Sessions at OTHER linked hospitals on the same day — blocks the
              // doctor from configuring overlapping sessions across hospitals.
              const crossHospitalBusy: Record<
                string,
                { hospitalName: string; sessionName: string; startTime: string; endTime: string }[]
              > = {};
              linkedHospitals
                .filter((other) => other.hospitalId !== hospital.hospitalId)
                .forEach((other) => {
                  other.availability.forEach((dayAvail) => {
                    dayAvail.sessions.forEach((s) => {
                      (crossHospitalBusy[dayAvail.day] ??= []).push({
                        hospitalName: other.hospitalName,
                        sessionName: s.sessionName,
                        startTime: s.startTime,
                        endTime: s.endTime,
                      });
                    });
                  });
                });

              return (
                <View key={hospital.hospitalId} style={styles.linkedCard}>
                  <View style={styles.linkedHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.linkedName}>{hospital.hospitalName}</Text>
                      <Text style={styles.linkedAddress}>{hospital.address}</Text>
                      <Text style={styles.linkedFee}>₹{hospital.consultationFee}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeLinkedHospital(hospital.hospitalId)}
                      style={styles.removeBtn}
                    >
                      <X size={18} color={Colors.error} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                  {hospital.isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryText}>Primary Hospital</Text>
                    </View>
                  )}
                  {/* Availability Builder */}
                  <AvailabilityBuilder
                    hospitalName={hospital.hospitalName}
                    availability={hospital.availability}
                    onChange={(avail) => updateHospitalAvailability(hospital.hospitalId, avail)}
                    crossHospitalBusy={crossHospitalBusy}
                  />
                </View>
              );
            })}

            {/* Footer CTA — explicit signal that more hospitals can be linked. */}
            <TouchableOpacity
              style={styles.linkAnotherBtn}
              onPress={focusSearch}
              activeOpacity={0.8}
            >
              <View style={styles.linkAnotherIcon}>
                <Plus size={16} color={Colors.primary} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkAnotherTitle}>Link Another Hospital</Text>
                <Text style={styles.linkAnotherSub}>
                  Tap to search and add another hospital you practice at.
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* Navigation */}
        <View style={styles.navRow}>
          <Button
            title="Back"
            variant="outline"
            onPress={() => router.back()}
            style={styles.navBtn}
          />
          <Button
            title="Save & Continue"
            onPress={handleSaveAndContinue}
            loading={loading}
            disabled={loading}
            style={{ ...styles.navBtn, flex: 2 }}
          />
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Sheet for hospital linking */}
      <Modal visible={showBottomSheet} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Link Hospital</Text>
              <TouchableOpacity onPress={() => setShowBottomSheet(false)}>
                <X size={22} color={Colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            {selectedResult && (
              <>
                <Text style={styles.modalHospitalName}>{selectedResult.name}</Text>
                <Text style={styles.modalHospitalAddr}>{selectedResult.address}</Text>
                <Input
                  label="Consultation Fee at this Hospital (₹)"
                  value={linkFee}
                  onChangeText={(v) => setLinkFee(v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholder="500"
                />
                <Input
                  label="Room / OPD Number (Optional)"
                  value={linkRoom}
                  onChangeText={setLinkRoom}
                  placeholder="e.g., Room 203"
                />
                <TouchableOpacity
                  style={styles.primaryToggle}
                  onPress={() => setLinkPrimary(!linkPrimary)}
                >
                  <View style={[styles.checkbox, linkPrimary && styles.checkboxChecked]} />
                  <Text style={styles.primaryToggleText}>Set as Primary Hospital</Text>
                </TouchableOpacity>
                <Button title="Confirm & Link" onPress={confirmLink} style={{ marginTop: 12 }} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    ...formColumn,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    ...crossPlatformShadow({ offsetY: 2, opacity: 0.08, radius: 8, elevation: 3 }),
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  scroll: { flex: 1 },
  scrollContent: { ...formColumn, padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  sectionHint: { fontSize: 12, color: Colors.textSecondary, marginBottom: 10, marginTop: -4 },
  linkedHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkedListHint: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },
  linkAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary + '55',
    borderStyle: 'dashed',
    marginTop: 4,
    marginBottom: 8,
  },
  linkAnotherIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  linkAnotherTitle: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  linkAnotherSub: { fontSize: 12, color: Colors.primary, opacity: 0.75, marginTop: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  resultsList: {
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    marginBottom: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  resultAddress: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#D97706' },
  searchingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  emptyMatch: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 6,
    marginBottom: 10,
  },
  emptyMatchTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  emptyMatchHint: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  addHospitalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    marginTop: 4,
    marginBottom: 8,
  },
  addHospitalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  addHospitalTitle: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  addHospitalSub: { fontSize: 12, color: Colors.primary, opacity: 0.7, marginTop: 1 },
  linkedCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...crossPlatformShadow({ offsetY: 2, opacity: 0.06, radius: 8, elevation: 2 }),
  },
  linkedHeader: { flexDirection: 'row', marginBottom: 8 },
  linkedName: { fontSize: 15, fontWeight: '800', color: Colors.text },
  linkedAddress: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  linkedFee: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginTop: 4 },
  removeBtn: { padding: 4 },
  primaryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  navBtn: { flex: 1 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  modalHospitalName: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  modalHospitalAddr: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },
  primaryToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  primaryToggleText: { fontSize: 14, fontWeight: '600', color: Colors.text },
});
