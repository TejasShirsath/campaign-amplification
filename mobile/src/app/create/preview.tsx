import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderBar } from '../../components/common/header-bar';
import { Badge } from '../../components/common/badge';
import { ProgressBar } from '../../components/common/progress-bar';
import { Button } from '../../components/common/button';
import { SkeletonPreview } from '../../components/common/skeleton';
import { formatINR, formatReach } from '../../components/campaign/campaign-cards';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { useDraft } from '../../context/draft-context';
import { CampaignDetail } from '../../api/campaigns';
import { creationApi } from '../../api/creation';
import { resolveImageUrl } from '../../constants/config';

export default function CampaignPreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft } = useDraft();
  const [preview, setPreview] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (draft.campaignId) {
        try {
          setLoading(true);
          const data = await creationApi.getPreview(draft.campaignId);
          setPreview(data);
        } catch (err) {
          console.warn('Failed to load preview:', err);
        } finally {
          setLoading(false);
        }
      }
    })();
  }, [draft.campaignId]);

  const title = preview?.title || draft.basics.title || 'Untitled Campaign';
  const summary = preview?.summary || draft.basics.summary || 'Campaign description';
  const category = preview?.category || draft.basics.category;
  const coverUrl =
    preview?.coverImageUrl ||
    draft.basics.coverImageUrl ||
    'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800';
  const goalPaise = preview?.fundingGoalPaise || draft.submit.fundingGoalPaise;
  const reach = preview?.estimatedReach || draft.submit.estimatedReach;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderBar title="Campaign Preview" showBack />

      {loading ? (
        <SkeletonPreview />
      ) : (
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 80 }]}>
          <View style={styles.previewNotice}>
            <Text style={styles.previewNoticeText}>
              Draft Preview — This is how your campaign will appear to backers.
            </Text>
          </View>

          <Image source={{ uri: resolveImageUrl(coverUrl) }} style={styles.heroImage} />

          <View style={styles.body}>
            <Badge
              label={(Colors.categories as any)[category]?.label || category}
              category={category}
              style={{ marginBottom: Spacing.sm }}
            />

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.summary}>{summary}</Text>

            <View style={styles.fundingBox}>
              <View style={styles.fundingRow}>
                <Text style={styles.raised}>$0</Text>
                <Text style={styles.goal}>/ {formatINR(goalPaise)}</Text>
              </View>
              <ProgressBar progress={0} height={7} />
              <Text style={styles.reachNote}>Estimated Reach: ~{formatReach(reach)} people</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Distribution Channels</Text>
              <Text style={styles.sectionContent}>
                {draft.reach.distributionChannels?.join(', ') || 'Instagram, YouTube'}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          title="Back to Editor"
          variant="outline"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/create/1' as any);
            }
          }}
          style={{ width: '100%' }}
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
  scrollContent: {
    paddingBottom: 90,
  },
  previewNotice: {
    backgroundColor: Colors.primaryBg,
    paddingVertical: 8,
    paddingHorizontal: Spacing.lg,
  },
  previewNoticeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryDark,
    textAlign: 'center',
  },
  heroImage: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.surfaceAlt,
  },
  body: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text,
    lineHeight: 32,
    marginBottom: Spacing.xs,
  },
  summary: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  fundingBox: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  fundingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 6,
  },
  raised: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.primaryDark,
  },
  goal: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  reachNote: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 6,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionContent: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
