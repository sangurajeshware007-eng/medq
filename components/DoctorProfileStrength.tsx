import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle, Circle, Lightbulb, Zap } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { useLanguage } from '../context/LanguageContext';
import Card from './Card';
import { crossPlatformShadow } from '../utils/shadow';

interface ProfileStrengthProps {
  photo: boolean;
  education: boolean;
  specialization: boolean;
  experience: boolean;
}

export default function DoctorProfileStrength({
  photo,
  education,
  specialization,
  experience,
}: ProfileStrengthProps) {
  const { t } = useLanguage();

  const criteria = [
    { key: 'photoAdded', completed: photo },
    { key: 'educationFilled', completed: education },
    { key: 'specializationFilled', completed: specialization },
    { key: 'experienceFilled', completed: experience },
  ];

  const completedCount = criteria.filter((c) => c.completed).length;
  const percentage = Math.round((completedCount / criteria.length) * 100);

  const getStatusColor = () => {
    if (percentage >= 80) return Colors.trustGreen;
    if (percentage >= 50) return Colors.gold;
    return Colors.error;
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Zap size={16} color={getStatusColor()} fill={getStatusColor() + '20'} />
          <Text style={styles.title}>{t('profileStrength')}</Text>
        </View>
        <Text style={[styles.percentage, { color: getStatusColor() }]}>{percentage}%</Text>
      </View>

      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${percentage}%`,
              backgroundColor: getStatusColor(),
            },
          ]}
        />
      </View>

      <View style={styles.criteriaGrid}>
        {criteria.map((item, index) => (
          <View key={index} style={styles.criteriaItem}>
            {item.completed
              ? <CheckCircle size={14} color={Colors.trustGreen} strokeWidth={2.5} />
              : <Circle size={14} color={Colors.border} strokeWidth={2} />
            }
            <Text
              style={[
                styles.criteriaText,
                !item.completed && styles.criteriaIncomplete,
              ]}
              numberOfLines={1}
            >
              {t(item.key)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerInner}>
          <Lightbulb size={12} color={Colors.textSecondary} />
          <Text style={styles.helpText}>{t('strongProfileHelps')}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.white,
    marginVertical: 12,
    ...crossPlatformShadow({ color: Colors.shadow, opacity: 0.04, radius: 10, elevation: 2 }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  percentage: {
    fontSize: 16,
    fontWeight: '900',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  criteriaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '45%',
  },
  criteriaText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  criteriaIncomplete: {
    color: Colors.textLight,
  },
  footer: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  footerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helpText: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500',
  },
});
