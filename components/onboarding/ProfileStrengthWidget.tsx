/**
 * ProfileStrengthWidget — Circular progress ring for doctor profile completeness
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { CheckCircle, XCircle } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

interface CheckItem {
  label: string;
  completed: boolean;
  onPress?: () => void;
}

interface ProfileStrengthWidgetProps {
  percentage: number;
  items: CheckItem[];
}

export default function ProfileStrengthWidget({ percentage, items }: ProfileStrengthWidgetProps) {
  const size = 80;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (percentage / 100) * circumference;
  const remaining = circumference - progress;

  const getColor = () => {
    if (percentage >= 80) return '#16A34A';
    if (percentage >= 50) return '#D97706';
    return Colors.error;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Circular Progress */}
        <View style={styles.ringContainer}>
          <Svg width={size} height={size}>
            {/* Background circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={Colors.borderLight}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={getColor()}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${progress} ${remaining}`}
              strokeDashoffset={circumference * 0.25}
              strokeLinecap="round"
            />
          </Svg>
          <Text style={[styles.percentageText, { color: getColor() }]}>{percentage}%</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Profile Strength</Text>
          <Text style={styles.subtitle}>
            {percentage >= 80
              ? 'Great! Your profile looks strong'
              : 'Complete your profile to build patient trust'}
          </Text>
        </View>
      </View>

      {/* Checklist */}
      <View style={styles.checklist}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.checkItem}
            onPress={item.onPress}
            disabled={!item.onPress}
            activeOpacity={item.onPress ? 0.7 : 1}
          >
            {item.completed ? (
              <CheckCircle size={16} color="#16A34A" strokeWidth={2.5} />
            ) : (
              <XCircle size={16} color={Colors.error} strokeWidth={2} />
            )}
            <Text style={[styles.checkLabel, item.completed && styles.checkLabelDone]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  ringContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: '900',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  checklist: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  checkLabel: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  checkLabelDone: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
});

