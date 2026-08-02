/**
 * QueueConsole — the doctor's live OPD queue for today.
 *
 * States:
 *  - NOT_STARTED / ENDED → hero card with counts + "Start Session"
 *  - ACTIVE → big current-token display, Call Next (primary),
 *    Skip / End Session (secondary), skipped-token recall chips,
 *    then today's queue list in token order.
 *
 * Data: useDoctorQueue polls every 10s (reception check-ins appear without
 * any doctor action). Mutations return the full new state and are written
 * straight into the cache by useQueueAction.
 */
import { useRouter } from 'expo-router';
import { ChevronLeft, ListOrdered, Phone, MessageCircle, RotateCcw } from 'lucide-react-native';
import React from 'react';
import {
  Alert,
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../constants/Colors';
import { useDoctorQueue, useQueueAction } from '../../hooks/useApiHooks';
import type { DoctorQueueState, QueueEntry } from '../../services/doctorQueueService';
import Button from '../Button';
import Card from '../Card';

import { sanitizePhone } from './appointmentStatus';
import QueuePatientRow from './QueuePatientRow';

import { contentColumn } from '@/theme';

/** Passed-over patients: checked in, still CONFIRMED, below the current token. */
function skippedEntries(state: DoctorQueueState): QueueEntry[] {
  return state.entries.filter(
    (e) =>
      e.status === 'CONFIRMED' &&
      e.checkedIn &&
      !e.isCurrent &&
      e.tokenNumber < state.currentTokenNumber,
  );
}

export default function QueueConsole() {
  const { data: queue, isLoading, isError, refetch } = useDoctorQueue();
  const queueAction = useQueueAction();

  const runAction = (
    input: Parameters<typeof queueAction.mutate>[0],
    errorTitle = 'Queue update failed',
  ) =>
    queueAction.mutate(input, {
      onError: (err) => {
        const msg = err instanceof Error ? err.message : 'Something went wrong.';
        Alert.alert(errorTitle, msg);
      },
    });

  const confirmSkip = () =>
    Alert.alert(
      'Skip current patient?',
      'The patient stays checked in — recall them anytime from the skipped list.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => runAction({ action: 'skip' }) },
      ],
    );

  const confirmEnd = () =>
    Alert.alert('End today’s session?', 'You can start it again later to resume.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Session', style: 'destructive', onPress: () => runAction({ action: 'end' }) },
    ]);

  const callCurrent = () => {
    const raw = queue?.currentPatient?.patientPhone;
    const num = raw ? sanitizePhone(raw) : '';
    if (num) Linking.openURL(`tel:${num}`).catch(() => {});
  };
  const whatsappCurrent = () => {
    const raw = queue?.currentPatient?.patientPhone;
    const num = raw ? sanitizePhone(raw).replace(/^\+/, '') : '';
    if (num) Linking.openURL(`https://wa.me/${num}`).catch(() => {});
  };

  // ── Loading / error ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isError || !queue) {
    return (
      <View style={styles.center}>
        <ListOrdered size={48} color={Colors.textLight} strokeWidth={1.5} />
        <Text style={styles.emptyTitle}>Couldn’t load the queue.</Text>
        <Button title="Retry" onPress={() => refetch()} variant="outline" size="small" />
      </View>
    );
  }

  const active = queue.sessionStatus === 'ACTIVE';
  const skipped = skippedEntries(queue);
  const isPending = queueAction.isPending;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      {/* ── Inactive session hero ── */}
      {!active && (
        <Card style={styles.heroCard}>
          <ListOrdered size={34} color={Colors.primary} strokeWidth={2} />
          <Text style={styles.heroTitle}>
            {queue.sessionStatus === 'ENDED' ? 'Session ended' : 'No session yet'}
          </Text>
          <Text style={styles.heroSub}>
            {queue.notArrivedCount + queue.waitingCount} booked · {queue.waitingCount} checked in ·{' '}
            {queue.completedCount} done
          </Text>
          <Button
            title={queue.sessionStatus === 'ENDED' ? 'Resume Session' : 'Start Session'}
            onPress={() => runAction({ action: 'start' }, 'Could not start session')}
            loading={isPending}
            style={styles.heroBtn}
          />
        </Card>
      )}

      {/* ── Active session console ── */}
      {active && (
        <>
          <Card style={styles.currentCard}>
            <Text style={styles.currentLabel}>Current Token</Text>
            <Text style={styles.currentToken}>
              {queue.currentTokenNumber > 0 ? queue.currentTokenNumber : '—'}
            </Text>
            {queue.currentPatient ? (
              <View style={styles.currentPatientRow}>
                <Text style={styles.currentPatientName} numberOfLines={1}>
                  {queue.currentPatient.patientName ?? 'Patient'}
                </Text>
                {queue.currentPatient.patientPhone && (
                  <View style={styles.currentActions}>
                    <TouchableOpacity onPress={callCurrent} style={styles.roundBtn} hitSlop={6}>
                      <Phone size={14} color={Colors.primary} strokeWidth={2.4} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={whatsappCurrent}
                      style={styles.roundBtnWhatsapp}
                      hitSlop={6}
                    >
                      <MessageCircle size={14} color={Colors.whatsappGreenDark} strokeWidth={2.4} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.currentPatientHint}>
                {queue.currentTokenNumber > 0
                  ? 'Consultation resolved — call the next patient.'
                  : 'Call the first checked-in patient to begin.'}
              </Text>
            )}
            <View style={styles.countsRow}>
              <Text style={styles.countText}>{queue.waitingCount} waiting</Text>
              <Text style={styles.countDot}>·</Text>
              <Text style={styles.countText}>{queue.notArrivedCount} not arrived</Text>
              <Text style={styles.countDot}>·</Text>
              <Text style={styles.countText}>{queue.completedCount} done</Text>
            </View>
          </Card>

          <Button
            title={
              queue.waitingCount > 0 ? `Call Next (${queue.waitingCount} waiting)` : 'Call Next'
            }
            onPress={() => runAction({ action: 'next' }, 'Could not call next')}
            loading={isPending}
            disabled={queue.waitingCount === 0}
            style={styles.callNextBtn}
          />

          <View style={styles.secondaryRow}>
            <Button
              title="Skip"
              onPress={confirmSkip}
              variant="outline"
              size="small"
              disabled={isPending || queue.currentTokenNumber === 0 || queue.waitingCount === 0}
              style={styles.secondaryBtn}
            />
            <Button
              title="End Session"
              onPress={confirmEnd}
              variant="danger"
              size="small"
              disabled={isPending}
              style={styles.secondaryBtn}
            />
          </View>

          {/* ── Skipped / passed-over chips ── */}
          {skipped.length > 0 && (
            <View style={styles.skippedWrap}>
              <Text style={styles.sectionTitle}>Skipped — tap to recall</Text>
              <View style={styles.chipsRow}>
                {skipped.map((e) => (
                  <TouchableOpacity
                    key={e.bookingId}
                    style={styles.recallChip}
                    disabled={isPending}
                    onPress={() =>
                      runAction({ action: 'recall', bookingId: e.bookingId }, 'Could not recall')
                    }
                  >
                    <RotateCcw size={11} color={Colors.primary} strokeWidth={2.4} />
                    <Text style={styles.recallChipText}>
                      #{e.tokenNumber} {e.patientName ?? 'Patient'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </>
      )}

      {/* ── Today's queue list ── */}
      <Text style={styles.sectionTitle}>Today’s Queue</Text>
      {queue.entries.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No bookings today.</Text>
          <Text style={styles.emptyDesc}>
            Online bookings and reception walk-ins will appear here.
          </Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {queue.entries.map((entry) => (
            <QueuePatientRow key={entry.bookingId} entry={entry} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

export function QueueScreenHeader() {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
        <ChevronLeft size={22} color={Colors.text} strokeWidth={2.5} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Live Queue</Text>
      <View style={{ width: 22 }} />
    </View>
  );
}

export function QueueScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <QueueScreenHeader />
      <QueueConsole />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    ...contentColumn,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 2 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  container: { ...contentColumn, padding: 16, paddingBottom: 40, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },

  heroCard: { alignItems: 'center', gap: 8, paddingVertical: 28 },
  heroTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  heroSub: { fontSize: 12, color: Colors.textSecondary },
  heroBtn: { marginTop: 8, alignSelf: 'stretch' },

  currentCard: { alignItems: 'center', paddingVertical: 20, gap: 4 },
  currentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currentToken: { fontSize: 56, fontWeight: '800', color: Colors.primary, lineHeight: 62 },
  currentPatientRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  currentPatientName: { fontSize: 15, fontWeight: '600', color: Colors.text, maxWidth: 220 },
  currentPatientHint: { fontSize: 12, color: Colors.textLight, textAlign: 'center' },
  currentActions: { flexDirection: 'row', gap: 8 },
  roundBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtnWhatsapp: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.trustGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countsRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  countText: { fontSize: 12, color: Colors.textSecondary },
  countDot: { fontSize: 12, color: Colors.textLight },

  callNextBtn: { alignSelf: 'stretch' },
  secondaryRow: { flexDirection: 'row', gap: 10 },
  secondaryBtn: { flex: 1 },

  skippedWrap: { gap: 6 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recallChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  recallChipText: { fontSize: 12, fontWeight: '600', color: Colors.primary },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.text, marginTop: 4 },
  list: { gap: 8 },
  emptyCard: { alignItems: 'center', gap: 4, paddingVertical: 24 },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  emptyDesc: { fontSize: 12, color: Colors.textLight, textAlign: 'center' },
});
