import { useLocalSearchParams, useRouter } from 'expo-router';
import { Hospital, Lightbulb, Zap, Radio, CalendarClock } from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../components/Button';
import EcgLoader from '../../components/EcgLoader';
import LiveTokenCard from '../../components/LiveTokenCard';
import LocalizedName from '../../components/LocalizedName';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../context/LanguageContext';
import { useDoctor, useLiveQueue, useMyToken } from '../../hooks/useApiHooks';
import { crossPlatformShadow } from '../../utils/shadow';

import { contentColumn } from '@/theme';

/**
 * Live token tracker — REAL queue data.
 *
 * Params: id = doctorId (existing contract), plus optional bookingId and
 * myToken so the screen can show the patient's own position.
 * Data: GET /tokens/doctor/{id}/live (10s polling) and, when a bookingId is
 * present, GET /tokens/my-token/{bookingId}.
 *
 * When the queue hasn't started, an honest empty state is shown; dev builds
 * additionally offer the old simulated walkthrough behind a "Demo" pill.
 */
export default function TokenTrackerScreen() {
  const {
    id,
    bookingId,
    myToken: myTokenParam,
  } = useLocalSearchParams<{ id: string; bookingId?: string; myToken?: string }>();
  const { t } = useLanguage();
  const router = useRouter();

  const { data: doctor, isLoading } = useDoctor(id || '');
  const { data: liveQueue, error: queueError } = useLiveQueue(id || '');
  const { data: myPosition } = useMyToken(bookingId || '', { enabled: !!bookingId });

  // Dev-only simulated walkthrough (the queue may be idle outside clinic hours).
  const [demoMode, setDemoMode] = useState(false);
  const [demoToken, setDemoToken] = useState(1);
  const DEMO_YOUR_TOKEN = 7;

  const yourToken =
    myPosition?.tokenNumber ?? (myTokenParam ? parseInt(String(myTokenParam), 10) : undefined);
  const liveCurrent = myPosition?.currentToken ?? liveQueue?.currentToken;
  const estimatedWait = myPosition?.estimatedWaitMinutes ?? liveQueue?.estimatedWaitMinutes;
  // currentToken 0 = queue not started (first patient is token 1) — show the
  // honest empty state instead of a "LIVE" zero.
  const hasLive = typeof liveCurrent === 'number' && liveCurrent > 0 && !queueError;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <EcgLoader width={140} height={36} />
        </View>
      </SafeAreaView>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('liveTokenTracker')}</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {demoMode ? (
          <>
            <View style={styles.demoPill}>
              <Zap size={12} color={Colors.tokenPurple} strokeWidth={2.5} />
              <Text style={styles.demoPillText}>DEMO MODE — simulated queue</Text>
            </View>
            <LiveTokenCard
              currentToken={demoToken}
              yourToken={DEMO_YOUR_TOKEN}
              doctorName={doctor.name}
            />
            <TouchableOpacity
              style={styles.speedBtn}
              onPress={() => setDemoToken((p) => Math.min(p + 1, DEMO_YOUR_TOKEN))}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Zap size={14} color={Colors.tokenPurple} strokeWidth={2.5} />
                <Text style={styles.speedBtnText}>Demo: Next Token</Text>
              </View>
            </TouchableOpacity>
          </>
        ) : hasLive && typeof yourToken === 'number' ? (
          <LiveTokenCard
            currentToken={liveCurrent}
            yourToken={yourToken}
            doctorName={doctor.name}
            estimatedWaitMinutes={estimatedWait}
          />
        ) : hasLive ? (
          // Queue-only view: live state without a personal booking position.
          <View style={styles.queueOnlyCard}>
            <View style={styles.queueOnlyHeader}>
              <Radio size={14} color="#EF4444" strokeWidth={2.5} />
              <Text style={styles.queueOnlyTitle}>LIVE QUEUE</Text>
            </View>
            <Text style={styles.queueOnlyNumber}>{liveCurrent}</Text>
            <Text style={styles.queueOnlyLabel}>{t('currentToken')}</Text>
            {typeof liveQueue?.totalTokens === 'number' && (
              <Text style={styles.queueOnlyMeta}>{liveQueue.totalTokens} tokens today</Text>
            )}
            {typeof estimatedWait === 'number' && (
              <Text style={styles.queueOnlyMeta}>~{estimatedWait} min estimated wait</Text>
            )}
          </View>
        ) : (
          // Honest empty state — the queue hasn't started.
          <View style={styles.emptyCard}>
            <CalendarClock size={40} color={Colors.textLight} strokeWidth={1.6} />
            <Text style={styles.emptyTitle}>Queue hasn&apos;t started yet</Text>
            <Text style={styles.emptyDesc}>
              Live updates appear here once the clinic starts seeing patients on your visit day.
            </Text>
            {__DEV__ && (
              <TouchableOpacity style={styles.speedBtn} onPress={() => setDemoMode(true)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Zap size={14} color={Colors.tokenPurple} strokeWidth={2.5} />
                  <Text style={styles.speedBtnText}>Run demo walkthrough</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.hospitalInfo}>
          <Hospital size={24} color={Colors.primary} strokeWidth={1.8} />
          <View>
            <LocalizedName name={doctor.hospital?.name || ''} style={styles.hospitalName} />
            <Text style={styles.hospitalAddress}>{doctor.hospital?.address || ''}</Text>
          </View>
        </View>

        <View style={styles.tipsCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Lightbulb size={16} color={Colors.text} strokeWidth={2} />
            <Text style={styles.tipsTitle}>Tips</Text>
          </View>
          <Text style={styles.tipText}>• Keep this screen open to track your token</Text>
          <Text style={styles.tipText}>• Each token takes about 5 minutes</Text>
          <Text style={styles.tipText}>• Updates refresh automatically every 10 seconds</Text>
        </View>

        <Button
          title={t('goHome')}
          variant="outline"
          onPress={() => router.replace('/(tabs)')}
          style={styles.homeBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  backBtn: {
    padding: 4,
  },
  backText: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  headerRight: {
    width: 32,
  },
  content: { ...contentColumn, flex: 1, padding: 16 },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: Colors.tokenPurpleLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.tokenPurple,
    letterSpacing: 0.8,
  },
  queueOnlyCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.tokenPurpleLight,
    ...crossPlatformShadow({
      color: Colors.tokenPurple,
      offsetY: 8,
      opacity: 0.12,
      radius: 20,
      elevation: 8,
    }),
  },
  queueOnlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.tokenPurpleLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
  },
  queueOnlyTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.tokenPurple,
    letterSpacing: 1.2,
  },
  queueOnlyNumber: {
    fontSize: 56,
    fontWeight: '900',
    color: Colors.tokenPurple,
  },
  queueOnlyLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  queueOnlyMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  hospitalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 3,
      opacity: 0.08,
      radius: 10,
      elevation: 3,
    }),
  },
  hospitalName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  hospitalAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  speedBtn: {
    backgroundColor: Colors.tokenPurpleLight,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: Colors.tokenPurple + '30',
  },
  speedBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.tokenPurple,
  },
  tipsCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 3,
      opacity: 0.08,
      radius: 10,
      elevation: 3,
    }),
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  homeBtn: {
    marginTop: 8,
  },
});
