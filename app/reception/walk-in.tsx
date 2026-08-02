import { useRouter } from 'expo-router';
import {
  ChevronRight,
  Building2,
  Stethoscope,
  Clock,
  CheckCircle,
  UserCheck,
  UserX,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../components/Button';
import { Colors } from '../../constants/Colors';
import doctorService, { type TimeSlot } from '../../services/doctorService';
import receptionService, {
  type CreateWalkInResponse,
  type PatientLookupResult,
  type ReceptionDoctorItem,
  type ReceptionHospitalItem,
} from '../../services/receptionService';
import { getApiErrorMessage } from '../../utils/apiError';

import { formColumn } from '@/theme';

type LookupState = 'idle' | 'loading' | 'found' | 'not_found';

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

export default function WalkInRegistrationScreen() {
  const router = useRouter();

  const [hospitals, setHospitals] = useState<ReceptionHospitalItem[]>([]);
  const [hospital, setHospital] = useState<ReceptionHospitalItem | null>(null);
  const [loadingHospitals, setLoadingHospitals] = useState(true);

  const [doctors, setDoctors] = useState<ReceptionDoctorItem[]>([]);
  const [doctor, setDoctor] = useState<ReceptionDoctorItem | null>(null);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const dates = nextDays(4);
  const [date, setDate] = useState<string>(todayIso());

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slot, setSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [digits, setDigits] = useState('');
  const [lookupState, setLookupState] = useState<LookupState>('idle');
  const [foundPatient, setFoundPatient] = useState<PatientLookupResult | null>(null);
  const [patientName, setPatientName] = useState('');
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<CreateWalkInResponse | null>(null);

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

  useEffect(() => {
    if (!hospital) {
      setDoctors([]);
      setDoctor(null);
      return;
    }
    setLoadingDoctors(true);
    receptionService
      .doctorsAtHospital(hospital.hospitalId)
      .then((list) => {
        setDoctors(list);
        if (list.length === 1) setDoctor(list[0]);
      })
      .catch(() => {})
      .finally(() => setLoadingDoctors(false));
  }, [hospital]);

  useEffect(() => {
    if (!doctor || !date) {
      setSlots([]);
      setSlot(null);
      return;
    }
    setLoadingSlots(true);
    setSlot(null);
    doctorService
      .getAvailableSlots(doctor.doctorId, date)
      .then((response) => {
        const flat: TimeSlot[] = response.sessions.flatMap((s) => s.slots);
        setSlots(flat);
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [doctor, date]);

  function handleDigitsChange(text: string) {
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    setDigits(cleaned);
    setFoundPatient(null);
    if (lookupTimer.current) clearTimeout(lookupTimer.current);

    if (cleaned.length === 10) {
      setLookupState('loading');
      lookupTimer.current = setTimeout(async () => {
        try {
          const result = await receptionService.lookupPatient(cleaned);
          if (result) {
            setFoundPatient(result);
            setPatientName(result.name);
            setLookupState('found');
          } else {
            setLookupState('not_found');
          }
        } catch {
          setLookupState('not_found');
        }
      }, 400);
    } else {
      setLookupState('idle');
    }
  }

  async function handleSubmit() {
    if (!hospital || !doctor || !slot) {
      Alert.alert('Incomplete', 'Pick hospital, doctor and time slot.');
      return;
    }
    if (digits.length !== 10) {
      Alert.alert('Invalid phone', 'Enter a valid 10-digit mobile number.');
      return;
    }
    if (lookupState === 'not_found' && !patientName.trim()) {
      Alert.alert('Name required', "Enter the patient's name.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await receptionService.createWalkIn({
        doctorId: doctor.doctorId,
        hospitalId: hospital.hospitalId,
        patientPhone: `+91${digits}`,
        patientName: patientName.trim() || undefined,
        bookingDate: date,
        slotStart: slot.time,
        paymentMethod: 'CASH',
        notes: notes.trim() || undefined,
      });
      setDone(result);
    } catch (e: unknown) {
      Alert.alert(
        'Could not register walk-in',
        getApiErrorMessage(e, 'Failed to register walk-in.'),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetForAnother() {
    setDone(null);
    setDigits('');
    setPatientName('');
    setNotes('');
    setSlot(null);
    setLookupState('idle');
    setFoundPatient(null);
  }

  if (done) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successContainer}>
          <CheckCircle size={64} color={Colors.trustGreen} strokeWidth={1.5} />
          <Text style={styles.successTitle}>Walk-in Registered</Text>
          <View style={styles.refCard}>
            <Text style={styles.refLabel}>Booking Reference</Text>
            <Text style={styles.refValue}>{done.bookingRef}</Text>
          </View>
          <Text style={styles.successDesc}>
            The patient has been checked in immediately and added to the token queue.
            {done.createdNewUser && '\n\nA new patient profile was created with this phone number.'}
          </Text>
          <Button
            title="Done"
            onPress={() => router.back()}
            style={{ marginTop: 24, width: '100%' }}
          />
          <TouchableOpacity style={{ marginTop: 12 }} onPress={resetForAnother}>
            <Text style={styles.linkText}>Register Another</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const canSubmit =
    !!hospital &&
    !!doctor &&
    !!slot &&
    digits.length === 10 &&
    !submitting &&
    (lookupState === 'found' || patientName.trim().length > 0);

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
        <Text style={styles.headerTitle}>Walk-in Registration</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Hospital */}
        <Text style={styles.label}>Hospital</Text>
        {loadingHospitals ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} />
        ) : hospitals.length === 0 ? (
          <Text style={styles.emptyText}>You aren't assigned to any hospital yet.</Text>
        ) : (
          hospitals.map((h) => (
            <TouchableOpacity
              key={h.hospitalId}
              style={[styles.row, hospital?.hospitalId === h.hospitalId && styles.rowSelected]}
              onPress={() => {
                setHospital(h);
                setDoctor(null);
                setSlot(null);
              }}
              activeOpacity={0.8}
            >
              <Building2
                size={18}
                color={
                  hospital?.hospitalId === h.hospitalId ? Colors.primary : Colors.textSecondary
                }
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.rowText,
                  hospital?.hospitalId === h.hospitalId && { color: Colors.primary },
                ]}
              >
                {h.hospitalName}
              </Text>
              {hospital?.hospitalId === h.hospitalId && (
                <CheckCircle size={16} color={Colors.primary} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          ))
        )}

        {/* Doctor */}
        {hospital && (
          <>
            <Text style={[styles.label, { marginTop: 18 }]}>Doctor</Text>
            {loadingDoctors ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} />
            ) : doctors.length === 0 ? (
              <Text style={styles.emptyText}>No doctors at this hospital.</Text>
            ) : (
              doctors.map((d) => (
                <TouchableOpacity
                  key={d.doctorId}
                  style={[styles.row, doctor?.doctorId === d.doctorId && styles.rowSelected]}
                  onPress={() => {
                    setDoctor(d);
                    setSlot(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Stethoscope
                    size={18}
                    color={doctor?.doctorId === d.doctorId ? Colors.primary : Colors.textSecondary}
                    strokeWidth={2}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.rowText,
                        doctor?.doctorId === d.doctorId && { color: Colors.primary },
                      ]}
                    >
                      {d.name}
                    </Text>
                    <Text style={styles.rowSub}>
                      {d.specialization.replace(/_/g, ' ')} · ₹{d.consultationFee}
                    </Text>
                  </View>
                  {doctor?.doctorId === d.doctorId && (
                    <CheckCircle size={16} color={Colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {/* Date */}
        {doctor && (
          <>
            <Text style={[styles.label, { marginTop: 18 }]}>Date</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
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
                    <Text style={[styles.dateChipDay, selected && { color: Colors.white }]}>
                      {day}
                    </Text>
                    <Text style={[styles.dateChipDate, selected && { color: Colors.white }]}>
                      {lbl}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Slots */}
        {doctor && date && (
          <>
            <Text style={[styles.label, { marginTop: 18 }]}>Time Slot</Text>
            {loadingSlots ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} />
            ) : slots.length === 0 ? (
              <Text style={styles.emptyText}>No slots available for this date.</Text>
            ) : (
              <View style={styles.slotsGrid}>
                {slots.map((s) => {
                  const disabled = !s.available || s.isPast;
                  const selected = slot?.id === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      disabled={disabled}
                      onPress={() => setSlot(s)}
                      style={[
                        styles.slotChip,
                        selected && styles.slotChipSelected,
                        disabled && styles.slotChipDisabled,
                      ]}
                    >
                      <Clock
                        size={11}
                        color={
                          selected ? Colors.white : disabled ? Colors.textLight : Colors.primary
                        }
                        strokeWidth={2.5}
                      />
                      <Text
                        style={[
                          styles.slotChipText,
                          selected && { color: Colors.white },
                          disabled && { color: Colors.textLight },
                        ]}
                      >
                        {s.time.split('-')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* Patient phone */}
        {slot && (
          <>
            <Text style={[styles.label, { marginTop: 22 }]}>Patient Phone</Text>
            <View style={[styles.phoneBox, lookupState === 'found' && styles.phoneBoxFound]}>
              <View style={styles.prefix}>
                <Text style={styles.prefixText}>+91</Text>
              </View>
              <View style={styles.phoneDivider} />
              <TextInput
                style={styles.phoneInput}
                placeholder="10-digit mobile number"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="number-pad"
                maxLength={10}
                value={digits}
                onChangeText={handleDigitsChange}
              />
              {lookupState === 'loading' && (
                <ActivityIndicator
                  size="small"
                  color={Colors.primary}
                  style={{ marginRight: 12 }}
                />
              )}
              {lookupState === 'found' && (
                <UserCheck
                  size={18}
                  color={Colors.trustGreen}
                  strokeWidth={2.5}
                  style={{ marginRight: 12 }}
                />
              )}
              {lookupState === 'not_found' && (
                <UserX
                  size={18}
                  color={Colors.textSecondary}
                  strokeWidth={2}
                  style={{ marginRight: 12 }}
                />
              )}
            </View>

            {lookupState === 'found' && foundPatient && (
              <View style={styles.foundCard}>
                <View style={styles.foundAvatar}>
                  <Text style={styles.foundInitial}>
                    {foundPatient.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.foundName}>{foundPatient.name}</Text>
                  <Text style={styles.foundHint}>Existing patient</Text>
                </View>
                <CheckCircle size={18} color={Colors.trustGreen} strokeWidth={2.5} />
              </View>
            )}

            {lookupState === 'not_found' && (
              <>
                <Text style={[styles.subLabel, { marginTop: 12 }]}>Patient Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Full name"
                  placeholderTextColor={Colors.textSecondary}
                  value={patientName}
                  onChangeText={setPatientName}
                />
                <Text style={styles.hint}>
                  No account found — a new patient profile will be created with this phone number.
                </Text>
              </>
            )}
          </>
        )}

        {/* Notes */}
        {slot && (
          <>
            <Text style={[styles.label, { marginTop: 18 }]}>Notes (optional)</Text>
            <TextInput
              style={[styles.textInput, { minHeight: 64, textAlignVertical: 'top' }]}
              placeholder="Reason for visit, symptoms, etc."
              placeholderTextColor={Colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </>
        )}

        <Button
          title={submitting ? 'Registering…' : 'Register Walk-in'}
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    ...formColumn,
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
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  content: { ...formColumn, padding: 16, paddingBottom: 40 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  emptyText: { fontSize: 13, color: Colors.textSecondary, paddingVertical: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.white,
    marginBottom: 8,
  },
  rowSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  rowText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  rowSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.white,
    alignItems: 'center',
    minWidth: 64,
  },
  dateChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateChipDay: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  dateChipDate: { fontSize: 13, fontWeight: '800', color: Colors.text, marginTop: 2 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.white,
  },
  slotChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  slotChipDisabled: {
    backgroundColor: Colors.background,
    borderColor: Colors.borderLight,
    opacity: 0.5,
  },
  slotChipText: { fontSize: 12, fontWeight: '700', color: Colors.text },
  phoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  phoneBoxFound: { borderColor: Colors.trustGreen },
  prefix: { paddingHorizontal: 14, paddingVertical: 13, backgroundColor: Colors.primaryLight },
  prefixText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  phoneDivider: { width: 1, height: '100%', backgroundColor: Colors.borderLight },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  foundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: Colors.trustGreen,
  },
  foundAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.trustGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foundInitial: { fontSize: 16, fontWeight: '800', color: Colors.white },
  foundName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  foundHint: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  hint: { fontSize: 12, color: Colors.textSecondary, marginTop: 6, lineHeight: 17 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 16,
  },
  successDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  refCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 14,
    minWidth: 200,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  refLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refValue: { fontSize: 18, fontWeight: '900', color: Colors.text, marginTop: 4, letterSpacing: 1 },
  linkText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
});
