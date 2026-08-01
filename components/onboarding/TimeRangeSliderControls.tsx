/**
 * TimeRangeSliderControls — precision + speed companions to the slider:
 * ±15-minute steppers (also the keyboard/a11y path on web), live capacity
 * summary, inline conflict message, and one-tap presets.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { Colors } from '../../constants/Colors';
import {
  formatDuration,
  minutesToTime,
  slotCount,
  MAX_END,
  MIN_DURATION,
  STEP,
} from '../../utils/timeRange';
import type { BlockedInterval } from '../../utils/timeRange';

const PRESETS: { label: string; start: number; end: number }[] = [
  { label: 'Morning', start: 540, end: 720 }, // 09:00–12:00
  { label: 'Afternoon', start: 780, end: 960 }, // 13:00–16:00
  { label: 'Evening', start: 1020, end: 1200 }, // 17:00–20:00
  { label: 'Full day', start: 540, end: 1020 }, // 09:00–17:00
];

interface TimeRangeSliderControlsProps {
  startMin: number;
  endMin: number;
  slotDurationMinutes: number;
  conflict: BlockedInterval | null;
  onSet: (start: number, end: number) => void;
}

function Stepper({
  onPress,
  disabled,
  label,
}: {
  onPress: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.stepBtn, disabled && styles.stepBtnDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.stepBtnText}>{label.startsWith('Increase') ? '+' : '−'}</Text>
    </TouchableOpacity>
  );
}

export default function TimeRangeSliderControls({
  startMin,
  endMin,
  slotDurationMinutes,
  conflict,
  onSet,
}: TimeRangeSliderControlsProps) {
  const slots = slotCount(startMin, endMin, slotDurationMinutes);

  return (
    <View style={styles.container}>
      {/* Steppers + live summary */}
      <View style={styles.stepperRow}>
        <View style={styles.stepperPair}>
          <Stepper
            label="Decrease start time"
            disabled={startMin <= 0}
            onPress={() => onSet(Math.max(startMin - STEP, 0), endMin)}
          />
          <Stepper
            label="Increase start time"
            disabled={startMin >= endMin - MIN_DURATION}
            onPress={() => onSet(Math.min(startMin + STEP, endMin - MIN_DURATION), endMin)}
          />
        </View>

        <Text testID="time-range-summary" style={styles.summary} numberOfLines={2}>
          <Text style={styles.summaryTime}>
            {minutesToTime(startMin)} – {minutesToTime(endMin)}
          </Text>
          {'\n'}
          {formatDuration(endMin - startMin)} · {slots} slots × {slotDurationMinutes} min
        </Text>

        <View style={styles.stepperPair}>
          <Stepper
            label="Decrease end time"
            disabled={endMin <= startMin + MIN_DURATION}
            onPress={() => onSet(startMin, Math.max(endMin - STEP, startMin + MIN_DURATION))}
          />
          <Stepper
            label="Increase end time"
            disabled={endMin >= MAX_END}
            onPress={() => onSet(startMin, Math.min(endMin + STEP, MAX_END))}
          />
        </View>
      </View>

      {/* Live conflict message */}
      {conflict && (
        <View style={styles.conflictBox} testID="time-range-conflict">
          <Text style={styles.conflictText}>
            Overlaps “{conflict.label}” ({minutesToTime(conflict.startMin)}–
            {minutesToTime(conflict.endMin)})
            {conflict.hospitalName ? ` at ${conflict.hospitalName}` : ''}. Drag the session to a
            free spot.
          </Text>
        </View>
      )}

      {/* One-tap presets */}
      <View style={styles.presetRow}>
        {PRESETS.map((p) => {
          const active = startMin === p.start && endMin === p.end;
          return (
            <TouchableOpacity
              key={p.label}
              style={[styles.presetChip, active && styles.presetChipActive]}
              onPress={() => onSet(p.start, p.end)}
            >
              <Text style={[styles.presetText, active && styles.presetTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepperPair: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.35,
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  summary: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  summaryTime: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  conflictBox: {
    backgroundColor: Colors.goldLight,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  conflictText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warningText,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  presetChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  presetText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.text,
  },
  presetTextActive: {
    color: Colors.white,
  },
});
