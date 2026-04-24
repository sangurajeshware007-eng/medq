/**
 * AvailabilityBuilder — Build per-hospital, per-day session availability
 *
 * Product features:
 *  • Toggle days on/off
 *  • Add / edit / delete sessions per day
 *  • "Copy to days" — set up one day, then push those sessions to any/all other days
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Plus, Clock, Trash2, X, Copy } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import type { DayAvailability, SessionEntry } from '../../store/doctorOnboardingStore';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_LABELS: Record<string, string> = {
  MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun',
};
const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

const SESSION_NAMES = ['Morning OPD', 'Afternoon OPD', 'Evening OPD', 'Surgery Slots', 'Emergency'];
const SESSION_TYPES = ['OPD', 'SURGERY', 'EMERGENCY', 'TELE'];
const SLOT_DURATIONS = [10, 15, 20, 30];
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

const DEFAULT_SESSION: SessionEntry = {
  sessionName: SESSION_NAMES[0],
  sessionType: SESSION_TYPES[0],
  startTime: '09:00',
  endTime: '12:00',
  slotDurationMinutes: 15,
  maxPatientsPerSlot: 1,
};

// ── Time conflict helpers ─────────────────────────────────────────────────
const timeToMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const timesOverlap = (s1: string, e1: string, s2: string, e2: string): boolean =>
  timeToMinutes(s1) < timeToMinutes(e2) && timeToMinutes(e1) > timeToMinutes(s2);

interface AvailabilityBuilderProps {
  hospitalName: string;
  availability: DayAvailability[];
  onChange: (availability: DayAvailability[]) => void;
}

export default function AvailabilityBuilder({ hospitalName, availability, onChange }: AvailabilityBuilderProps) {
  // ── Session editor state ──────────────────────────────────────────────────
  const [showSessionModal, setShowSessionModal] = useState(false);
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
    ? (availability.find((a) => a.day === editingDay)?.sessions ?? [])
        .filter((_, i) => i !== editingIndex)
    : [];

  // Returns true if the given time falls inside any blocked session's range
  const isTimeConflicted = (time: string): boolean =>
    blockedSessions.some((s) => {
      const t = timeToMinutes(time);
      return t >= timeToMinutes(s.startTime) && t < timeToMinutes(s.endTime);
    });

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
    // Validate no overlap with other sessions on the same day
    const conflict = blockedSessions.find((s) =>
      timesOverlap(editingSession.startTime, editingSession.endTime, s.startTime, s.endTime)
    );
    if (conflict) {
      setOverlapError(
        `Overlaps with "${conflict.sessionName}" (${conflict.startTime}–${conflict.endTime}). Choose a different time.`
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
          a.day === targetDay ? { ...a, sessions: sourceSessions.map((s) => ({ ...s })) } : a
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
      <Text style={styles.subtitle}>Select working days, add sessions, then copy to other days.</Text>

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
                    {session.startTime} – {session.endTime} · {session.slotDurationMinutes}min · {session.maxPatientsPerSlot} pt/slot
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingIndex !== null ? 'Edit' : 'Add'} Session — {DAY_LABELS[editingDay]}
              </Text>
              <TouchableOpacity onPress={() => setShowSessionModal(false)}>
                <X size={22} color={Colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {blockedSessions.length > 0 && (
                <View style={styles.blockedInfo}>
                  <Text style={styles.blockedInfoTitle}>Already scheduled on {DAY_LABELS[editingDay]}:</Text>
                  {blockedSessions.map((s, i) => (
                    <Text key={i} style={styles.blockedInfoItem}>
                      • {s.startTime}–{s.endTime}  {s.sessionName}
                    </Text>
                  ))}
                </View>
              )}
              <Text style={styles.fieldLabel}>Session Name</Text>
              <View style={styles.optionRow}>
                {SESSION_NAMES.map((name) => (
                  <TouchableOpacity
                    key={name}
                    style={[styles.optionPill, editingSession.sessionName === name && styles.optionPillActive]}
                    onPress={() => setEditingSession((s) => ({ ...s, sessionName: name }))}
                  >
                    <Text style={[styles.optionPillText, editingSession.sessionName === name && styles.optionPillTextActive]}>
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
                    style={[styles.optionPill, editingSession.sessionType === type && styles.optionPillActive]}
                    onPress={() => setEditingSession((s) => ({ ...s, sessionType: type }))}
                  >
                    <Text style={[styles.optionPillText, editingSession.sessionType === type && styles.optionPillTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Start Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                {TIME_OPTIONS.map((t) => (
                  <TouchableOpacity
                    key={`start-${t}`}
                    style={[
                      styles.timePill,
                      editingSession.startTime === t && styles.timePillActive,
                      isTimeConflicted(t) && styles.timePillConflicted,
                    ]}
                    onPress={() => { setEditingSession((s) => ({ ...s, startTime: t })); setOverlapError(''); }}
                  >
                    <Text style={[
                      styles.timePillText,
                      editingSession.startTime === t && styles.timePillTextActive,
                      isTimeConflicted(t) && styles.timePillTextConflicted,
                    ]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>End Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                {TIME_OPTIONS.map((t) => (
                  <TouchableOpacity
                    key={`end-${t}`}
                    style={[styles.timePill, editingSession.endTime === t && styles.timePillActive]}
                    onPress={() => setEditingSession((s) => ({ ...s, endTime: t }))}
                  >
                    <Text style={[styles.timePillText, editingSession.endTime === t && styles.timePillTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Slot Duration (minutes)</Text>
              <View style={styles.optionRow}>
                {SLOT_DURATIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.optionPill, editingSession.slotDurationMinutes === d && styles.optionPillActive]}
                    onPress={() => setEditingSession((s) => ({ ...s, slotDurationMinutes: d }))}
                  >
                    <Text style={[styles.optionPillText, editingSession.slotDurationMinutes === d && styles.optionPillTextActive]}>
                      {d} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Max Patients per Slot</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setEditingSession((s) => ({ ...s, maxPatientsPerSlot: Math.max(1, s.maxPatientsPerSlot - 1) }))}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{editingSession.maxPatientsPerSlot}</Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setEditingSession((s) => ({ ...s, maxPatientsPerSlot: s.maxPatientsPerSlot + 1 }))}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={saveSession}>
              <Text style={styles.saveBtnText}>
                {editingIndex !== null ? 'Update Session' : 'Add Session'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Copy to Days Modal ───────────────────────────────────────────── */}
      <Modal visible={showCopyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Copy {DAY_LABELS[copySourceDay]} sessions to:
              </Text>
              <TouchableOpacity onPress={() => setShowCopyModal(false)}>
                <X size={22} color={Colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <Text style={styles.copyHint}>
              {availability.find((a) => a.day === copySourceDay)?.sessions.length ?? 0} session(s) will be copied.
              Existing sessions on target days will be replaced.
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
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  dayPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  dayTextActive: { color: Colors.white },
  daySection: { marginBottom: 14 },
  daySectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  daySectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  daySectionActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  copyBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  addSessionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addSessionText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  noSessions: { fontSize: 12, color: Colors.textLight, fontStyle: 'italic', marginBottom: 8 },
  sessionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12, backgroundColor: Colors.primaryLight,
    borderWidth: 1, borderColor: Colors.primary, marginBottom: 6,
  },
  sessionInfo: { flex: 1 },
  sessionName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  sessionTime: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  sessionDelete: { padding: 4 },
  // Modals shared
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, flex: 1, marginRight: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8, marginTop: 14 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  optionPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionPillText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  optionPillTextActive: { color: Colors.white },
  timeScroll: { marginBottom: 4 },
  timePill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, marginRight: 6,
  },
  timePillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timePillText: { fontSize: 12, fontWeight: '600', color: Colors.text },
  timePillTextActive: { color: Colors.white },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperBtnText: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  stepperValue: { fontSize: 18, fontWeight: '800', color: Colors.text, minWidth: 30, textAlign: 'center' },
  saveBtn: {
    marginTop: 16, backgroundColor: Colors.primary, paddingVertical: 14,
    borderRadius: 14, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  // Copy modal specific
  copyHint: {
    fontSize: 13, color: Colors.textSecondary, marginBottom: 14,
    backgroundColor: Colors.primaryLight, padding: 10, borderRadius: 10,
  },
  shortcutRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  shortcutBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  shortcutText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  copyDayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  copyDayPill: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  copyDayPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  copyDayText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  copyDayTextActive: { color: Colors.white },
  blockedInfo: {
    backgroundColor: '#FFF8E1', borderRadius: 10, padding: 10, marginBottom: 12,
    borderWidth: 1, borderColor: '#FFD54F',
  },
  blockedInfoTitle: { fontSize: 12, fontWeight: '700', color: '#B45309', marginBottom: 4 },
  blockedInfoItem: { fontSize: 12, color: '#92400E', marginBottom: 2 },
  timePillConflicted: { backgroundColor: '#FFF3CD', borderColor: '#FFC107' },
  timePillTextConflicted: { color: '#92400E' },
  overlapError: {
    backgroundColor: '#FFF3CD', borderRadius: 8, padding: 8, marginBottom: 8,
    borderWidth: 1, borderColor: '#FFC107',
  },
  overlapErrorText: { fontSize: 12, color: '#92400E', fontWeight: '600' },
});
