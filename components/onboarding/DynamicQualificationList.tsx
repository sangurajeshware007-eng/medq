/**
 * DynamicQualificationList — Add/remove qualifications dynamically
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import Input from '../Input';
import type { QualificationEntry } from '../../store/doctorOnboardingStore';

const DEGREE_OPTIONS = ['MBBS', 'MD', 'MS', 'DM', 'DNB', 'BDS', 'MDS', 'BAMS', 'BHMS', 'PhD', 'Other'];

interface DynamicQualificationListProps {
  qualifications: QualificationEntry[];
  onChange: (qualifications: QualificationEntry[]) => void;
}

export default function DynamicQualificationList({ qualifications, onChange }: DynamicQualificationListProps) {
  const updateItem = (index: number, field: keyof QualificationEntry, value: string) => {
    const updated = qualifications.map((q, i) => (i === index ? { ...q, [field]: value } : q));
    onChange(updated);
  };

  const addRow = () => {
    onChange([...qualifications, { degree: '', institution: '', year: '' }]);
  };

  const removeRow = (index: number) => {
    if (qualifications.length <= 1) return;
    onChange(qualifications.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Qualifications</Text>
      <Text style={styles.sectionSubtitle}>Add your educational qualifications</Text>

      {qualifications.map((qual, index) => (
        <View key={index} style={styles.qualCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.qualIndex}>Qualification {index + 1}</Text>
            {qualifications.length > 1 && (
              <TouchableOpacity onPress={() => removeRow(index)} style={styles.deleteBtn}>
                <Trash2 size={16} color={Colors.error} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          {/* Degree picker - shown as chips */}
          <Text style={styles.fieldLabel}>Degree</Text>
          <View style={styles.degreeChips}>
            {DEGREE_OPTIONS.map((deg) => (
              <TouchableOpacity
                key={deg}
                style={[styles.degreeChip, qual.degree === deg && styles.degreeChipSelected]}
                onPress={() => updateItem(index, 'degree', deg)}
              >
                <Text
                  style={[styles.degreeChipText, qual.degree === deg && styles.degreeChipTextSelected]}
                >
                  {deg}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Institution"
            value={qual.institution}
            onChangeText={(v) => updateItem(index, 'institution', v)}
            placeholder="e.g., AIIMS New Delhi"
          />
          <Input
            label="Year of Completion"
            value={qual.year}
            onChangeText={(v) => updateItem(index, 'year', v.replace(/[^0-9]/g, ''))}
            placeholder="e.g., 2015"
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.addBtn} onPress={addRow}>
        <Plus size={18} color={Colors.primary} strokeWidth={2.5} />
        <Text style={styles.addBtnText}>Add Qualification</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  qualCard: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  qualIndex: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  deleteBtn: {
    padding: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  degreeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  degreeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  degreeChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  degreeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  degreeChipTextSelected: {
    color: Colors.white,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});

