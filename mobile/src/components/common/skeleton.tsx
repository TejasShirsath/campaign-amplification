import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, StyleProp, ViewStyle, DimensionValue } from 'react-native';
import { Colors, Radii, Spacing } from '../../constants/theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Base atomic pulsing skeleton element
 */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = Radii.md,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Circular skeleton for avatars and icon buttons
 */
export function SkeletonCircle({
  size = 40,
  style,
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />;
}

/**
 * Multi-line text skeleton
 */
export function SkeletonText({
  lines = 2,
  lineHeight = 14,
  spacing = 8,
  lastLineWidth = '60%',
  style,
}: {
  lines?: number;
  lineHeight?: number;
  spacing?: number;
  lastLineWidth?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
          height={lineHeight}
          borderRadius={Radii.sm}
          style={{ marginBottom: index === lines - 1 ? 0 : spacing }}
        />
      ))}
    </View>
  );
}

/**
 * Skeleton for large featured campaign card (Home screen)
 */
export function SkeletonCampaignCardLarge() {
  return (
    <View style={styles.cardLarge}>
      {/* Inset Cover Image Placeholder */}
      <Skeleton width="100%" height={195} borderRadius={18} style={{ marginBottom: 14 }} />

      {/* Title */}
      <Skeleton width="85%" height={22} borderRadius={Radii.sm} style={{ marginBottom: 8 }} />

      {/* Description lines */}
      <Skeleton width="96%" height={14} borderRadius={Radii.sm} style={{ marginBottom: 6 }} />
      <Skeleton width="70%" height={14} borderRadius={Radii.sm} style={{ marginBottom: 16 }} />

      {/* Progress Bar */}
      <Skeleton width="100%" height={7} borderRadius={Radii.full} style={{ marginBottom: 10 }} />

      {/* Metrics Row: Raised & Percentage */}
      <View style={styles.rowBetween}>
        <Skeleton width={110} height={16} borderRadius={Radii.sm} />
        <Skeleton width={40} height={16} borderRadius={Radii.sm} />
      </View>

      {/* Supporters Row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 18 }}>
        <Skeleton width={75} height={26} borderRadius={Radii.full} />
        <Skeleton width={90} height={14} borderRadius={Radii.sm} style={{ marginLeft: 8 }} />
      </View>

      {/* Support Campaign Button */}
      <Skeleton width="100%" height={48} borderRadius={24} />
    </View>
  );
}

/**
 * Skeleton for horizontal campaign card rows (Explore, Saved, My Campaigns)
 */
export function SkeletonCampaignCardRow() {
  return (
    <View style={styles.cardRow}>
      {/* Left Thumbnail */}
      <Skeleton width={92} height={92} borderRadius={Radii.md} style={{ marginRight: Spacing.md }} />

      {/* Right Content */}
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View>
          <Skeleton width={70} height={18} borderRadius={Radii.full} style={{ marginBottom: 6 }} />
          <Skeleton width="90%" height={15} borderRadius={Radii.sm} style={{ marginBottom: 4 }} />
          <Skeleton width="60%" height={15} borderRadius={Radii.sm} />
        </View>

        <View style={{ marginTop: Spacing.xs }}>
          <Skeleton width="100%" height={6} borderRadius={Radii.full} style={{ marginBottom: 6 }} />
          <View style={styles.rowBetween}>
            <Skeleton width={75} height={12} borderRadius={Radii.sm} />
            <Skeleton width={50} height={12} borderRadius={Radii.sm} />
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton for Campaign Detail Screen (/campaign/[id])
 */
export function SkeletonCampaignDetail() {
  return (
    <View style={styles.detailContainer}>
      {/* Hero Image */}
      <Skeleton width="100%" height={260} borderRadius={0} />

      {/* Floating Card Body */}
      <View style={styles.detailBody}>
        {/* Category & Status */}
        <View style={[styles.rowBetween, { marginBottom: Spacing.sm }]}>
          <Skeleton width={100} height={26} borderRadius={Radii.full} />
          <Skeleton width={80} height={22} borderRadius={Radii.full} />
        </View>

        {/* Title */}
        <Skeleton width="95%" height={24} borderRadius={Radii.sm} style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height={24} borderRadius={Radii.sm} style={{ marginBottom: Spacing.md }} />

        {/* Creator Row */}
        <View style={[styles.rowAlign, { marginBottom: Spacing.lg }]}>
          <SkeletonCircle size={40} style={{ marginRight: Spacing.sm }} />
          <View>
            <Skeleton width={120} height={14} borderRadius={Radii.sm} style={{ marginBottom: 4 }} />
            <Skeleton width={80} height={12} borderRadius={Radii.sm} />
          </View>
        </View>

        {/* Highlight Metrics Box */}
        <View style={styles.highlightCard}>
          <Skeleton width="100%" height={10} borderRadius={Radii.full} style={{ marginBottom: Spacing.md }} />
          <View style={styles.rowBetween}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Skeleton width={60} height={18} borderRadius={Radii.sm} style={{ marginBottom: 4 }} />
              <Skeleton width={45} height={12} borderRadius={Radii.sm} />
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Skeleton width={60} height={18} borderRadius={Radii.sm} style={{ marginBottom: 4 }} />
              <Skeleton width={45} height={12} borderRadius={Radii.sm} />
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Skeleton width={60} height={18} borderRadius={Radii.sm} style={{ marginBottom: 4 }} />
              <Skeleton width={45} height={12} borderRadius={Radii.sm} />
            </View>
          </View>
        </View>

        {/* Tabs Row */}
        <View style={[styles.rowAlign, { marginVertical: Spacing.lg }]}>
          <Skeleton width={70} height={32} borderRadius={Radii.full} style={{ marginRight: 8 }} />
          <Skeleton width={70} height={32} borderRadius={Radii.full} style={{ marginRight: 8 }} />
          <Skeleton width={80} height={32} borderRadius={Radii.full} style={{ marginRight: 8 }} />
          <Skeleton width={70} height={32} borderRadius={Radii.full} />
        </View>

        {/* Story Text Paragraphs */}
        <SkeletonText lines={4} lineHeight={16} spacing={10} lastLineWidth="80%" style={{ marginBottom: Spacing.md }} />
        <SkeletonText lines={3} lineHeight={16} spacing={10} lastLineWidth="50%" />
      </View>
    </View>
  );
}

/**
 * Skeleton for Notification / Activity Item
 */
export function SkeletonNotificationItem() {
  return (
    <View style={styles.notificationRow}>
      <SkeletonCircle size={42} style={{ marginRight: Spacing.md }} />
      <View style={{ flex: 1 }}>
        <Skeleton width="75%" height={15} borderRadius={Radii.sm} style={{ marginBottom: 6 }} />
        <Skeleton width="92%" height={13} borderRadius={Radii.sm} style={{ marginBottom: 6 }} />
        <Skeleton width={60} height={11} borderRadius={Radii.sm} />
      </View>
    </View>
  );
}

/**
 * Skeleton for Contribution Cards (My Contributions screen)
 */
export function SkeletonContributionCard() {
  return (
    <View style={styles.contributionCard}>
      <View style={[styles.rowBetween, { marginBottom: Spacing.sm }]}>
        <Skeleton width="65%" height={16} borderRadius={Radii.sm} />
        <Skeleton width={70} height={22} borderRadius={Radii.full} />
      </View>
      <View style={[styles.rowBetween, { marginTop: Spacing.xs }]}>
        <Skeleton width={90} height={20} borderRadius={Radii.sm} />
        <Skeleton width={80} height={13} borderRadius={Radii.sm} />
      </View>
    </View>
  );
}

/**
 * Skeleton for Campaign Report Screen (/campaign/report)
 */
export function SkeletonReport() {
  return (
    <View style={{ padding: Spacing.lg }}>
      {/* Dropdown Placeholder */}
      <Skeleton width={140} height={36} borderRadius={Radii.full} style={{ marginBottom: Spacing.lg }} />

      {/* 2x2 Metric Cards Grid */}
      <View style={styles.metricGrid}>
        <View style={styles.metricCell}>
          <Skeleton width={80} height={14} borderRadius={Radii.sm} style={{ marginBottom: 6 }} />
          <Skeleton width={60} height={24} borderRadius={Radii.sm} style={{ marginBottom: 6 }} />
          <Skeleton width={50} height={12} borderRadius={Radii.sm} />
        </View>
        <View style={styles.metricCell}>
          <Skeleton width={80} height={14} borderRadius={Radii.sm} style={{ marginBottom: 6 }} />
          <Skeleton width={60} height={24} borderRadius={Radii.sm} style={{ marginBottom: 6 }} />
          <Skeleton width={50} height={12} borderRadius={Radii.sm} />
        </View>
        <View style={styles.metricCell}>
          <Skeleton width={80} height={14} borderRadius={Radii.sm} style={{ marginBottom: 6 }} />
          <Skeleton width={60} height={24} borderRadius={Radii.sm} style={{ marginBottom: 6 }} />
          <Skeleton width={50} height={12} borderRadius={Radii.sm} />
        </View>
        <View style={styles.metricCell}>
          <Skeleton width={80} height={14} borderRadius={Radii.sm} style={{ marginBottom: 6 }} />
          <Skeleton width={60} height={24} borderRadius={Radii.sm} style={{ marginBottom: 6 }} />
          <Skeleton width={50} height={12} borderRadius={Radii.sm} />
        </View>
      </View>

      {/* Large Channel Distribution Card */}
      <View style={[styles.cardLarge, { marginTop: Spacing.lg }]}>
        <Skeleton width={160} height={18} borderRadius={Radii.sm} style={{ marginBottom: Spacing.md }} />
        <Skeleton width="100%" height={24} borderRadius={Radii.full} style={{ marginBottom: Spacing.md }} />
        <View style={styles.rowBetween}>
          <Skeleton width={80} height={14} borderRadius={Radii.sm} />
          <Skeleton width={80} height={14} borderRadius={Radii.sm} />
          <Skeleton width={80} height={14} borderRadius={Radii.sm} />
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton for Contribute Screen (/campaign/contribute)
 */
export function SkeletonContribute() {
  return (
    <View style={{ padding: Spacing.lg }}>
      {/* Campaign Mini Card Placeholder */}
      <View style={[styles.cardRow, { marginBottom: Spacing.lg }]}>
        <Skeleton width={72} height={72} borderRadius={Radii.md} style={{ marginRight: Spacing.md }} />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Skeleton width={70} height={18} borderRadius={Radii.full} style={{ marginBottom: 6 }} />
          <Skeleton width="90%" height={16} borderRadius={Radii.sm} style={{ marginBottom: 6 }} />
          <Skeleton width={110} height={12} borderRadius={Radii.sm} />
        </View>
      </View>

      {/* Select Amount Header */}
      <Skeleton width={120} height={18} borderRadius={Radii.sm} style={{ marginBottom: Spacing.md }} />

      {/* Preset Amounts Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg }}>
        <Skeleton width="30%" height={46} borderRadius={Radii.lg} />
        <Skeleton width="30%" height={46} borderRadius={Radii.lg} />
        <Skeleton width="30%" height={46} borderRadius={Radii.lg} />
        <Skeleton width="30%" height={46} borderRadius={Radii.lg} />
        <Skeleton width="30%" height={46} borderRadius={Radii.lg} />
      </View>

      {/* Custom Amount Input Box */}
      <Skeleton width="100%" height={52} borderRadius={Radii.lg} style={{ marginBottom: Spacing.lg }} />

      {/* Impact Calculation Card */}
      <View style={[styles.highlightCard, { marginBottom: Spacing.xl }]}>
        <Skeleton width={140} height={16} borderRadius={Radii.sm} style={{ marginBottom: 8 }} />
        <Skeleton width="80%" height={14} borderRadius={Radii.sm} />
      </View>

      {/* Action Button */}
      <Skeleton width="100%" height={52} borderRadius={Radii.lg} />
    </View>
  );
}

/**
 * Skeleton for Campaign Preview Screen (/create/preview)
 */
export function SkeletonPreview() {
  return (
    <View style={{ padding: Spacing.lg }}>
      <Skeleton width="100%" height={40} borderRadius={Radii.md} style={{ marginBottom: Spacing.md }} />
      <Skeleton width="100%" height={200} borderRadius={Radii.lg} style={{ marginBottom: Spacing.md }} />
      <Skeleton width={90} height={22} borderRadius={Radii.full} style={{ marginBottom: Spacing.sm }} />
      <Skeleton width="90%" height={22} borderRadius={Radii.sm} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={22} borderRadius={Radii.sm} style={{ marginBottom: Spacing.lg }} />
      <SkeletonText lines={3} lineHeight={16} spacing={8} style={{ marginBottom: Spacing.lg }} />
      <Skeleton width="100%" height={52} borderRadius={Radii.lg} />
    </View>
  );
}

/**
 * Skeleton for Profile Screen (/(tabs)/profile)
 */
export function SkeletonProfile() {
  return (
    <View style={{ padding: Spacing.lg }}>
      {/* User Info Header Placeholder */}
      <View style={{ alignItems: 'center', marginVertical: Spacing.lg }}>
        <SkeletonCircle size={76} style={{ marginBottom: Spacing.md }} />
        <Skeleton width={140} height={20} borderRadius={Radii.sm} style={{ marginBottom: 6 }} />
        <Skeleton width={100} height={14} borderRadius={Radii.sm} style={{ marginBottom: Spacing.md }} />
        <Skeleton width={120} height={26} borderRadius={Radii.full} />
      </View>

      {/* 3 Metric Cards Row */}
      <View style={[styles.rowBetween, { marginVertical: Spacing.lg }]}>
        <View style={styles.metricCell}>
          <Skeleton width={40} height={22} borderRadius={Radii.sm} style={{ marginBottom: 4 }} />
          <Skeleton width={60} height={12} borderRadius={Radii.sm} />
        </View>
        <View style={styles.metricCell}>
          <Skeleton width={40} height={22} borderRadius={Radii.sm} style={{ marginBottom: 4 }} />
          <Skeleton width={70} height={12} borderRadius={Radii.sm} />
        </View>
        <View style={styles.metricCell}>
          <Skeleton width={40} height={22} borderRadius={Radii.sm} style={{ marginBottom: 4 }} />
          <Skeleton width={50} height={12} borderRadius={Radii.sm} />
        </View>
      </View>

      {/* Menu / Nav rows */}
      <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
        <Skeleton width="100%" height={56} borderRadius={Radii.lg} />
        <Skeleton width="100%" height={56} borderRadius={Radii.lg} />
        <Skeleton width="100%" height={56} borderRadius={Radii.lg} />
        <Skeleton width="100%" height={56} borderRadius={Radii.lg} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: '#E5E7EB',
  },
  cardLarge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: Spacing.lg,
  },
  cardRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: Spacing.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  detailBody: {
    padding: Spacing.lg,
  },
  highlightCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contributionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: Spacing.sm,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metricCell: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: '#F9FAFB',
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
});
