/**
 * StepProgressBar — Shows step X of N with a progress bar.
 * Completed step dots are tappable to allow jumping back.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';

interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
  /** Steps the user has completed (tappable). */
  completedSteps?: number[];
  /** Called when a completed step dot is tapped. */
  onStepPress?: (step: number) => void;
}

export default function StepProgressBar({
  currentStep,
  totalSteps,
  labels,
  completedSteps = [],
  onStepPress,
}: StepProgressBarProps) {
  const progress = currentStep / totalSteps;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepText}>
          Step {currentStep} of {totalSteps}
        </Text>
        {labels && labels[currentStep - 1] && (
          <Text style={styles.label}>{labels[currentStep - 1]}</Text>
        )}
      </View>
      <View style={styles.trackOuter}>
        <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.dots}>
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = completedSteps.includes(stepNum);
          const isTappable = isCompleted && stepNum !== currentStep && onStepPress !== null;

          const dot = (
            <View
              key={stepNum}
              style={[
                styles.dot,
                i < currentStep ? styles.dotCompleted : styles.dotPending,
                i === currentStep - 1 && styles.dotActive,
              ]}
            />
          );

          if (isTappable) {
            return (
              <TouchableOpacity
                key={stepNum}
                onPress={() => onStepPress(stepNum)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {dot}
              </TouchableOpacity>
            );
          }

          return dot;
        })}
      </View>
      {/* Step labels under dots */}
      {labels && labels.length === totalSteps && (
        <View style={styles.labelRow}>
          {labels.map((lbl, i) => {
            const stepNum = i + 1;
            const isCompleted = completedSteps.includes(stepNum);
            const isTappable = isCompleted && stepNum !== currentStep && onStepPress !== null;

            const labelEl = (
              <Text
                key={stepNum}
                style={[
                  styles.dotLabel,
                  i < currentStep && styles.dotLabelCompleted,
                  i === currentStep - 1 && styles.dotLabelActive,
                ]}
              >
                {lbl}
              </Text>
            );

            if (isTappable) {
              return (
                <TouchableOpacity key={stepNum} onPress={() => onStepPress(stepNum)}>
                  {labelEl}
                </TouchableOpacity>
              );
            }

            return labelEl;
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  trackOuter: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotCompleted: {
    backgroundColor: Colors.primary,
  },
  dotPending: {
    backgroundColor: Colors.borderLight,
  },
  dotActive: {
    width: 20,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 6,
  },
  dotLabel: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
  },
  dotLabelCompleted: {
    color: Colors.primary,
    fontWeight: '600',
  },
  dotLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
