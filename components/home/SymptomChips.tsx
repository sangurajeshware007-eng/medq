/**
 * SymptomChips — "What's troubling you?" quick-entry row on the home screen.
 *
 * Lowest-friction search entry: one tap on a symptom lands on the search
 * screen pre-seeded with `?q=`, which already resolves free-text symptoms to
 * specializations. Works logged-out; curated keys all exist in
 * `utils/mockData.ts` diseaseMapping so results are never empty.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { Colors } from '../../constants/Colors';

const SYMPTOMS: { key: string; label: string }[] = [
  { key: 'fever', label: 'Fever' },
  { key: 'cough', label: 'Cough' },
  { key: 'cold', label: 'Cold' },
  { key: 'headache', label: 'Headache' },
  { key: 'skin rash', label: 'Skin rash' },
  { key: 'tooth pain', label: 'Tooth pain' },
  { key: 'knee pain', label: 'Knee pain' },
  { key: 'stomach pain', label: 'Stomach pain' },
];

export default function SymptomChips() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What&apos;s troubling you?</Text>
      <View style={styles.row}>
        {SYMPTOMS.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={styles.chip}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: s.key } })}
          >
            <Text style={styles.chipText}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.text,
  },
});
