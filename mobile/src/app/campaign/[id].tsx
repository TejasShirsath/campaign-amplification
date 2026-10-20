import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, Megaphone, FileText, ExternalLink, ThumbsUp } from 'lucide-react-native';
import { FloatingHeroBar } from '../../components/common/header-bar';
import { SkeletonCampaignDetail } from '../../components/common/skeleton';
import { Badge } from '../../components/common/badge';
import { ProgressBar } from '../../components/common/progress-bar';
import { Button } from '../../components/common/button';
import {
  formatINR,
  formatReach,
  getDaysLeft,
} from '../../components/campaign/campaign-cards';
import { Colors, Radii, Spacing, Typography } from '../../constants/theme';
import {
  CampaignDetail,
  CampaignProgress,
  FeedbackSummary,
  campaignsApi,
} from '../../api/campaigns';

export default function CampaignDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [progress, setProgress] = useState<CampaignProgress | null>(null);
  const [feedback, setFeedback] = useState<FeedbackSummary | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'About' | 'Updates' | 'Impact' | 'Creator'>('About');
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [votingFeedback, setVotingFeedback] = useState(false);

  const loadCampaign = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [campRes, progRes, feedRes, savedRes] = await Promise.allSettled([
        campaignsApi.getById(id),
        campaignsApi.getProgress(id),
        campaignsApi.getFeedback(id),
        campaignsApi.checkSaved(id),
      ]);

      if (campRes.status === 'fulfilled') {
        setCampaign(campRes.value);
      }
      if (progRes.status === 'fulfilled') {
        setProgress(progRes.value);
      }
      if (feedRes.status === 'fulfilled') {
        setFeedback(feedRes.value);
      }
      if (savedRes.status === 'fulfilled') {
        setIsSaved(savedRes.value.isSaved);
      }
    } catch (err) {
      console.warn('Failed to load campaign detail:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  const toggleSave = async () => {
    if (!id) return;
    const nextState = !isSaved;
    setIsSaved(nextState);
    try {
      if (nextState) {
        await campaignsApi.saveCampaign(id);
      } else {
        await campaignsApi.unsaveCampaign(id);
      }
    } catch {
      setIsSaved(!nextState);
    }
  };

  const handleShare = async () => {
    if (!campaign) return;
    try {
      await Share.share({
        title: campaign.title,
        message: `Help amplify "${campaign.title}" — Small contributions. Wider impact. Check it out on RippleUp.`,
      });
    } catch {
      // ignore
    }
  };

  const handleVote = async (type: 'VISUAL_ENGAGEMENT' | 'MESSAGE_IMPACT', value: 'YES' | 'SOMEWHAT' | 'NO') => {
    if (!id || votingFeedback) return;
    setVotingFeedback(true);
    try {
      await campaignsApi.submitFeedback(id, type, value);
      const updatedFeedback = await campaignsApi.getFeedback(id);
      setFeedback(updatedFeedback);
    } catch (err) {
      console.warn('Failed to vote feedback:', err);
    } finally {
      setVotingFeedback(false);
    }
  };

  if (loading || !campaign) {
    return (
      <View style={styles.container}>
        <FloatingHeroBar
          isSaved={false}
          onToggleSave={() => {}}
          onShare={() => {}}
        />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <SkeletonCampaignDetail />
        </ScrollView>
      </View>
    );
  }

  const percent =
    progress?.percentFunded !== undefined
      ? progress.percentFunded
      : campaign.fundingGoalPaise > 0
      ? Math.min(Math.round((campaign.totalRaisedPaise / campaign.fundingGoalPaise) * 100), 100)
      : 0;

  return (
    <View style={styles.container}>
      {/* Floating Hero Nav Bar matching reference */}
      <FloatingHeroBar
        isSaved={isSaved}
        onToggleSave={toggleSave}
        onShare={handleShare}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 90 }]}
      >
        {/* Top Hero Image */}
        <Image
          source={{
            uri:
              campaign.coverImageUrl ||
              'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800',
          }}
          style={styles.heroImage}
        />

        {/* Overlapping Content Container matching reference */}
        <View style={styles.contentCard}>
          <Badge
            label={(Colors.categories as any)[campaign.category]?.label || campaign.category}
            category={campaign.category}
            style={styles.categoryBadge}
          />

          <Text style={styles.title}>{campaign.title}</Text>
          <Text style={styles.summary}>{campaign.summary}</Text>

          {/* Funding Progress Section */}
          <View style={styles.fundingSection}>
            <View style={styles.fundingAmountRow}>
              <Text style={styles.raisedValue}>{formatINR(campaign.totalRaisedPaise)}</Text>
              <Text style={styles.goalValue}>{formatINR(campaign.fundingGoalPaise)}</Text>
            </View>

            <ProgressBar progress={percent} height={7} style={styles.progressBar} />

            <View style={styles.fundingMetaRow}>
              <Text style={styles.percentText}>{percent}% funded</Text>
              <Text style={styles.daysText}>{getDaysLeft(campaign.fundingEndsAt)}</Text>
            </View>
          </View>

          {/* 3-Column Stats Row matching reference */}
          <View style={styles.statsRow}>
            <View style={styles.statColumn}>
              <Megaphone size={18} color={Colors.textMuted} />
              <Text style={styles.statNumber}>{formatReach(campaign.estimatedReach)}</Text>
              <Text style={styles.statLabel}>est. reach</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statColumn}>
              <Users size={18} color={Colors.textMuted} />
              <Text style={styles.statNumber}>{campaign.contributorCount || 0}</Text>
              <Text style={styles.statLabel}>backers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statColumn}>
              <FileText size={18} color={Colors.textMuted} />
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>updates</Text>
            </View>
          </View>

          {/* Tabs Navigation: About, Updates, Impact, Creator matching reference */}
          <View style={styles.tabBar}>
            {(['About', 'Updates', 'Impact', 'Creator'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              >
                <Text
                  style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab 1: About */}
          {activeTab === 'About' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionHeading}>About this campaign</Text>
              <Text
                numberOfLines={isExpanded ? undefined : 4}
                style={styles.storyText}
              >
                {campaign.introText || campaign.summary}
                {'\n\n'}
                {campaign.storyContent?.map((block) => block.content).filter(Boolean).join('\n\n') ||
                  'Our rivers are vital to our health, economy and future. This campaign will amplify verified information and stories to inspire action and engage policymakers across Maharashtra and beyond.'}
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsExpanded(!isExpanded)}
                style={styles.readMoreButton}
              >
                <Text style={styles.readMoreText}>
                  {isExpanded ? 'Show less' : 'Read more'}
                </Text>
              </TouchableOpacity>

              {/* Supporting Sources */}
              {campaign.sources && campaign.sources.length > 0 && (
                <View style={styles.sourcesContainer}>
                  <Text style={styles.subHeading}>Supporting Sources & Verification</Text>
                  {campaign.sources.map((src, idx) => (
                    <View key={idx} style={styles.sourceItem}>
                      <ExternalLink size={14} color={Colors.primary} />
                      <Text style={styles.sourceTitle}>{src.title || src.url}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Community Feedback Section */}
              <View style={styles.feedbackContainer}>
                <Text style={styles.subHeading}>Community Impact Feedback</Text>
                <Text style={styles.feedbackDescription}>
                  Does this campaign communicate its core message clearly?
                </Text>
                <View style={styles.feedbackButtonsRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleVote('MESSAGE_IMPACT', 'YES')}
                    style={styles.voteButton}
                  >
                    <ThumbsUp size={14} color={Colors.primary} />
                    <Text style={styles.voteButtonText}>
                      Yes ({feedback?.messageImpact?.yes || 0})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleVote('MESSAGE_IMPACT', 'SOMEWHAT')}
                    style={styles.voteButton}
                  >
                    <Text style={styles.voteButtonText}>
                      Somewhat ({feedback?.messageImpact?.somewhat || 0})
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Tab 2: Updates */}
          {activeTab === 'Updates' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionHeading}>Campaign Updates</Text>
              <View style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineBody}>
                  <Text style={styles.timelineTitle}>First billboard active in Pune</Text>
                  <Text style={styles.timelineDate}>2 days ago</Text>
                  <Text style={styles.timelineText}>
                    Thanks to early backers, our digital ad distribution phase 1 has kicked off on Instagram and city digital transit displays.
                  </Text>
                </View>
              </View>
              <View style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineBody}>
                  <Text style={styles.timelineTitle}>Campaign Approved & Live</Text>
                  <Text style={styles.timelineDate}>10 days ago</Text>
                  <Text style={styles.timelineText}>
                    Campaign verification successfully completed. Amplification fund is officially open for backer contributions.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Tab 3: Impact */}
          {activeTab === 'Impact' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionHeading}>Distribution Strategy</Text>
              <Text style={styles.storyText}>
                Every contribution funds targeted digital and programmatic advertising across Instagram, YouTube, and regional public displays to maximize public awareness.
              </Text>
              <View style={styles.impactHighlightBox}>
                <Text style={styles.impactHighlightTitle}>Target Locations</Text>
                <Text style={styles.impactHighlightValue}>
                  {campaign.targetLocations?.join(', ') || 'Mumbai, Pune, Nashik, Nagpur'}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push(`/campaign/report?id=${campaign.id}` as any)}
                style={styles.viewReportButton}
              >
                <Text style={styles.viewReportText}>View Campaign Distribution Report →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tab 4: Creator */}
          {activeTab === 'Creator' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionHeading}>Organized by</Text>
              <View style={styles.creatorRow}>
                <Image
                  source={{
                    uri:
                      campaign.creator?.avatarUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
                  }}
                  style={styles.creatorAvatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.creatorName}>
                    {campaign.creatorName || campaign.creator?.displayName || 'GreenEarth Collective'}
                  </Text>
                  <Text style={styles.creatorBio}>
                    Verified environmental and community advocacy organizer.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom CTA Bar matching reference */}
      <View style={[styles.fixedBottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <Button
          title="Contribute Now"
          onPress={() => router.push(`/campaign/contribute?id=${campaign.id}` as any)}
          style={styles.contributeButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroImage: {
    width: '100%',
    height: 280,
    backgroundColor: Colors.surfaceAlt,
  },
  contentCard: {
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  categoryBadge: {
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text,
    lineHeight: 32,
    marginBottom: Spacing.xs + 2,
  },
  summary: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  fundingSection: {
    marginVertical: Spacing.xs,
  },
  fundingAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  raisedValue: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.primaryDark,
  },
  goalValue: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
  },
  progressBar: {
    marginVertical: 4,
  },
  fundingMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  percentText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  daysText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: Spacing.md,
    marginVertical: Spacing.lg,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.borderLight,
  },
  statNumber: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: Spacing.lg,
  },
  tabItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: Typography.weights.bold,
  },
  tabContent: {
    paddingVertical: Spacing.xs,
  },
  sectionHeading: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subHeading: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  storyText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  readMoreButton: {
    marginTop: Spacing.xs,
    paddingVertical: 4,
  },
  readMoreText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  sourcesContainer: {
    marginTop: Spacing.lg,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 6,
  },
  sourceTitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  feedbackContainer: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  feedbackDescription: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  feedbackButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    gap: 4,
  },
  voteButtonText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
    marginTop: 5,
    marginRight: Spacing.md,
  },
  timelineBody: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  timelineDate: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginVertical: 2,
  },
  timelineText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  impactHighlightBox: {
    backgroundColor: Colors.primaryBg,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginVertical: Spacing.md,
  },
  impactHighlightTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryDark,
  },
  impactHighlightValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.text,
    marginTop: 2,
  },
  viewReportButton: {
    paddingVertical: Spacing.sm,
  },
  viewReportText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radii.full,
  },
  creatorName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  creatorBio: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    elevation: 8,
  },
  contributeButton: {
    width: '100%',
  },
});
