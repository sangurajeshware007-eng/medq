/**
 * Doctor Time Off screen.
 *
 * The doctor blocks one or more full days as unavailable. On those dates,
 * patients see no slots and any pending/confirmed bookings are auto-cancelled
 * server-side (with the same BookingCancelled event used for normal cancels).
 */
import { useRouter } from 'expo-router';
import { ChevronLeft, CalendarOff, Trash2, AlertTriangle, Plus } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Calendar as CalendarView, type DateData } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../constants/Colors';
import { useTimeOffList, useCreateTimeOff, useDeleteTimeOff } from '../../hooks/useApiHooks';
import type { TimeOffEntry } from '../../services/timeOffService';

import { formColumn } from '@/theme';

const today = () => new Date().toISOString().slice(0, 10);

function formatRange(start: string, end: string) {
  if (start === end) return formatPretty(start);
  return `${formatPretty(start)} → ${formatPretty(end)}`;
}

function formatPretty(iso: string) {
  // Avoid Date timezone surprises — split the YYYY-MM-DD manually.
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function daysBetween(a: string, b: string) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const ms = new Date(by, bm - 1, bd).getTime() - new Date(ay, am - 1, ad).getTime();
  return Math.floor(ms / 86_400_000) + 1; // inclusive
}

export default function TimeOffScreen() {
  const router = useRouter();
  const { data: entries = [], isLoading } = useTimeOffList();
  const createMutation = useCreateTimeOff();
  const deleteMutation = useDeleteTimeOff();

  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  // Build the markedDates object: existing blocked days red, the doctor's
  // pending picks teal (in "period" style spanning start → end).
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    entries.forEach((e) => {
      const span = enumerateDates(e.startDate, e.endDate);
      span.forEach((d, i) => {
        marks[d] = {
          color: Colors.error,
          textColor: Colors.white,
          startingDay: i === 0,
          endingDay: i === span.length - 1,
        };
      });
    });
    if (startDate && endDate) {
      const span = enumerateDates(startDate, endDate);
      span.forEach((d, i) => {
        marks[d] = {
          ...(marks[d] ?? {}),
          color: Colors.primary,
          textColor: Colors.white,
          startingDay: i === 0,
          endingDay: i === span.length - 1,
        };
      });
    } else if (startDate) {
      marks[startDate] = {
        color: Colors.primary,
        textColor: Colors.white,
        startingDay: true,
        endingDay: true,
      };
    }
    return marks;
  }, [entries, startDate, endDate]);

  const handleDayPress = (day: DateData) => {
    const picked = day.dateString;
    if (!startDate || (startDate && endDate)) {
      setStartDate(picked);
      setEndDate(null);
      return;
    }
    if (picked < startDate) {
      setStartDate(picked);
      setEndDate(null);
      return;
    }
    setEndDate(picked);
  };

  const canSubmit = !!startDate && !!endDate && !createMutation.isPending;

  const handleSubmit = () => {
    if (!startDate || !endDate) return;
    const dayCount = daysBetween(startDate, endDate);
    Alert.alert(
      `Block ${dayCount} day${dayCount === 1 ? '' : 's'}?`,
      `${formatRange(startDate, endDate)}\n\n` +
        'Any pending or confirmed bookings in this range will be cancelled and patients will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await createMutation.mutateAsync({
                startDate,
                endDate,
                reason: reason.trim() || undefined,
              });
              setStartDate(null);
              setEndDate(null);
              setReason('');
              Alert.alert(
                'Time off blocked',
                result.affectedBookingsCount > 0
                  ? `Done. ${result.affectedBookingsCount} booking${result.affectedBookingsCount === 1 ? '' : 's'} cancelled.`
                  : 'Done. No bookings were affected.',
              );
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Unable to block dates.';
              Alert.alert('Could not block', message);
            }
          },
        },
      ],
    );
  };

  const confirmDelete = (entry: TimeOffEntry) => {
    Alert.alert(
      'Remove time off?',
      `${formatRange(entry.startDate, entry.endDate)} will be unblocked. Already-cancelled bookings will NOT be restored.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(entry.id);
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Unable to remove entry.';
              Alert.alert('Could not remove', message);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <ChevronLeft size={22} color={Colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Time Off</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>Block New Dates</Text>
          <Text style={styles.sectionHint}>
            Tap a start date, then a later end date. Single-day off: tap the same day twice.
          </Text>

          <View style={styles.calendarWrap}>
            <CalendarView
              minDate={today()}
              markingType="period"
              markedDates={markedDates}
              onDayPress={handleDayPress}
              theme={{
                todayTextColor: Colors.primary,
                arrowColor: Colors.primary,
                selectedDayBackgroundColor: Colors.primary,
              }}
            />
          </View>

          {startDate && (
            <View style={styles.selectionCard}>
              <Text style={styles.selectionLabel}>
                {endDate
                  ? `Selected: ${formatRange(startDate, endDate)} (${daysBetween(startDate, endDate)} day${daysBetween(startDate, endDate) === 1 ? '' : 's'})`
                  : `Start: ${formatPretty(startDate)} · pick an end date`}
              </Text>
            </View>
          )}

          <Text style={styles.label}>Reason (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Conference, family event, sick leave"
            placeholderTextColor={Colors.textLight}
            value={reason}
            onChangeText={setReason}
            maxLength={500}
          />

          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.8}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Plus size={16} color={Colors.white} strokeWidth={2.5} />
                <Text style={styles.submitBtnText}>Block These Dates</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Upcoming Time Off</Text>
          {isLoading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 12 }} />}
          {!isLoading && entries.length === 0 && (
            <View style={styles.emptyCard}>
              <CalendarOff size={28} color={Colors.textLight} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No blocked dates yet</Text>
              <Text style={styles.emptyHint}>
                Pick a date range above to take time off — your availability will reopen
                automatically after the end date.
              </Text>
            </View>
          )}
          {entries.map((e) => (
            <View key={e.id} style={styles.entryCard}>
              <View style={styles.entryRow}>
                <CalendarOff size={18} color={Colors.error} strokeWidth={2.2} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.entryRange}>{formatRange(e.startDate, e.endDate)}</Text>
                  {e.reason ? <Text style={styles.entryReason}>{e.reason}</Text> : null}
                </View>
                <TouchableOpacity
                  onPress={() => confirmDelete(e)}
                  style={styles.entryDeleteBtn}
                  hitSlop={8}
                >
                  <Trash2 size={16} color={Colors.error} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.footer}>
            <AlertTriangle size={14} color={Colors.textSecondary} strokeWidth={2} />
            <Text style={styles.footerText}>
              Patients see your blocked dates as "no slots available." Past entries can't be
              removed.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function enumerateDates(start: string, end: string): string[] {
  const out: string[] = [];
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  const cur = new Date(sy, sm - 1, sd);
  const stop = new Date(ey, em - 1, ed);
  while (cur <= stop) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    out.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  content: { ...formColumn, padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  sectionHint: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },
  calendarWrap: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  selectionCard: {
    marginTop: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  selectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text, marginTop: 16, marginBottom: 6 },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  submitBtn: {
    marginTop: 18,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: Colors.white, fontSize: 15, fontWeight: '800' },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 24 },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 6,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginTop: 6 },
  emptyHint: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  entryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 8,
  },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  entryRange: { fontSize: 14, fontWeight: '700', color: Colors.text },
  entryReason: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  entryDeleteBtn: { padding: 4 },
  footer: {
    ...formColumn,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  footerText: { fontSize: 12, color: Colors.textSecondary, flex: 1, lineHeight: 17 },
});
