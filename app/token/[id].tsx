import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Hospital, Lightbulb, Zap, ChevronLeft } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../context/LanguageContext';
import LiveTokenCard from '../../components/LiveTokenCard';
import LocalizedName from '../../components/LocalizedName';
import Button from '../../components/Button';
import { useDoctor } from '../../hooks/useApiHooks';
import { crossPlatformShadow } from '../../utils/shadow';

export default function TokenTrackerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const router = useRouter();
  const { data: doctor, isLoading } = useDoctor(id || '');
  const yourToken = 7;
  const [currentToken, setCurrentToken] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentToken((prev) => {
        if (prev >= yourToken) {
          clearInterval(interval);
          return yourToken;
        }
        return prev + 1;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [yourToken]);

  const handleSpeedUp = () => {
    setCurrentToken((prev) => Math.min(prev + 1, yourToken));
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
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
        <LiveTokenCard
          currentToken={currentToken}
          yourToken={yourToken}
          doctorName={doctor.name}
        />

        <View style={styles.hospitalInfo}>
          <Hospital size={24} color={Colors.primary} strokeWidth={1.8} />
          <View>
            <LocalizedName name={doctor.hospital?.name || ''} style={styles.hospitalName} />
            <Text style={styles.hospitalAddress}>{doctor.hospital?.address || ''}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.speedBtn} onPress={handleSpeedUp}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Zap size={14} color={Colors.tokenPurple} strokeWidth={2.5} />
            <Text style={styles.speedBtnText}>Demo: Next Token</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.tipsCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Lightbulb size={16} color={Colors.text} strokeWidth={2} />
            <Text style={styles.tipsTitle}>Tips</Text>
          </View>
          <Text style={styles.tipText}>• Keep this screen open to track your token</Text>
          <Text style={styles.tipText}>• Each token takes about 5 minutes</Text>
          <Text style={styles.tipText}>• You will see a notification when it is your turn</Text>
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
  content: {
    flex: 1,
    padding: 16,
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
    ...crossPlatformShadow({ color: Colors.shadowDark, offsetY: 3, opacity: 0.08, radius: 10, elevation: 3 }),
  },
  hospitalEmoji: {
    fontSize: 28,
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
    ...crossPlatformShadow({ color: Colors.shadowDark, offsetY: 3, opacity: 0.08, radius: 10, elevation: 3 }),
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
