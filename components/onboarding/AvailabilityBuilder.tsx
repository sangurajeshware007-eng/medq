/**
 * AvailabilityBuilder — Build per-hospital, per-day session availability
 *
 * Product features:
 *  • Toggle days on/off
 *  • Add / edit / delete sessions per day
 *  • "Copy to days" — set up one day, then push those sessions to any/all other days
 */
import { Plus, Clock, Trash2, X, Copy } from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';

import { Colors } from '../../constants/Colors';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import type { DayAvailability, SessionEntry } from '../../store/doctorOnboardingStore';
import { findConflict, timeToMinutes, intervalsOverlap } from '../../utils/timeRange';
import type { BlockedInterval } from '../../utils/timeRange';

import TimeRangeSlider from './TimeRangeSlider';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_LABELS: Record<string, string> = {
  MON: 'Mon',
  TUE: 'Tue',
  WED: 'Wed',
  THU: 'Thu',
  FRI: 'Fri',
  SAT: 'Sat',
  SUN: 'Sun',
};
const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

const SESSION_NAMES = ['Morning OPD', 'Afternoon OPD', 'Evening OPD', 'Surgery Slots', 'Emergency'];
const SESSION_TYPES = ['OPD', 'SURGERY', 'EMERGENCY'];
const SLOT_DURATIONS = [10, 15, 20, 30];

const DEFAULT_SESSION: SessionEntry = {
  sessionName: SESSION_NAMES[0],
  sessionType: SESSION_TYPES[0],
  startTime: '09:00',
  endTime: '12:00',
  slotDurationMinutes: 15,
  maxPatientsPerSlot: 1,
};

// ── Time conflict helpers (shared math lives in utils/timeRange) ─────────
const timesOverlap = (s1: string, e1: string, s2: string, e2: string): boolean =>
  intervalsOverlap(timeToMinutes(s1), timeToMinutes(e1), timeToMinutes(s2), timeToMinutes(e2));

/**
 * Sessions the doctor already has at OTHER hospitals on the same weekday.
 * Used to block setting up an overlapping session here — one doctor can't
 * physically be at two hospitals at once.
 */
export interface CrossHospitalSession {
  hospitalName: string;
  sessionName: string;
  startTime: string;
  endTime: string;
}

interface AvailabilityBuilderProps {
  hospitalName: string;
  availability: DayAvailability[];
  onChange: (availability: DayAvailability[]) => void;
  /** Keyed by day code (MON, TUE…). Sessions from other hospitals to block against. */
  crossHospitalBusy?: Record<string, CrossHospitalSession[]>;
}

export default function AvailabilityBuilder({
  hospitalName,
  availability,
  onChange,
  crossHospitalBusy,
}: AvailabilityBuilderProps) {
  // Desktop web: modals render as centered dialogs instead of bottom sheets.
  const { isMd } = useBreakpoint();

  // ── Session editor state ──────────────────────────────────────────────────
  const [showSessionModal, setShowSessionModal] = useState(false);
  // While a slider handle is being dragged, the modal ScrollView must not scroll.
  const [sliderDragging, setSliderDragging] = useState(false);
  const [editingDay, setEditingDay] = useState('');
  const [editingSession, setEditingSession] = useState<SessionEntry>({ ...DEFAULT_SESSION });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // ── Copy-to-days state ────────────────────────────────────────────────────
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySourceDay, setCopySourceDay] = useState('');
  const [copyTargetDays, setCopyTargetDays] = useState<Set<string>>(new Set());

  // ── Overlap validation ────────────────────────────────────────────────────
  const [overlapError, setOverlapError] = useState('');

  const activeDays = availability.map((a) => a.day);

  // Sessions on editingDay excluding the one being edited — used for conflict detection
  const blockedSessions = editingDay
    ? (availability.find((a) => a.day === editingDay)?.sessions ?? []).filter(
        (_, i) => i !== editingIndex,
      )
    : [];

  // Same-day sessions at OTHER hospitals — also block these so the doctor
  // can't be scheduled at two places at the same time.
  const crossBlockedSessions: CrossHospitalSession[] = editingDay
    ? (crossHospitalBusy?.[editingDay] ?? [])
    : [];

  // All busy intervals (own + cross-hospital) rendered as blocked zones on
  // the slider track and used for live conflict detection while dragging.
  const mergedBlocked: BlockedInterval[] = [
    ...blockedSessions.map((s) => ({
      startMin: timeToMinutes(s.startTime),
      endMin: timeToMinutes(s.endTime),
      label: s.sessionName,
    })),
    ...crossBlockedSessions.map((s) => ({
      startMin: timeToMinutes(s.startTime),
      endMin: timeToMinutes(s.endTime),
      label: s.sessionName,
      hospitalName: s.hospitalName,
    })),
  ];
  const liveConflict = findConflict(
    timeToMinutes(editingSession.startTime),
    timeToMinutes(editingSession.endTime),
    mergedBlocked,
  );

  // ── Day toggle ────────────────────────────────────────────────────────────
  const toggleDay = (day: string) => {
    if (activeDays.includes(day)) {
      onChange(availability.filter((a) => a.day !== day));
    } else {
      onChange([...availability, { day, sessions: [] }]);
    }
  };

  // ── Session editor ────────────────────────────────────────────────────────
  const openAddSession = (day: string) => {
    setEditingDay(day);
    setEditingSession({ ...DEFAULT_SESSION });
    setEditingIndex(null);
    setOverlapError('');
    setShowSessionModal(true);
  };

  const openEditSession = (day: string, index: number, session: SessionEntry) => {
    setEditingDay(day);
    setEditingSession({ ...session });
    setEditingIndex(index);
    setOverlapError('');
    setShowSessionModal(true);
  };

  const saveSession = () => {
    // Validate end > start
    if (timeToMinutes(editingSession.endTime) <= timeToMinutes(editingSession.startTime)) {
      setOverlapError('End time must be after start time.');
      return;
    }
    // Validate no overlap with other sessions on the same day (same hospital).
    const conflict = blockedSessions.find((s) =>
      timesOverlap(editingSession.startTime, editingSession.endTime, s.startTime, s.endTime),
    );
    if (conflict) {
      setOverlapError(
        `Overlaps with "${conflict.sessionName}" (${conflict.startTime}–${conflict.endTime}). Choose a different time.`,
      );
      return;
    }
    // Validate no overlap with sessions at OTHER hospitals on the same day.
    const crossConflict = crossBlockedSessions.find((s) =>
      timesOverlap(editingSession.startTime, editingSession.endTime, s.startTime, s.endTime),
    );
    if (crossConflict) {
      setOverlapError(
        `Overlaps with your session at ${crossConflict.hospitalName} ` +
          `(${crossConflict.startTime}–${crossConflict.endTime}). ` +
          `You can't be at two hospitals at the same time.`,
      );
      return;
    }
    const updated = availability.map((a) => {
      if (a.day !== editingDay) return a;
      const sessions = [...a.sessions];
      if (editingIndex !== null) {
        sessions[editingIndex] = { ...editingSession };
      } else {
        sessions.push({ ...editingSession });
      }
      return { ...a, sessions };
    });
    onChange(updated);
    setShowSessionModal(false);
  };

  const deleteSession = (day: string, index: number) => {
    const updated = availability.map((a) => {
      if (a.day !== day) return a;
      return { ...a, sessions: a.sessions.filter((_, i) => i !== index) };
    });
    onChange(updated);
  };

  // ── Copy to days ──────────────────────────────────────────────────────────
  const openCopyModal = (sourceDay: string) => {
    setCopySourceDay(sourceDay);
    // Pre-select active days that aren't the source
    const preSelected = new Set(activeDays.filter((d) => d !== sourceDay));
    setCopyTargetDays(preSelected);
    setShowCopyModal(true);
  };

  const toggleCopyTarget = (day: string) => {
    setCopyTargetDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const selectAllWeekdays = () => {
    setCopyTargetDays(new Set(WEEKDAYS.filter((d) => d !== copySourceDay)));
  };

  const selectAllDays = () => {
    setCopyTargetDays(new Set(DAYS.filter((d) => d !== copySourceDay)));
  };

  const applyCopy = () => {
    const sourceSessions = availability.find((a) => a.day === copySourceDay)?.sessions ?? [];
    let updated = [...availability];

    copyTargetDays.forEach((targetDay) => {
      if (activeDays.includes(targetDay)) {
        // Replace sessions on existing active day
        updated = updated.map((a) =>
          a.day === targetDay ? { ...a, sessions: sourceSessions.map((s) => ({ ...s })) } : a,
        );
      } else {
        // Activate the day with copied sessions
        updated = [...updated, { day: targetDay, sessions: sourceSessions.map((s) => ({ ...s })) }];
      }
    });

    onChange(updated);
    setShowCopyModal(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Availability at {hospitalName}</Text>
      <Text style={styles.subtitle}>
        Select working days, add sessions, then copy to other days.
      </Text>

      {/* Day pills */}
      <View style={styles.dayRow}>
        {DAYS.map((day) => {
          const isActive = activeDays.includes(day);
          return (
            <TouchableOpacity
              key={day}
              style={[styles.dayPill, isActive && styles.dayPillActive]}
              onPress={() => toggleDay(day)}
            >
              <Text style={[styles.dayText, isActive && styles.dayTextActive]}>
                {DAY_LABELS[day]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sessions per active day */}
      {availability
        .filter((a) => activeDays.includes(a.day))
        .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day))
        .map((dayAvail) => (
          <View key={dayAvail.day} style={styles.daySection}>
            <View style={styles.daySectionHeader}>
              <Text style={styles.daySectionTitle}>{DAY_LABELS[dayAvail.day]}</Text>
              <View style={styles.daySectionActions}>
                {dayAvail.sessions.length > 0 && (
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={() => openCopyModal(dayAvail.day)}
                  >
                    <Copy size={13} color={Colors.primary} strokeWidth={2.5} />
                    <Text style={styles.copyBtnText}>Copy</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.addSessionBtn}
                  onPress={() => openAddSession(dayAvail.day)}
                >
                  <Plus size={14} color={Colors.primary} strokeWidth={2.5} />
                  <Text style={styles.addSessionText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {dayAvail.sessions.length === 0 && (
              <Text style={styles.noSessions}>No sessions yet — tap "Add" to begin.</Text>
            )}

            {dayAvail.sessions.map((session, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.sessionChip}
                onPress={() => openEditSession(dayAvail.day, idx, session)}
              >
                <Clock size={14} color={Colors.primary} strokeWidth={2} />
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionName}>{session.sessionName}</Text>
                  <Text style={styles.sessionTime}>
                    {session.startTime} – {session.endTime} · {session.slotDurationMinutes}min ·{' '}
                    {session.maxPatientsPerSlot} pt/slot
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.sessionDelete}
                  onPress={() => deleteSession(dayAvail.day, idx)}
                >
                  <Trash2 size={14} color={Colors.error} strokeWidth={2} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ))}

      {/* ── Session Editor Modal ─────────────────────────────────────────── */}
      <Modal visible={showSessionModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, isMd && styles.modalOverlayMd]}>
          <View style={[styles.modalContent, isMd && styles.modalContentMd]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingIndex !== null ? 'Edit' : 'Add'} Session — {DAY_LABELS[editingDay]}
              </Text>
              <TouchableOpacity onPress={() => setShowSessionModal(false)}>
                <X size={22} color={Colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={!sliderDragging}>
              {(blockedSessions.length > 0 || crossBlockedSessions.length > 0) && (
                <View style={styles.blockedInfo}>
                  <Text style={styles.blockedInfoTitle}>
                    Already scheduled on {DAY_LABELS[editingDay]}:
                  </Text>
                  {blockedSessions.map((s, i) => (
                    <Text key={`own-${i}`} style={styles.blockedInfoItem}>
                      • {s.startTime}–{s.endTime} {s.sessionName}
                    </Text>
                  ))}
                  {crossBlockedSessions.map((s, i) => (
                    <Text key={`cross-${i}`} style={styles.blockedInfoItem}>
                      • {s.startTime}–{s.endTime} {s.sessionName}{' '}
                      <Text style={styles.blockedInfoHospital}>@ {s.hospitalName}</Text>
                    </Text>
                  ))}
                </View>
              )}
              <Text style={styles.fieldLabel}>Session Name</Text>
              <View style={styles.optionRow}>
                {SESSION_NAMES.map((name) => (
                  <TouchableOpacity
                    key={name}
                    style={[
                      styles.optionPill,
                      editingSession.sessionName === name && styles.optionPillActive,
                    ]}
                    onPress={() => setEditingSession((s) => ({ ...s, sessionName: name }))}
                  >
                    <Text
                      style={[
                        styles.optionPillText,
                        editingSession.sessionName === name && styles.optionPillTextActive,
                      ]}
                    >
                      {name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Session Type</Text>
              <View style={styles.optionRow}>
                {SESSION_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionPill,
                      editingSession.sessionType === type && styles.optionPillActive,
                    ]}
                    onPress={() => setEditingSession((s) => ({ ...s, sessionType: type }))}
                  >
                    <Text
                      style={[
                        styles.optionPillText,
                        editingSession.sessionType === type && styles.optionPillTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Session Time</Text>
              <TimeRangeSlider
                startTime={editingSession.startTime}
                endTime={editingSession.endTime}
                onChange={(startTime, endTime) => {
                  setEditingSession((s) => ({ ...s, startTime, endTime }));
                  setOverlapError('');
                }}
                blocked={mergedBlocked}
                slotDurationMinutes={editingSession.slotDurationMinutes}
                onDraggingChange={setSliderDragging}
              />

              <Text style={styles.fieldLabel}>Slot Duration (minutes)</Text>
              <View style={styles.optionRow}>
                {SLOT_DURATIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.optionPill,
                      editingSession.slotDurationMinutes === d && styles.optionPillActive,
                    ]}
                    onPress={() => setEditingSession((s) => ({ ...s, slotDurationMinutes: d }))}
                  >
                    <Text
                      style={[
                        styles.optionPillText,
                        editingSession.slotDurationMinutes === d && styles.optionPillTextActive,
                      ]}
                    >
                      {d} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Max Patients per Slot</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() =>
                    setEditingSession((s) => ({
                      ...s,
                      maxPatientsPerSlot: Math.max(1, s.maxPatientsPerSlot - 1),
                    }))
                  }
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{editingSession.maxPatientsPerSlot}</Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() =>
                    setEditingSession((s) => ({
                      ...s,
                      maxPatientsPerSlot: s.maxPatientsPerSlot + 1,
                    }))
                  }
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {overlapError !== '' && (
              <View style={styles.overlapError}>
                <Text style={styles.overlapErrorText}>{overlapError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, !!liveConflict && styles.saveBtnDisabled]}
              onPress={saveSession}
              disabled={!!liveConflict}
            >
              <Text style={styles.saveBtnText}>
                {editingIndex !== null ? 'Update Session' : 'Add Session'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Copy to Days Modal ───────────────────────────────────────────── */}
      <Modal visible={showCopyModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, isMd && styles.modalOverlayMd]}>
          <View style={[styles.modalContent, isMd && styles.modalContentMd]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Copy {DAY_LABELS[copySourceDay]} sessions to:</Text>
              <TouchableOpacity onPress={() => setShowCopyModal(false)}>
                <X size={22} color={Colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <Text style={styles.copyHint}>
              {availability.find((a) => a.day === copySourceDay)?.sessions.length ?? 0} session(s)
              will be copied. Existing sessions on target days will be replaced.
            </Text>

            {/* Quick select shortcuts */}
            <View style={styles.shortcutRow}>
              <TouchableOpacity style={styles.shortcutBtn} onPress={selectAllWeekdays}>
                <Text style={styles.shortcutText}>Mon–Fri</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shortcutBtn} onPress={selectAllDays}>
                <Text style={styles.shortcutText}>All days</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shortcutBtn}
                onPress={() => setCopyTargetDays(new Set())}
              >
                <Text style={styles.shortcutText}>Clear</Text>
              </TouchableOpacity>
            </View>

            {/* Day checkboxes */}
            <View style={styles.copyDayGrid}>
              {DAYS.filter((d) => d !== copySourceDay).map((day) => {
                const isSelected = copyTargetDays.has(day);
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.copyDayPill, isSelected && styles.copyDayPillActive]}
                    onPress={() => toggleCopyTarget(day)}
                  >
                    <Text style={[styles.copyDayText, isSelected && styles.copyDayTextActive]}>
                      {DAY_LABELS[day]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, copyTargetDays.size === 0 && styles.saveBtnDisabled]}
              onPress={applyCopy}
              disabled={copyTargetDays.size === 0}
            >
              <Text style={styles.saveBtnText}>
                Apply to {copyTargetDays.size} day{copyTargetDays.size !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  title: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  dayPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  dayPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  dayTextActive: { color: Colors.white },
  daySection: { marginBottom: 14 },
  daySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  daySectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  daySectionActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  copyBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  addSessionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addSessionText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  noSessions: { fontSize: 12, color: Colors.textLight, fontStyle: 'italic', marginBottom: 8 },
  sessionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: 6,
  },
  sessionInfo: { flex: 1 },
  sessionName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  sessionTime: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  sessionDelete: { padding: 4 },
  // Modals shared
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  // Desktop web: centered dialog instead of a stretched bottom sheet.
  modalOverlayMd: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContentMd: { width: '100%', maxWidth: 560, borderRadius: 24, maxHeight: '90%' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, flex: 1, marginRight: 8 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 14,
  },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  optionPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionPillText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  optionPillTextActive: { color: Colors.white },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  stepperValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
  saveBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  // Copy modal specific
  copyHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
    backgroundColor: Colors.primaryLight,
    padding: 10,
    borderRadius: 10,
  },
  shortcutRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  shortcutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  shortcutText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  copyDayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  copyDayPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  copyDayPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  copyDayText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  copyDayTextActive: { color: Colors.white },
  blockedInfo: {
    backgroundColor: Colors.goldLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  blockedInfoTitle: { fontSize: 12, fontWeight: '700', color: Colors.warningText, marginBottom: 4 },
  blockedInfoItem: { fontSize: 12, color: Colors.warningText, marginBottom: 2 },
  blockedInfoHospital: { fontSize: 11, color: Colors.warningText, fontWeight: '700' },
  overlapError: {
    backgroundColor: Colors.goldLight,
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  overlapErrorText: { fontSize: 12, color: Colors.warningText, fontWeight: '600' },
});
