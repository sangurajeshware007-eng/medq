/**
 * One row in the doctor's live-queue list: token chip, patient name/slot,
 * status badge, and call / WhatsApp deep-link actions.
 */
import { Phone, MessageCircle } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

import { Colors } from '../../constants/Colors';
import type { QueueEntry } from '../../services/doctorQueueService';

import { statusBg, statusColor, statusLabel, sanitizePhone } from './appointmentStatus';

interface QueuePatientRowProps {
  entry: QueueEntry;
}

export default function QueuePatientRow({ entry }: QueuePatientRowProps) {
  const call = () => {
    const num = entry.patientPhone ? sanitizePhone(entry.patientPhone) : '';
    if (num) Linking.openURL(`tel:${num}`).catch(() => {});
  };
  const whatsapp = () => {
    const num = entry.patientPhone ? sanitizePhone(entry.patientPhone).replace(/^\+/, '') : '';
    if (num) Linking.openURL(`https://wa.me/${num}`).catch(() => {});
  };

  const waiting = entry.status === 'CONFIRMED' && entry.checkedIn;

  return (
    <View style={[styles.row, entry.isCurrent && styles.rowCurrent]}>
      <View style={[styles.tokenChip, entry.isCurrent && styles.tokenChipCurrent]}>
        <Text style={[styles.tokenText, entry.isCurrent && styles.tokenTextCurrent]}>
          {entry.tokenNumber}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {entry.patientName ?? 'Patient'}
        </Text>
        <Text style={styles.meta}>
          {entry.slotStart}
          {waiting && !entry.isCurrent ? ' · Waiting' : ''}
          {!entry.checkedIn && entry.status === 'CONFIRMED' ? ' · Not arrived' : ''}
        </Text>
      </View>

      {entry.isCurrent ? (
        <View style={[styles.badge, { backgroundColor: Colors.primaryLight }]}>
          <Text style={[styles.badgeText, { color: Colors.primary }]}>In Room</Text>
        </View>
      ) : (
        <View style={[styles.badge, { backgroundColor: statusBg(entry.status) }]}>
          <Text style={[styles.badgeText, { color: statusColor(entry.status) }]}>
            {statusLabel(entry.status)}
          </Text>
        </View>
      )}

      {entry.patientPhone && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={call} style={styles.actionBtn} hitSlop={6}>
            <Phone size={13} color={Colors.primary} strokeWidth={2.4} />
          </TouchableOpacity>
          <TouchableOpacity onPress={whatsapp} style={styles.actionBtnWhatsapp} hitSlop={6}>
            <MessageCircle size={13} color={Colors.whatsappGreenDark} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  rowCurrent: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  tokenChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenChipCurrent: { backgroundColor: Colors.primary },
  tokenText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  tokenTextCurrent: { color: Colors.cardBg },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '600', color: Colors.text },
  meta: { fontSize: 11, color: Colors.textLight, marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnWhatsapp: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.trustGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
