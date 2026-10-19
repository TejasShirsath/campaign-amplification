import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ViewStyle } from 'react-native';
import { Heart } from 'lucide-react-native';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../constants/theme';
import { CampaignSummary } from '../../api/campaigns';
import { Badge } from '../common/badge';
import { ProgressBar } from '../common/progress-bar';

// Format paise to INR string e.g. ₹3,40,000
export function formatINR(paise: number): string {
  const rupees = Math.round(paise / 100);
  return '₹' + rupees.toLocaleString('en-IN');
}

// Format reach count e.g. 12.5K
export function formatReach(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

export function getDaysLeft(fundingEndsAt?: string): string {
  if (!fundingEndsAt) return '30 days left';
  const diff = new Date(fundingEndsAt).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? `${days} days left` : 'Ending today';
}

export interface CampaignCardRowProps {
  campaign: CampaignSummary;
  onPress: () => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
  style?: ViewStyle;
}

export const CampaignCardRow: React.FC<CampaignCardRowProps> = ({
  campaign,
  onPress,
  isSaved = false,
  onToggleSave,
  style,
}) => {
  const percent =
    campaign.fundingGoalPaise > 0
      ? Math.min(Math.round((campaign.totalRaisedPaise / campaign.fundingGoalPaise) * 100), 100)
      : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.rowCard, style]}
    >
      <Image
        source={{
          uri:
            campaign.coverImageUrl ||
            'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
        }}
        style={styles.rowThumbnail}
      />
      <View style={styles.rowContent}>
        <View style={styles.rowHeader}>
          <Badge
            label={(Colors.categories as any)[campaign.category]?.label || campaign.category}
            category={campaign.category}
          />
          {onToggleSave && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={(e) => {
                e.stopPropagation?.();
                onToggleSave();
              }}
              style={styles.heartButton}
            >
              <Heart
                size={18}
                color={isSaved ? Colors.error : Colors.textLight}
                fill={isSaved ? Colors.error : 'transparent'}
              />
            </TouchableOpacity>
          )}
        </View>

        <Text numberOfLines={2} style={styles.rowTitle}>
          {campaign.title}
        </Text>

        <View style={styles.rowFooter}>
          <View style={styles.fundingMetaRow}>
            <Text style={styles.raisedAmount}>
              {formatINR(campaign.totalRaisedPaise)}
              <Text style={styles.goalAmount}> / {formatINR(campaign.fundingGoalPaise)}</Text>
            </Text>
            <Text style={styles.daysText}>{getDaysLeft(campaign.fundingEndsAt)}</Text>
          </View>
          <ProgressBar progress={percent} height={5} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export interface CampaignCardLargeProps {
  campaign: CampaignSummary;
  onPress: () => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
  style?: ViewStyle;
}

export const CampaignCardLarge: React.FC<CampaignCardLargeProps> = ({
  campaign,
  onPress,
  isSaved = false,
  onToggleSave,
  style,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.largeCard, style]}
    >
      <Image
        source={{
          uri:
            campaign.coverImageUrl ||
            'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800',
        }}
        style={styles.largeImage}
      />
      <View style={styles.largeGradientOverlay} />

      <View style={styles.largeContentOverlay}>
        <View style={styles.largeTopRow}>
          <Badge
            label={(Colors.categories as any)[campaign.category]?.label || campaign.category}
            category={campaign.category}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
          />
          {onToggleSave && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={(e) => {
                e.stopPropagation?.();
                onToggleSave();
              }}
              style={styles.largeHeartCircle}
            >
              <Heart
                size={18}
                color={isSaved ? Colors.error : '#FFFFFF'}
                fill={isSaved ? Colors.error : 'transparent'}
              />
            </TouchableOpacity>
          )}
        </View>

        <View>
          <Text numberOfLines={2} style={styles.largeTitle}>
            {campaign.title}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const CampaignCardMini: React.FC<{
  title: string;
  subtitle?: string;
  imageUrl?: string;
  style?: ViewStyle;
  onPress?: () => void;
}> = ({ title, subtitle, imageUrl, style, onPress }) => (
  <TouchableOpacity
    activeOpacity={onPress ? 0.8 : 1}
    onPress={onPress}
    style={[styles.miniCard, style]}
  >
    <Image
      source={{
        uri: imageUrl || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
      }}
      style={styles.miniThumbnail}
    />
    <View style={styles.miniContent}>
      <Text numberOfLines={1} style={styles.miniTitle}>
        {title}
      </Text>
      {subtitle && <Text style={styles.miniSubtitle}>{subtitle}</Text>}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  // Horizontal row card (Explore screen)
  rowCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  rowThumbnail: {
    width: 90,
    height: 90,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceAlt,
  },
  rowContent: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'space-between',
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heartButton: {
    padding: 2,
  },
  rowTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginVertical: 4,
    lineHeight: 20,
  },
  rowFooter: {
    marginTop: 4,
  },
  fundingMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  raisedAmount: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  goalAmount: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.regular,
    color: Colors.textMuted,
  },
  daysText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },

  // Featured large card (Home screen)
  largeCard: {
    height: 210,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceAlt,
    ...Shadows.elevated,
  },
  largeImage: {
    width: '100%',
    height: '100%',
  },
  largeGradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  largeContentOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  largeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  largeHeartCircle: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
    lineHeight: 24,
  },

  // Mini summary card (Contribute & Confirmation screen)
  miniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.md,
  },
  miniThumbnail: {
    width: 48,
    height: 48,
    borderRadius: Radii.sm,
    backgroundColor: Colors.surfaceAlt,
  },
  miniContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  miniTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  miniSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
