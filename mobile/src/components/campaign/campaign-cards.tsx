import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Heart } from 'lucide-react-native';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../constants/theme';
import { CampaignSummary } from '../../api/campaigns';
import { Badge } from '../common/badge';
import { ProgressBar } from '../common/progress-bar';
import { resolveImageUrl } from '../../constants/config';

// Format paise to INR string e.g. ₹28,450
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

const DEFAULT_SUPPORTER_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face',
];

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
      <ExpoImage
        source={{
          uri: resolveImageUrl(
            campaign.coverImageUrl ||
            'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400'
          ),
        }}
        style={styles.rowThumbnail}
        contentFit="cover"
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
  onSupportPress?: () => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
  style?: ViewStyle;
}

export const CampaignCardLarge: React.FC<CampaignCardLargeProps> = ({
  campaign,
  onPress,
  onSupportPress,
  isSaved = false,
  onToggleSave,
  style,
}) => {
  const percent =
    campaign.fundingGoalPaise > 0
      ? Math.min(Math.round((campaign.totalRaisedPaise / campaign.fundingGoalPaise) * 100), 100)
      : 72;

  const raisedDisplay =
    campaign.totalRaisedPaise > 0
      ? formatINR(campaign.totalRaisedPaise)
      : '₹28,450';

  const supportersCount = campaign.contributorCount || 320;

  const description =
    campaign.summary ||
    'Support awareness campaigns for a greener and healthier planet.';

  const handleSupport = (e: any) => {
    e?.stopPropagation?.();
    if (onSupportPress) {
      onSupportPress();
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[styles.largeCard, style]}
    >
      {/* Cover Image Container */}
      <View style={styles.imageContainer}>
        <ExpoImage
          source={{
            uri: resolveImageUrl(
              campaign.coverImageUrl ||
              'https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&fit=crop'
            ),
          }}
          style={styles.coverImage}
          contentFit="cover"
          transition={250}
        />

        {/* Top-Left Trending Badge */}
        <View style={styles.trendingBadge}>
          <Text style={styles.trendingBadgeText}>
            {campaign.isFeatured !== false ? 'Trending' : 'Active'}
          </Text>
        </View>

        {/* Top-Right Heart/Save Action */}
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
              size={17}
              color={isSaved ? Colors.error : '#FFFFFF'}
              fill={isSaved ? Colors.error : 'transparent'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Card Body */}
      <View style={styles.cardBody}>
        {/* Title */}
        <Text numberOfLines={2} style={styles.cardTitle}>
          {campaign.title}
        </Text>

        {/* Description / Subtitle */}
        <Text numberOfLines={2} style={styles.cardDescription}>
          {description}
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${Math.max(percent, 4)}%` }]} />
        </View>

        {/* Metrics Row: Raised & Percentage */}
        <View style={styles.metricsRow}>
          <Text style={styles.raisedNumber}>
            {raisedDisplay}{' '}
            <Text style={styles.raisedLabel}>raised</Text>
          </Text>
          <Text style={styles.percentText}>{percent}%</Text>
        </View>

        {/* Supporters Avatars & Count */}
        <View style={styles.supportersRow}>
          <View style={styles.avatarStack}>
            {DEFAULT_SUPPORTER_AVATARS.map((uri, idx) => (
              <ExpoImage
                key={idx}
                source={{ uri }}
                style={[
                  styles.supporterAvatar,
                  { marginLeft: idx === 0 ? 0 : -8, zIndex: 10 - idx },
                ]}
                contentFit="cover"
              />
            ))}
          </View>
          <Text style={styles.supportersCountText}>
            {supportersCount} supporters
          </Text>
        </View>

        {/* Support Campaign Action Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSupport}
          style={styles.supportButton}
        >
          <Text style={styles.supportButtonText}>Support Campaign</Text>
        </TouchableOpacity>
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
    <ExpoImage
      source={{
        uri: resolveImageUrl(
          imageUrl || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400'
        ),
      }}
      style={styles.miniThumbnail}
      contentFit="cover"
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

  // Featured large card matching reference design (Home screen)
  largeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    height: 195,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceAlt,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  trendingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  trendingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  largeHeartCircle: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    paddingHorizontal: 4,
    paddingTop: 14,
    paddingBottom: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 16,
  },
  progressBarTrack: {
    width: '100%',
    height: 7,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  raisedNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  raisedLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  percentText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  supportersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supporterAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#E5E7EB',
  },
  supportersCountText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    marginLeft: 8,
  },
  supportButton: {
    backgroundColor: '#059669',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  supportButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
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
