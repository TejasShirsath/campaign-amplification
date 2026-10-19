import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { Colors, Radii, Spacing, Typography } from '../../constants/theme';

export interface StepStepperProps {
  currentStep: number; // 1 to 5
  onStepPress?: (step: number) => void;
}

const STEPS = [
  { step: 1, label: 'Basics' },
  { step: 2, label: 'Story' },
  { step: 3, label: 'Visuals' },
  { step: 4, label: 'Reach' },
  { step: 5, label: 'Submit' },
];

export const StepStepper: React.FC<StepStepperProps> = ({ currentStep, onStepPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {STEPS.map((item, index) => {
          const isCurrent = item.step === currentStep;
          const isDone = item.step < currentStep;

          return (
            <React.Fragment key={item.step}>
              {index > 0 && (
                <View
                  style={[
                    styles.connectorLine,
                    isDone || isCurrent ? styles.activeConnector : styles.inactiveConnector,
                  ]}
                />
              )}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onStepPress?.(item.step)}
                disabled={!onStepPress || item.step > currentStep}
                style={styles.stepItem}
              >
                <View
                  style={[
                    styles.circle,
                    isCurrent && styles.activeCircle,
                    isDone && styles.doneCircle,
                    !isCurrent && !isDone && styles.inactiveCircle,
                  ]}
                >
                  {isDone ? (
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <Text
                      style={[
                        styles.numberText,
                        isCurrent && styles.activeNumberText,
                        !isCurrent && styles.inactiveNumberText,
                      ]}
                    >
                      {item.step}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isCurrent && styles.activeStepLabel,
                    !isCurrent && styles.inactiveStepLabel,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectorLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    marginBottom: 16, // align with circle center
  },
  activeConnector: {
    backgroundColor: Colors.primary,
  },
  inactiveConnector: {
    backgroundColor: Colors.border,
  },
  stepItem: {
    alignItems: 'center',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCircle: {
    backgroundColor: Colors.primary,
  },
  doneCircle: {
    backgroundColor: Colors.primary,
  },
  inactiveCircle: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  numberText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  activeNumberText: {
    color: '#FFFFFF',
  },
  inactiveNumberText: {
    color: Colors.textMuted,
  },
  stepLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  activeStepLabel: {
    color: Colors.primary,
    fontWeight: Typography.weights.semibold,
  },
  inactiveStepLabel: {
    color: Colors.textMuted,
  },
});
