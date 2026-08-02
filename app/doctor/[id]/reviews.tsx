/**
 * Paginated reviews for a doctor — opened from "See all reviews" on the profile.
 */
import { Colors } from '@constants/Colors';
import { useLanguage } from '@context/LanguageContext';
import { spacing } from '@theme/spacing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Star } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDoctorReviewsPaged } from '../../../hooks/useApiHooks';

import { contentColumn } from '@/theme';

const PAGE_SIZE = 10;

export default function DoctorReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const [page, setPage] = useState(0);
  const { data, isLoading, isFetching } = useDoctorReviewsPaged(id ?? '', {
    page,
    size: PAGE_SIZE,
  });

  const reviews = data?.content ?? [];
  const isFirst = data?.isFirst ?? true;
  const isLast = data?.isLast ?? true;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ChevronLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('reviewsAndRatings') || 'Reviews & Ratings'}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} />
        ) : reviews.length === 0 ? (
          <Text style={styles.empty}>{t('noReviewsYet') || 'No reviews yet.'}</Text>
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{r.userName}</Text>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={13}
                      color={n <= r.rating ? Colors.gold : Colors.textSecondary}
                      fill={n <= r.rating ? Colors.gold : 'transparent'}
                      strokeWidth={2}
                    />
                  ))}
                </View>
              </View>
              {r.comment ? <Text style={styles.comment}>{r.comment}</Text> : null}
            </View>
          ))
        )}

        {(reviews.length > 0 || page > 0) && (
          <View style={styles.pager}>
            <TouchableOpacity
              disabled={isFirst || isFetching}
              onPress={() => setPage((p) => Math.max(0, p - 1))}
              style={[styles.pagerBtn, (isFirst || isFetching) && styles.pagerBtnDisabled]}
            >
              <Text style={styles.pagerText}>{t('previous') || 'Previous'}</Text>
            </TouchableOpacity>
            <Text style={styles.pagerPage}>
              {(data?.page ?? 0) + 1} / {data?.totalPages ?? 1}
            </Text>
            <TouchableOpacity
              disabled={isLast || isFetching}
              onPress={() => setPage((p) => p + 1)}
              style={[styles.pagerBtn, (isLast || isFetching) && styles.pagerBtnDisabled]}
            >
              <Text style={styles.pagerText}>{t('next') || 'Next'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: Colors.background,
  },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollContent: { ...contentColumn, padding: spacing.base, paddingBottom: spacing.xl3 },
  empty: { textAlign: 'center', color: Colors.textSecondary, marginTop: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: { fontSize: 14, fontWeight: '600', color: Colors.text },
  stars: { flexDirection: 'row', gap: 2 },
  comment: { fontSize: 13, color: Colors.text, lineHeight: 19 },
  pager: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  pagerBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  pagerBtnDisabled: { backgroundColor: Colors.borderLight },
  pagerText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  pagerPage: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
});
