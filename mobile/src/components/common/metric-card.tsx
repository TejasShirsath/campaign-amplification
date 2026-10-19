import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../constants/theme';

export interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  changePositive?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  changePositive = true,
  icon,
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{label}</Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>
      <View style={styles.bottomRow}>
        <Text style={styles.value}>{value}</Text>
        {change && (
          <View style={styles.trendBadge}>
            <ArrowUpRight size={12} color={changePositive ? Colors.primary : Colors.textMuted} />
            <Text
              style={[
                styles.trendText,
                { color: changePositive ? Colors.primary : Colors.textMuted },
              ]}
            >
              {change}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export const HighlightCard: React.FC<{
  value: string;
  label: string;
  trend?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}> = ({ value, label, trend, icon, style }) => (
  <View style={[styles.highlightCard, style]}>
    <View style={styles.highlightLeft}>
      {icon && <View style={styles.highlightIconBox}>{icon}</View>}
      <View>
        <Text style={styles.highlightValue}>{value}</Text>
        <Text style={styles.highlightLabel}>{label}</Text>
      </View>
    </View>
    {trend && (
      <View style={styles.highlightTrendBadge}>
        <Text style={styles.highlightTrendText}>{trend}</Text>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    ...Shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.xs,
  },
  value: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  trendText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    marginLeft: 2,
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.xl,
    padding: Spacing.md + 2,
    ...Shadows.card,
  },
  highlightLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  highlightValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  highlightLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  highlightTrendBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  highlightTrendText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
});
