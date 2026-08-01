/**
 * NextVisitCard — "Your visit" live card on the home screen.
 *
 * Shows the patient's earliest upcoming CONFIRMED booking. On the visit day it
 * embeds a live queue strip (now serving / your token / est. wait) polled via
 * useLiveQueue and deep-links into the live token tracker. Renders null when
 * logged out (never triggers the authed bookings call) or when there is no
 * valid upcoming booking.
 */
import { useRouter } from 'expo-router';
import { Calendar, Clock, Hospital, Radio, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useUpcomingBookings, useLiveQueue } from '../../hooks/useApiHooks';
import { crossPlatformShadow } from '../../utils/shadow';

/** "2026-05-08" → "Fri, 8 May" */
function formatBookingDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

function ensureDoctorPrefix(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  return /^dr\.?\s/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`;
}

export default function NextVisitCard() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const { data: upcoming } = useUpcomingBookings(undefined, { enabled: isLoggedIn });

  const todayIso = new Date().toISOString().slice(0, 10);
  const next = (upcoming ?? [])
    .filter((b) => b.status === 'CONFIRMED' && b.bookingDate >= todayIso)
    .sort((a, b) =>
      a.bookingDate === b.bookingDate
        ? a.slotStart.localeCompare(b.slotStart)
        : a.bookingDate.localeCompare(b.bookingDate),
    )[0];

  const isToday = !!next && next.bookingDate === todayIso;
  // Poll the queue only on the visit day — pointless traffic otherwise.
  const { data: liveQueue } = useLiveQueue(next?.doctorId ?? '', { enabled: isToday });
  // currentToken 0 = queue not started; only claim "live" once it's moving.
  const hasLive =
    isToday && typeof liveQueue?.currentToken === 'number' && liveQueue.currentToken > 0;

  if (!isLoggedIn || !next) return null;

  const openTarget = () => {
    if (isToday) {
      router.push({
        pathname: '/token/[id]',
        params: {
          id: String(next.doctorId),
          bookingId: String(next.id),
          myToken: String(next.tokenNumber),
        },
      });
    } else {
      router.push({ pathname: '/booking/view/[id]', params: { id: String(next.id) } });
    }
  };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={openTarget}>
      <View style={styles.accent} />

      <View style={styles.headerRow}>
        <Text style={styles.kicker}>{isToday ? 'YOUR VISIT — TODAY' : 'YOUR NEXT VISIT'}</Text>
        <View style={styles.tokenBadge}>
          <Text style={styles.tokenBadgeText}>Token #{next.tokenNumber}</Text>
        </View>
      </View>

      <Text style={styles.doctorName} numberOfLines={1}>
        {ensureDoctorPrefix(next.doctorName)}
      </Text>
      <Text style={styles.specialization} numberOfLines={1}>
        {next.specialization}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Calendar size={12} color={Colors.primary} strokeWidth={2.5} />
          <Text style={styles.metaText}>{formatBookingDate(next.bookingDate)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Clock size={12} color={Colors.textSecondary} strokeWidth={2.5} />
          <Text style={styles.metaText}>{next.slotStart}</Text>
        </View>
        <View style={[styles.metaItem, { flexShrink: 1 }]}>
          <Hospital size={12} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.metaText} numberOfLines={1}>
            {next.hospitalName}
          </Text>
        </View>
      </View>

      {hasLive && liveQueue && (
        <View style={styles.liveStrip}>
          <Radio size={13} color="#EF4444" strokeWidth={2.5} />
          <Text style={styles.liveText} numberOfLines={1}>
            Now serving #{liveQueue.currentToken} · you&apos;re #{next.tokenNumber}
            {typeof liveQueue.estimatedWaitMinutes === 'number'
              ? ` · ~${liveQueue.estimatedWaitMinutes} min`
              : ''}
          </Text>
        </View>
      )}

      <View style={styles.ctaRow}>
        <Text style={styles.ctaText}>{isToday ? 'Track live' : 'View booking'}</Text>
        <ChevronRight size={15} color={Colors.primary} strokeWidth={2.5} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    paddingLeft: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 4,
      opacity: 0.1,
      radius: 14,
      elevation: 4,
    }),
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.primary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 1.2,
  },
  tokenBadge: {
    backgroundColor: Colors.tokenPurpleLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tokenBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.tokenPurple,
  },
  doctorName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  specialization: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  liveStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 10,
  },
  liveText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#B91C1C',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    marginTop: 10,
  },
  ctaText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Colors.primary,
  },
});
