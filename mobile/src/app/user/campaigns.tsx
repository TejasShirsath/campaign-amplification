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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MoreHorizontal, Plus, Layers, LogIn } from 'lucide-react-native';
import { HeaderBar } from '../../components/common/header-bar';
import { Button } from '../../components/common/button';
import { SkeletonCampaignCardRow } from '../../components/common/skeleton';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../constants/theme';
import { CampaignSummary } from '../../api/campaigns';
import { userApi } from '../../api/user';
import { useDraft } from '../../context/draft-context';
import { useAuth } from '../../context/auth-context';

const TABS = ['Drafts', 'Active', 'Completed'] as const;

export default function MyCampaignsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loadDraftFromBackend } = useDraft();
  const { isAuthenticated, promptAuth, isAuthenticating } = useAuth();
  const [selectedTab, setSelectedTab] = useState<typeof TABS[number]>('Drafts');
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserCampaigns = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const list = await userApi.getMyCampaigns();
      setCampaigns(list);
    } catch (err) {
      console.warn('Failed to fetch user campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUserCampaigns();
  }, [fetchUserCampaigns]);

  const filteredCampaigns = campaigns.filter((c) => {
    if (selectedTab === 'Drafts') return c.status === 'DRAFT';
    if (selectedTab === 'Active')
      return ['SUBMITTED', 'APPROVED', 'FUNDING', 'DISTRIBUTION_PREP', 'PROMOTING'].includes(c.status);
    if (selectedTab === 'Completed') return ['FUNDED', 'COMPLETED'].includes(c.status);
    return true;
  });

  const handleResumeDraft = async (camp: CampaignSummary) => {
    await loadDraftFromBackend(camp.id);
    router.push('/create/1' as any);
  };

  // ─── GUEST STATE ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <HeaderBar title="My Campaigns" showBack style={styles.header} />
        <View style={styles.guestContainer}>
          <View style={styles.guestIconCircle}>
            <Layers size={36} color={Colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Manage Your Campaigns</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to access your drafts, monitor live campaign progress, and inspect distribution reach.
          </Text>
          <Button
            title="Sign In with Auth0"
            icon={<LogIn size={18} color="#FFFFFF" />}
            loading={isAuthenticating}
            onPress={() =>
              promptAuth({
                title: 'My Campaigns',
                reason: 'Sign in to access your campaign drafts and active initiatives.',
                onSuccess: () => fetchUserCampaigns(),
              })
            }
            style={{ width: '100%', maxWidth: 300, marginTop: Spacing.md }}
          />
        </View>
      </View>
    );
  }

  // ─── AUTHENTICATED STATE ─────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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

      {/* Segmented Filter Tabs */}
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

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + Spacing.xl }]}>
        {loading ? (
          <>
            <SkeletonCampaignCardRow />
            <SkeletonCampaignCardRow />
            <SkeletonCampaignCardRow />
          </>
        ) : filteredCampaigns.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No {selectedTab.toLowerCase()} campaigns</Text>
            <Text style={styles.emptySubtitle}>
              {selectedTab === 'Drafts'
                ? "You don't have any saved drafts. Start a new campaign to draft your message."
                : selectedTab === 'Active'
                ? 'No active campaigns currently in review or funding.'
                : 'Completed campaigns and final reports will appear here.'}
            </Text>
            <Button
              title="Start a Campaign"
              size="sm"
              onPress={() => router.push('/create/1' as any)}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        ) : (
          filteredCampaigns.map((item) => (
            <View key={item.id} style={styles.campaignRow}>
              {item.coverImageUrl ? (
                <Image source={{ uri: item.coverImageUrl }} style={styles.thumbnail} />
              ) : (
                <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                  <Layers size={24} color={Colors.textMuted} />
                </View>
              )}
              <View style={styles.itemDetails}>
                <Text numberOfLines={2} style={styles.itemTitle}>
                  {item.title || 'Untitled Campaign'}
                </Text>
                <Text style={styles.itemMeta}>
                  {selectedTab === 'Drafts'
                    ? 'Draft · In progress'
                    : selectedTab === 'Active'
                    ? `${item.status} · Funding in progress`
                    : 'Completed'}
                </Text>

                <View style={styles.actionRow}>
                  {selectedTab === 'Drafts' ? (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleResumeDraft(item)}
                      style={styles.continueBtn}
                    >
                      <Text style={styles.continueBtnText}>Continue Draft</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => router.push(`/campaign/${item.id}` as any)}
                      style={styles.continueBtn}
                    >
                      <Text style={styles.continueBtnText}>View Campaign</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.moreBtn}
                    onPress={() => router.push(`/campaign/${item.id}` as any)}
                  >
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
  guestContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  guestIconCircle: {
    width: 72,
    height: 72,
    borderRadius: Radii.full,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  guestTitle: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.xs,
    maxWidth: 320,
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
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
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
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
    lineHeight: 18,
  },
});
