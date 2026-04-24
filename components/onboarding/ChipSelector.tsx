/**
 * ChipSelector — Reusable multi-select chip component
 * Used for services, conditions, departments, languages, etc.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

interface ChipSelectorProps {
  label: string;
  options: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  allowCustom?: boolean;
  customPlaceholder?: string;
  maxSelection?: number;
}

export default function ChipSelector({
  label,
  options,
  selected,
  onSelectionChange,
  allowCustom = false,
  customPlaceholder = 'Add custom...',
  maxSelection,
}: ChipSelectorProps) {
  const [customValue, setCustomValue] = useState('');

  const toggleChip = (option: string) => {
    if (selected.includes(option)) {
      onSelectionChange(selected.filter((s) => s !== option));
    } else {
      if (maxSelection && selected.length >= maxSelection) return;
      onSelectionChange([...selected, option]);
    }
  };

  const addCustom = () => {
    const trimmed = customValue.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onSelectionChange([...selected, trimmed]);
      setCustomValue('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipGrid}>
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <TouchableOpacity
              key={option}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => toggleChip(option)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {option}
              </Text>
              {isSelected && <X size={12} color={Colors.white} strokeWidth={2.5} />}
            </TouchableOpacity>
          );
        })}
      </View>
      {/* Custom items not in predefined list */}
      {selected.filter((s) => !options.includes(s)).length > 0 && (
        <View style={styles.chipGrid}>
          {selected
            .filter((s) => !options.includes(s))
            .map((custom) => (
              <TouchableOpacity
                key={custom}
                style={[styles.chip, styles.chipCustom]}
                onPress={() => toggleChip(custom)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, styles.chipTextSelected]}>{custom}</Text>
                <X size={12} color={Colors.white} strokeWidth={2.5} />
              </TouchableOpacity>
            ))}
        </View>
      )}
      {allowCustom && (
        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            value={customValue}
            onChangeText={setCustomValue}
            placeholder={customPlaceholder}
            placeholderTextColor={Colors.textLight}
            onSubmitEditing={addCustom}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtn} onPress={addCustom}>
            <Plus size={18} color={Colors.white} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipCustom: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  chipTextSelected: {
    color: Colors.white,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  customInput: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

