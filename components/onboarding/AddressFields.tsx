/**
 * Pincode-led address form — shared by hospital onboarding (and anywhere
 * else we collect a structured Indian address). UX rationale:
 *
 *   1. Pincode first → anchors the whole form. We fire /pincode lookup on
 *      the 6th digit (debounced) and auto-fill city / state / district.
 *   2. Three status states under the pincode — loading / found / unknown —
 *      so the user sees exactly what the system understood.
 *   3. Auto-filled fields stay editable (real-world edge cases: border
 *      pincodes, rural gaps in the master table).
 *   4. Address Line 1 and 2 are separate: Line 1 = building + street
 *      (required), Line 2 = area / landmark (optional). Familiar to
 *      anyone who's used a delivery app in India.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';
import Input from '../Input';
import { Colors } from '../../constants/Colors';
import onboardingService from '../../services/onboardingService';
import type { HospitalAddressStep } from '../../store/hospitalOnboardingStore';

type LookupStatus = 'idle' | 'loading' | 'found' | 'not_found';
const PINCODE_LOOKUP_DELAY_MS = 300;

// Defensive default so the component never crashes when the persisted
// store is mid-hydration or was saved with an older shape (pre-v2 migration).
const EMPTY_ADDRESS: HospitalAddressStep = {
  addressLine1: '', addressLine2: '', pincode: '',
  city: '', district: '', state: '', country: 'India',
};

interface AddressFieldsProps {
  value: HospitalAddressStep | undefined | null;
  onChange: (partial: Partial<HospitalAddressStep>) => void;
  errors?: Record<string, string>;
  onFieldEdit?: (field: keyof HospitalAddressStep) => void;
}

export default function AddressFields({ value: rawValue, onChange, errors = {}, onFieldEdit }: Readonly<AddressFieldsProps>) {
  // Normalize — treats missing object, or a legacy string, as empty.
  const value: HospitalAddressStep =
    rawValue && typeof rawValue === 'object'
      ? { ...EMPTY_ADDRESS, ...rawValue }
      : EMPTY_ADDRESS;
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
  const [lookupHint, setLookupHint] = useState<string>('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLookedUpRef = useRef<string>('');

  // Debounced pincode lookup — fires once the user types 6 digits and pauses.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.pincode.length !== 6 || !/^\d{6}$/.test(value.pincode)) {
      if (lookupStatus !== 'idle') { setLookupStatus('idle'); setLookupHint(''); }
      return;
    }
    if (value.pincode === lastLookedUpRef.current) return;

    debounceRef.current = setTimeout(async () => {
      setLookupStatus('loading');
      setLookupHint('Looking up...');
      lastLookedUpRef.current = value.pincode;
      try {
        const res = await onboardingService.lookupPincode(value.pincode);
        onChange({
          city: res.city,
          state: res.state,
          district: res.district ?? '',
          country: res.country,
        });
        setLookupStatus('found');
        setLookupHint(`${res.city}, ${res.state}`);
      } catch {
        setLookupStatus('not_found');
        // Intentionally warm — this pincode is outside our current service
        // area (currently Bidar + Kalaburagi districts). We still allow the
        // form to continue so the user can capture intent / interest.
        setLookupHint("We're coming soon to your area! Enter your city & state manually below.");
      }
    }, PINCODE_LOOKUP_DELAY_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // onChange intentionally omitted — re-running on every parent render
    // would cancel in-flight lookups. We only re-lookup when the pincode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.pincode]);

  const handlePincode = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    onChange({ pincode: digits });
    onFieldEdit?.('pincode');
  };

  // Auto-filled city/state are *editable* — the user can override without
  // hunting for a hidden "Change" toggle. Cleaner than locking them.
  const autoFilled = lookupStatus === 'found';

  return (
    <View>
      <Text style={styles.sectionTitle}>Hospital Address</Text>

      <Input
        label="Pincode *"
        value={value.pincode}
        onChangeText={handlePincode}
        placeholder="585401"
        keyboardType="numeric"
        maxLength={6}
        error={errors.pincode}
      />
      {!!lookupHint && (
        <View style={styles.lookupRow}>
          {lookupStatus === 'loading' && <ActivityIndicator size="small" color={Colors.primary} />}
          {lookupStatus === 'found' && <CheckCircle2 size={14} color={Colors.trustGreen} strokeWidth={2.5} />}
          {lookupStatus === 'not_found' && <AlertCircle size={14} color={Colors.gold} strokeWidth={2.5} />}
          <Text
            style={[
              styles.lookupText,
              lookupStatus === 'found' && { color: Colors.trustGreen },
              lookupStatus === 'not_found' && { color: Colors.gold },
            ]}
            numberOfLines={2}
          >
            {lookupHint}
          </Text>
        </View>
      )}

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Input
            label="City *"
            value={value.city}
            onChangeText={(v) => { onChange({ city: v }); onFieldEdit?.('city'); }}
            placeholder={autoFilled ? value.city : 'Bidar'}
            error={errors.city}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            label="State *"
            value={value.state}
            onChangeText={(v) => { onChange({ state: v }); onFieldEdit?.('state'); }}
            placeholder={autoFilled ? value.state : 'Karnataka'}
            error={errors.state}
          />
        </View>
      </View>

      <Input
        label="District"
        value={value.district}
        onChangeText={(v) => onChange({ district: v })}
        placeholder="Bidar"
      />

      <Input
        label="Address Line 1 *"
        value={value.addressLine1}
        onChangeText={(v) => { onChange({ addressLine1: v }); onFieldEdit?.('addressLine1'); }}
        placeholder="Building, street — e.g. 15 MG Road"
        error={errors.addressLine1}
      />

      <Input
        label="Address Line 2 (optional)"
        value={value.addressLine2}
        onChangeText={(v) => onChange({ addressLine2: v })}
        placeholder="Area, landmark — e.g. Near Gandhi Chowk"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 15, fontWeight: '800', color: Colors.text,
    marginTop: 4, marginBottom: 12,
  },
  lookupRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: -8, marginBottom: 12, paddingHorizontal: 2,
  },
  lookupText: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  row: { flexDirection: 'row', gap: 12 },
});
