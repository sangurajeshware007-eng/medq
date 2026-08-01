import { Radio, PartyPopper, Clock } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';

import { Colors } from '../constants/Colors';
import { useLanguage } from '../context/LanguageContext';
import { crossPlatformShadow } from '../utils/shadow';

import LocalizedName from './LocalizedName';

// Animated.loop doesn't iterate with the native driver on react-native-web —
// JS driver on web (loops fine there), native driver elsewhere.
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface LiveTokenCardProps {
  currentToken: number;
  yourToken: number;
  doctorName: string;
}

export default function LiveTokenCard({ currentToken, yourToken, doctorName }: LiveTokenCardProps) {
  const { t } = useLanguage();

  // Subtle heartbeat on the live number — makes "it's live" visceral without
  // being distracting. Restarts on every token change for a stronger beat.
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    pulse.setValue(1.12);
    Animated.spring(pulse, { toValue: 1, friction: 3, useNativeDriver: USE_NATIVE_DRIVER }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 900, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [currentToken, pulse]);

  const tokensBefore = Math.max(0, yourToken - currentToken);
  const estimatedMinutes = tokensBefore * 5;
  const isYourTurn = currentToken >= yourToken;
  const progress = yourToken > 0 ? Math.min((currentToken / yourToken) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      {/* Glowing header */}
      <View style={styles.headerBar}>
        <Radio size={14} color="#EF4444" strokeWidth={2.5} />
        <Text style={styles.headerTitle}>LIVE TOKEN TRACKER</Text>
      </View>

      <LocalizedName name={doctorName} style={styles.doctorName} />

      {/* Current Token — HUGE & Glowing */}
      <View style={styles.tokenSection}>
        <Text style={styles.tokenLabel}>{t('currentToken')}</Text>
        <Animated.View
          style={[
            styles.tokenCircle,
            isYourTurn && styles.tokenCircleActive,
            { transform: [{ scale: pulse }] },
          ]}
        >
          <View style={[styles.tokenInner, isYourTurn && styles.tokenInnerActive]}>
            <Text style={[styles.tokenNumber, isYourTurn && styles.tokenNumberActive]}>
              {currentToken}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Your Token Badge */}
      <View style={styles.yourTokenSection}>
        <Text style={styles.yourTokenLabel}>{t('yourTokenNumber')}</Text>
        <View style={styles.yourTokenBadge}>
          <Text style={styles.yourTokenNumber}>#{yourToken}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%` },
              isYourTurn && styles.progressFillActive,
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>

      {/* Status */}
      {isYourTurn ? (
        <View style={styles.turnBanner}>
          <PartyPopper size={28} color={Colors.trustGreen} strokeWidth={2} />
          <Text style={styles.turnText}>{t('yourTurn')}</Text>
        </View>
      ) : (
        <View style={styles.waitInfo}>
          <View style={styles.waitItem}>
            <Text style={styles.waitNumber}>{tokensBefore}</Text>
            <Text style={styles.waitLabel}>{t('tokensBefore')}</Text>
          </View>
          <View style={styles.waitDivider} />
          <View style={styles.waitItem}>
            <Text style={styles.waitNumber}>~{estimatedMinutes}</Text>
            <Text style={styles.waitLabel}>{t('minutes')}</Text>
          </View>
        </View>
      )}

      {!isYourTurn && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 12,
          }}
        >
          <Clock size={14} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.pleaseWait}>{t('pleaseWait')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    ...crossPlatformShadow({
      color: Colors.tokenPurple,
      offsetY: 8,
      opacity: 0.15,
      radius: 24,
      elevation: 10,
    }),
    borderWidth: 1.5,
    borderColor: Colors.tokenPurpleLight,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tokenPurpleLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 6,
  },
  pulseIcon: {
    fontSize: 10,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.tokenPurple,
    letterSpacing: 1.5,
  },
  doctorName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 18,
    fontWeight: '600',
  },
  tokenSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  tokenLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.tokenPurple,
    marginBottom: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tokenCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.tokenPurpleGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.tokenPurple + '30',
  },
  tokenCircleActive: {
    backgroundColor: Colors.trustGreenGlow,
    borderColor: Colors.trustGreen + '30',
  },
  tokenInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.tokenPurpleLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.tokenPurple,
    ...crossPlatformShadow({
      color: Colors.tokenPurple,
      offsetY: 0,
      opacity: 0.35,
      radius: 16,
      elevation: 8,
    }),
  },
  tokenInnerActive: {
    backgroundColor: Colors.trustGreenLight,
    borderColor: Colors.trustGreen,
    ...crossPlatformShadow({
      color: Colors.trustGreen,
      offsetY: 0,
      opacity: 0.35,
      radius: 16,
      elevation: 8,
    }),
  },
  tokenNumber: {
    fontSize: 52,
    fontWeight: '900',
    color: Colors.tokenPurple,
  },
  tokenNumberActive: {
    color: Colors.trustGreen,
  },
  yourTokenSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  yourTokenLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  yourTokenBadge: {
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.gold,
    ...crossPlatformShadow({
      color: Colors.gold,
      offsetY: 2,
      opacity: 0.2,
      radius: 6,
      elevation: 3,
    }),
  },
  yourTokenNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.gold,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 18,
    gap: 10,
  },
  progressBg: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: Colors.tokenPurple,
  },
  progressFillActive: {
    backgroundColor: Colors.trustGreen,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.tokenPurple,
    minWidth: 40,
    textAlign: 'right',
  },
  turnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.trustGreenLight,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 18,
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.trustGreen + '40',
  },
  turnEmoji: {
    fontSize: 22,
  },
  turnText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.trustGreen,
  },
  waitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 12,
  },
  waitItem: {
    alignItems: 'center',
  },
  waitNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.tokenPurple,
  },
  waitLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500',
    marginTop: 2,
  },
  waitDivider: {
    width: 1.5,
    height: 36,
    backgroundColor: Colors.border,
    borderRadius: 1,
  },
  pleaseWait: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
});
