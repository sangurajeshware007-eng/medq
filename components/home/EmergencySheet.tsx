/**
 * EmergencySheet — bottom sheet listing the nearest 24×7 hospitals.
 *
 * Opened by the home screen's Emergency quick action. Reuses the already-
 * fetched nearby-hospitals list (no new fetch): the 3 nearest `isOpen24x7`
 * hospitals with Call (when a phone exists) and Directions actions; tapping a
 * row opens the hospital detail. Honest empty state links to /nearme.
 */
import { useRouter } from 'expo-router';
import { Phone, Navigation, Siren, X, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Platform } from 'react-native';

import { Colors } from '../../constants/Colors';
import type { HospitalListItem } from '../../services/hospitalService';
import { FORM_MAX_WIDTH } from '../../theme';

interface EmergencySheetProps {
  visible: boolean;
  onClose: () => void;
  hospitals: HospitalListItem[];
}

function sanitizePhone(raw: string) {
  return raw.replace(/[^\d+]/g, '');
}

function callNumber(raw: string) {
  const num = sanitizePhone(raw);
  if (num) Linking.openURL(`tel:${num}`).catch(() => {});
}

function openDirections(h: HospitalListItem) {
  const query = encodeURIComponent(h.name + (h.address ? `, ${h.address}` : ''));
  const url = Platform.select({
    ios: `http://maps.apple.com/?q=${query}`,
    default: `https://www.google.com/maps/search/?api=1&query=${query}`,
  });
  Linking.openURL(url).catch(() => {});
}

export default function EmergencySheet({ visible, onClose, hospitals }: EmergencySheetProps) {
  const router = useRouter();

  const open24x7 = hospitals
    .filter((h) => h.isOpen24x7)
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
    .slice(0, 3);

  const goToHospital = (id: string) => {
    onClose();
    router.push({ pathname: '/hospital/[id]', params: { id } });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet} onPress={() => {}}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.sirenWrap}>
                <Siren size={18} color="#DC2626" strokeWidth={2.2} />
              </View>
              <View>
                <Text style={styles.title}>Emergency — 24×7 hospitals</Text>
                <Text style={styles.subtitle}>Nearest hospitals open right now</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color={Colors.textSecondary} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          {open24x7.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No 24×7 hospitals found nearby.</Text>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  router.push('/nearme');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.emptyLink}>Browse all hospitals near you →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            open24x7.map((h) => (
              <View key={h.id} style={styles.row}>
                <TouchableOpacity
                  style={styles.rowInfo}
                  onPress={() => goToHospital(h.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.hospitalName} numberOfLines={1}>
                    {h.name}
                  </Text>
                  <Text style={styles.hospitalMeta} numberOfLines={1}>
                    {typeof h.distanceKm === 'number' ? `${h.distanceKm.toFixed(1)} km · ` : ''}
                    {h.address}
                  </Text>
                </TouchableOpacity>
                <View style={styles.actions}>
                  {!!h.phone && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.callBtn]}
                      onPress={() => callNumber(h.phone!)}
                      activeOpacity={0.8}
                    >
                      <Phone size={15} color={Colors.white} strokeWidth={2.2} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => openDirections(h)}
                    activeOpacity={0.8}
                  >
                    <Navigation size={15} color={Colors.primary} strokeWidth={2.2} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => goToHospital(h.id)} activeOpacity={0.7}>
                    <ChevronRight size={18} color={Colors.textLight} strokeWidth={2.2} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 34,
    width: '100%',
    maxWidth: FORM_MAX_WIDTH,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  sirenWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 10,
  },
  rowInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.text,
  },
  hospitalMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtn: {
    backgroundColor: '#DC2626',
  },
  empty: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});
