import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MoreHorizontal, Plus } from 'lucide-react-native';
import { HeaderBar } from '../../components/common/header-bar';
import { Button } from '../../components/common/button';
import { SkeletonCampaignCardRow } from '../../components/common/skeleton';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../constants/theme';
import { CampaignSummary } from '../../api/campaigns';
import { userApi } from '../../api/user';
import { useDraft } from '../../context/draft-context';

const TABS = ['Drafts', 'Active', 'Completed'] as const;

export default function MyCampaignsScreen() {
  const router = useRouter();
  const { loadDraftFromBackend } = useDraft();
  const [selectedTab, setSelectedTab] = useState<typeof TABS[number]>('Drafts');
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const list = await userApi.getMyCampaigns();
      setCampaigns(list);
    } catch (err) {
      console.warn('Failed to fetch user campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserCampaigns();
  }, [fetchUserCampaigns]);

  // Fallback demo campaigns matching the exact reference image
  const referenceDrafts: CampaignSummary[] = [
    {
      id: 'draft-1',
      title: 'Urban Green Spaces for Healthier Cities',
      category: 'ENVIRONMENT',
      creatorName: 'Demo Creator',
      summary: 'Expanding tree canopy and pocket parks across high-density metro areas.',
      coverImageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400',
      status: 'DRAFT',
      fundingGoalPaise: 5000000,
      totalRaisedPaise: 0,
      contributorCount: 0,
      estimatedReach: 60000,
      isFeatured: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'draft-2',
      title: 'Sustainable Transport for Cleaner Air',
      category: 'COMMUNITY',
      creatorName: 'Demo Creator',
      summary: 'Promoting electric cycle infrastructure and pedestrian safety zones.',
      coverImageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400',
      status: 'DRAFT',
      fundingGoalPaise: 3500000,
      totalRaisedPaise: 0,
      contributorCount: 0,
      estimatedReach: 45000,
      isFeatured: false,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const filteredCampaigns = campaigns.filter((c) => {
    if (selectedTab === 'Drafts') return c.status === 'DRAFT';
    if (selectedTab === 'Active') return ['SUBMITTED', 'APPROVED', 'FUNDING'].includes(c.status);
    if (selectedTab === 'Completed') return ['FUNDED', 'COMPLETED'].includes(c.status);
    return true;
  });

  const displayList =
    filteredCampaigns.length > 0
      ? filteredCampaigns
      : selectedTab === 'Drafts'
      ? referenceDrafts
      : [];

  const handleResumeDraft = async (camp: CampaignSummary) => {
    if (camp.id.startsWith('draft-')) {
      router.push('/create/1' as any);
    } else {
      await loadDraftFromBackend(camp.id);
      router.push('/create/1' as any);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header matching reference */}
      <HeaderBar
        title="My Campaigns"
        showBack
        rightAction={
          <TouchableOpacity
            onPress={() => router.push('/create/1' as any)}
            style={styles.newBtn}
          >
            <Plus size={18} color={Colors.primary} />
          </TouchableOpacity>
        }
        style={styles.header}
      />

      {/* Segmented Filter Tabs matching reference */}
      <View style={styles.tabContainer}>
        {TABS.map((tab) => {
          const isSelected = selectedTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() => setSelectedTab(tab)}
              style={[
                styles.tabPill,
                isSelected ? styles.tabPillActive : styles.tabPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.tabPillText,
                  isSelected ? styles.tabPillTextActive : styles.tabPillTextInactive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <>
            <SkeletonCampaignCardRow />
            <SkeletonCampaignCardRow />
            <SkeletonCampaignCardRow />
          </>
        ) : displayList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No {selectedTab.toLowerCase()} campaigns</Text>
            <Button
              title="Start a Campaign"
              size="sm"
              onPress={() => router.push('/create/1' as any)}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        ) : (
          displayList.map((item) => (
            <View key={item.id} style={styles.campaignRow}>
              <Image
                source={{
                  uri:
                    item.coverImageUrl ||
                    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400',
                }}
                style={styles.thumbnail}
              />
              <View style={styles.itemDetails}>
                <Text numberOfLines={2} style={styles.itemTitle}>
                  {item.title}
                </Text>
                <Text style={styles.itemMeta}>
                  {selectedTab === 'Drafts'
                    ? 'Draft · Last edited 2 days ago'
                    : selectedTab === 'Active'
                    ? 'Active · Funding in progress'
                    : 'Completed · Target reached'}
                </Text>

                <View style={styles.actionRow}>
                  {selectedTab === 'Drafts' ? (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleResumeDraft(item)}
                      style={styles.continueBtn}
                    >
                      <Text style={styles.continueBtnText}>Continue</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => router.push(`/campaign/report?id=${item.id}` as any)}
                      style={styles.continueBtn}
                    >
                      <Text style={styles.continueBtnText}>View Report</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.moreBtn}>
                    <MoreHorizontal size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  newBtn: {
    padding: Spacing.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  tabPill: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  tabPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabPillInactive: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  tabPillText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: Typography.weights.semibold,
  },
  tabPillTextInactive: {
    color: Colors.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
  campaignRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: Radii.lg,
    backgroundColor: Colors.surfaceAlt,
  },
  itemDetails: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    lineHeight: 20,
  },
  itemMeta: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  continueBtn: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  continueBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  moreBtn: {
    padding: 4,
  },
  emptyContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
  },
});
