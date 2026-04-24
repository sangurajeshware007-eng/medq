/**
 * ApprovalStatusBadge — Shows PENDING/APPROVED/REJECTED status
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import type { OnboardingStatus } from '../../services/onboardingService';

interface ApprovalStatusBadgeProps {
  status: OnboardingStatus;
  compact?: boolean;
}

const STATUS_CONFIG: Record<string, {
  label: string;
  bgColor: string;
  textColor: string;
  icon: React.ElementType;
}> = {
  PENDING: {
    label: 'Under Review',
    bgColor: '#FFF8E7',
    textColor: '#D97706',
    icon: Clock,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bgColor: Colors.primaryLight,
    textColor: Colors.primary,
    icon: Clock,
  },
  APPROVED: {
    label: 'Approved',
    bgColor: Colors.trustGreenLight,
    textColor: '#16A34A',
    icon: CheckCircle,
  },
  REJECTED: {
    label: 'Not Approved',
    bgColor: Colors.errorLight,
    textColor: Colors.error,
    icon: XCircle,
  },
  NOT_STARTED: {
    label: 'Not Started',
    bgColor: Colors.borderLight,
    textColor: Colors.textSecondary,
    icon: Clock,
  },
};

export default function ApprovalStatusBadge({ status, compact = false }: ApprovalStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_STARTED;
  const IconComp = config.icon;

  if (compact) {
    return (
      <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
        <IconComp size={14} color={config.textColor} strokeWidth={2.5} />
        <Text style={[styles.badgeText, { color: config.textColor }]}>{config.label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.fullBadge, { backgroundColor: config.bgColor, borderColor: config.textColor }]}>
      <IconComp size={20} color={config.textColor} strokeWidth={2} />
      <View style={styles.fullBadgeContent}>
        <Text style={[styles.fullBadgeLabel, { color: config.textColor }]}>{config.label}</Text>
        <Text style={styles.fullBadgeDesc}>
          {status === 'PENDING' && 'Your profile is being reviewed by our team'}
          {status === 'APPROVED' && 'Your profile has been verified and approved'}
          {status === 'REJECTED' && 'Please review and resubmit your profile'}
          {status === 'IN_PROGRESS' && 'Complete all steps and submit for review'}
          {status === 'NOT_STARTED' && 'Start your onboarding to get listed'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  fullBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  fullBadgeContent: {
    flex: 1,
  },
  fullBadgeLabel: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  fullBadgeDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});

