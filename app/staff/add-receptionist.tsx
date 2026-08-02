import { useRouter } from 'expo-router';
import {
  ChevronRight,
  Building2,
  CheckCircle,
  Users,
  UserCheck,
  UserX,
  Loader,
} from 'lucide-react-native';
import React, { useState, useEffect, useRef } from 'react';
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
import type { DoctorHospitalItem, PhoneLookupResult } from '../../services/staffService';
import staffService from '../../services/staffService';
import { getApiErrorMessage } from '../../utils/apiError';

import { formColumn } from '@/theme';

type LookupState = 'idle' | 'loading' | 'found' | 'not_found';

export default function AddReceptionistScreen() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<DoctorHospitalItem[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState<DoctorHospitalItem | null>(null);
  const [digits, setDigits] = useState('');
  const [lookupState, setLookupState] = useState<LookupState>('idle');
  const [foundUser, setFoundUser] = useState<PhoneLookupResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ name: string | null; hospital: string } | null>(null);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    staffService
      .doctorMyHospitals()
      .then(setHospitals)
      .catch(() => {})
      .finally(() => setLoadingHospitals(false));
  }, []);

  function handleDigitsChange(text: string) {
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    setDigits(cleaned);
    setFoundUser(null);

    if (lookupTimer.current) clearTimeout(lookupTimer.current);

    if (cleaned.length === 10) {
      setLookupState('loading');
      lookupTimer.current = setTimeout(async () => {
        try {
          const result = await staffService.doctorLookupPhone(cleaned);
          if (result) {
            setFoundUser(result);
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
    if (!selectedHospital) {
      Alert.alert('Select a hospital', 'Choose which hospital you want to add a receptionist to.');
      return;
    }
    if (digits.length !== 10) {
      Alert.alert('Invalid phone', 'Enter a valid 10-digit mobile number.');
      return;
    }
    setSubmitting(true);
    try {
      const phone = `+91${digits}`;
      const result = await staffService.doctorInviteReceptionist(
        selectedHospital.hospitalId,
        phone,
      );
      setDone({
        name: result.userName ?? foundUser?.name ?? null,
        hospital: selectedHospital.hospitalName,
      });
    } catch (e: unknown) {
      Alert.alert('Could not add receptionist', getApiErrorMessage(e, 'Failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successContainer}>
          <CheckCircle size={64} color={Colors.trustGreen} strokeWidth={1.5} />
          <Text style={styles.successTitle}>Receptionist Added!</Text>
          <Text style={styles.successDesc}>
            {done.name ? (
              <>
                <Text style={{ fontWeight: '700' }}>{done.name}</Text> is now a receptionist at{' '}
              </>
            ) : (
              'They have been added as a receptionist at '
            )}
            <Text style={{ fontWeight: '700' }}>{done.hospital}</Text>.{'\n\n'}They can now handle
            walk-ins and check-ins for your patients.
          </Text>
          <Button
            title="Done"
            onPress={() => router.back()}
            style={{ marginTop: 24, width: '100%' }}
          />
          <TouchableOpacity
            style={{ marginTop: 12 }}
            onPress={() => {
              setDone(null);
              setDigits('');
              setLookupState('idle');
              setFoundUser(null);
            }}
          >
            <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 14 }}>
              Add Another
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const canSubmit = !!selectedHospital && digits.length === 10 && !submitting;

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
        <Text style={styles.headerTitle}>Add Receptionist</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Hospital picker */}
        <Text style={styles.label}>Select Your Hospital</Text>
        {loadingHospitals ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
        ) : hospitals.length === 0 ? (
          <View style={styles.emptyHospitals}>
            <Building2 size={36} color={Colors.borderLight} strokeWidth={1.5} />
            <Text style={styles.emptyText}>No hospitals linked to your profile yet.</Text>
          </View>
        ) : (
          hospitals.map((h) => (
            <TouchableOpacity
              key={h.hospitalId}
              style={[
                styles.hospitalCard,
                selectedHospital?.hospitalId === h.hospitalId && styles.hospitalCardSelected,
              ]}
              onPress={() => setSelectedHospital(h)}
              activeOpacity={0.8}
            >
              <Building2
                size={18}
                color={
                  selectedHospital?.hospitalId === h.hospitalId
                    ? Colors.primary
                    : Colors.textSecondary
                }
                strokeWidth={2}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.hospitalName,
                    selectedHospital?.hospitalId === h.hospitalId && { color: Colors.primary },
                  ]}
                >
                  {h.hospitalName}
                </Text>
                {h.isPrimary && <Text style={styles.primaryBadge}>Primary</Text>}
              </View>
              {selectedHospital?.hospitalId === h.hospitalId && (
                <CheckCircle size={18} color={Colors.primary} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          ))
        )}

        {/* Phone input with +91 prefix */}
        <Text style={[styles.label, { marginTop: 22 }]}>Receptionist's Phone Number</Text>
        <View
          style={[
            styles.phoneBox,
            digits.length === 10 && lookupState === 'found' && styles.phoneBoxFound,
          ]}
        >
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
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 12 }} />
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

        {/* Lookup result */}
        {lookupState === 'found' && foundUser && (
          <View style={styles.userFoundCard}>
            <View style={styles.userFoundAvatar}>
              <Text style={styles.userFoundInitial}>{foundUser.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userFoundName}>{foundUser.name}</Text>
              <Text style={styles.userFoundPhone}>+91 {digits}</Text>
            </View>
            <CheckCircle size={18} color={Colors.trustGreen} strokeWidth={2.5} />
          </View>
        )}

        {lookupState === 'not_found' && (
          <View style={styles.userNotFoundCard}>
            <Text style={styles.userNotFoundText}>
              No account found for this number — they'll be added automatically when they sign up
              with this phone.
            </Text>
          </View>
        )}

        {/* Info card */}
        <View style={styles.infoCard}>
          <Users size={16} color={Colors.primary} strokeWidth={2} />
          <Text style={styles.infoText}>
            The receptionist will be able to register walk-in patients, check in booked patients,
            and manage the token queue at this hospital.
          </Text>
        </View>

        <Button
          title={
            submitting
              ? 'Adding…'
              : lookupState === 'found'
                ? `Add ${foundUser?.name ?? 'Receptionist'}`
                : 'Add Receptionist'
          }
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
  hospitalCard: {
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
  hospitalCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  hospitalName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  primaryBadge: { fontSize: 11, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  emptyHospitals: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
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
  prefix: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: Colors.primaryLight,
  },
  prefixText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  phoneDivider: { width: 1, height: '100%', backgroundColor: Colors.borderLight },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  userFoundCard: {
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
  userFoundAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.trustGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userFoundInitial: { fontSize: 16, fontWeight: '800', color: Colors.white },
  userFoundName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  userFoundPhone: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  userNotFoundCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  userNotFoundText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    padding: 12,
    marginTop: 18,
  },
  infoText: { flex: 1, fontSize: 12, color: Colors.text, lineHeight: 18 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 10,
  },
  successDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
