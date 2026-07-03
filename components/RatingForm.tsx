import { Colors } from '@constants/Colors';
import { spacing } from '@theme/spacing';
import { X, Star } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import { useLanguage } from '../context/LanguageContext';
import { useSubmitReview, useUpdateReview } from '../hooks/useApiHooks';

import Button from './Button';

interface RatingFormProps {
  visible: boolean;
  bookingId: string;
  doctorName: string;
  initialRating?: number;
  initialComment?: string | null;
  /** Set when editing an existing review. Switches the form into edit mode. */
  reviewId?: string | null;
  onClose: () => void;
  onSubmitted?: () => void;
}

const COMMENT_MAX = 500;

export default function RatingForm({
  visible,
  bookingId,
  doctorName,
  initialRating = 0,
  initialComment = '',
  reviewId,
  onClose,
  onSubmitted,
}: RatingFormProps) {
  const { t } = useLanguage();
  const [rating, setRating] = useState<number>(initialRating);
  const [comment, setComment] = useState<string>(initialComment ?? '');
  const [error, setError] = useState<string | null>(null);

  const submit = useSubmitReview();
  const update = useUpdateReview();
  const isEdit = !!reviewId;
  const isSubmitting = submit.isPending || update.isPending;

  const handleSubmit = () => {
    if (rating < 1 || rating > 5) {
      setError(t('rateYourVisitErrorPickStars') || 'Please tap a star to rate.');
      return;
    }
    setError(null);
    const trimmed = comment.trim();
    const payload = { rating, comment: trimmed.length === 0 ? null : trimmed };

    const onSuccess = () => {
      onSubmitted?.();
      onClose();
    };
    const onError = (e: { message?: string }) => {
      setError(e.message || t('reviewSubmitFailed') || 'Could not submit your review.');
    };

    if (isEdit && reviewId) {
      update.mutate({ reviewId, data: payload }, { onSuccess, onError });
    } else {
      submit.mutate({ bookingId, ...payload }, { onSuccess, onError });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {isEdit
                  ? t('editRating') || 'Edit your rating'
                  : t('rateYourVisit') || 'Rate your visit'}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {doctorName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close" hitSlop={8}>
              <X size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.prompt}>
            {t('howWasYourExperience') || 'How was your experience?'}
          </Text>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => {
              const filled = n <= rating;
              return (
                <TouchableOpacity
                  key={n}
                  onPress={() => setRating(n)}
                  hitSlop={6}
                  accessibilityLabel={`${n} stars`}
                  accessibilityRole="button"
                >
                  <Star
                    size={36}
                    color={filled ? Colors.gold : Colors.textSecondary}
                    fill={filled ? Colors.gold : 'transparent'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={styles.input}
            placeholder={t('addComment') || 'Add a comment (optional)'}
            placeholderTextColor={Colors.textSecondary}
            value={comment}
            onChangeText={(v) => setComment(v.slice(0, COMMENT_MAX))}
            multiline
            maxLength={COMMENT_MAX}
            editable={!isSubmitting}
          />
          <Text style={styles.counter}>
            {comment.length}/{COMMENT_MAX}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title={
              isSubmitting
                ? ''
                : isEdit
                  ? t('saveChanges') || 'Save changes'
                  : t('submitRating') || 'Submit rating'
            }
            onPress={handleSubmit}
            disabled={isSubmitting || rating < 1}
            icon={isSubmitting ? <ActivityIndicator color="#fff" /> : undefined}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 18,
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  prompt: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: spacing.sm,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 14,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  error: {
    color: Colors.error,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
});
