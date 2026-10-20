import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/screen-container';
import { HeaderBar } from '../../components/common/header-bar';
import { CampaignCardRow } from '../../components/campaign/campaign-cards';
import { SkeletonCampaignCardRow } from '../../components/common/skeleton';
import { Colors, Radii, Spacing, Typography } from '../../constants/theme';
import { CampaignSummary, campaignsApi } from '../../api/campaigns';
import { activityApi } from '../../api/activity';
import { useAuth } from '../../context/auth-context';

const CATEGORIES = [
  { key: 'ALL', label: 'All' },
  { key: 'ENVIRONMENT', label: 'Environment' },
  { key: 'EDUCATION', label: 'Education' },
  { key: 'HEALTH', label: 'Health' },
  { key: 'SCIENCE', label: 'Science' },
  { key: 'PUBLIC_POLICY', label: 'Public Policy' },
  { key: 'COMMUNITY', label: 'Community' },
  { key: 'BUSINESS', label: 'Business' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const { isAuthenticated, promptAuth } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { limit: 20 };
      if (selectedCategory !== 'ALL') {
        params.category = selectedCategory;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await campaignsApi.discover(params);
      setCampaigns(res);
    } catch (err) {
      console.warn('Failed to discover campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    (async () => {
      try {
        const unread = await activityApi.getUnreadCount();
        setUnreadCount(unread.unreadCount);
      } catch {
        // silent
      }
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCampaigns();
    setRefreshing(false);
  };

  const toggleSave = async (id: string) => {
    if (!isAuthenticated) {
      promptAuth({
        title: 'Save Campaign',
        reason: 'Sign in to save this campaign to your bookmarks and follow updates.',
        onSuccess: async () => {
          try {
            await campaignsApi.saveCampaign(id);
            setSavedMap((prev) => ({ ...prev, [id]: true }));
          } catch {
            // silent
          }
        },
      });
      return;
    }

    const isSaved = !!savedMap[id];
    setSavedMap((prev) => ({ ...prev, [id]: !isSaved }));
    try {
      if (isSaved) {
        await campaignsApi.unsaveCampaign(id);
      } else {
        await campaignsApi.saveCampaign(id);
      }
    } catch {
      setSavedMap((prev) => ({ ...prev, [id]: isSaved }));
    }
  };

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      {/* Header matching reference */}
      <HeaderBar
        title="Explore"
        subtitle="Discover and support campaigns that create real impact."
        showBell
        unreadCount={unreadCount}
        showAvatar
        style={styles.header}
      />

      {/* Search Input Bar */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={Colors.textLight} style={styles.searchIcon} />
          <TextInput
            placeholder="Search campaigns..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            underlineColorAndroid="transparent"
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Horizontal Category Filter Pills matching reference */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScrollView}
        contentContainerStyle={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              activeOpacity={0.8}
              onPress={() => setSelectedCategory(cat.key)}
              style={[
                styles.categoryPill,
                isSelected ? styles.categoryPillActive : styles.categoryPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  isSelected ? styles.categoryPillTextActive : styles.categoryPillTextInactive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Campaign List */}
      <View style={styles.listContainer}>
        {loading && !refreshing ? (
          <>
            <SkeletonCampaignCardRow />
            <SkeletonCampaignCardRow />
            <SkeletonCampaignCardRow />
            <SkeletonCampaignCardRow />
          </>
        ) : campaigns.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No campaigns found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search query or selected category.</Text>
          </View>
        ) : (
          campaigns.map((camp) => (
            <CampaignCardRow
              key={camp.id}
              campaign={camp}
              isSaved={!!savedMap[camp.id]}
              onToggleSave={() => toggleSave(camp.id)}
              onPress={() => router.push(`/campaign/${camp.id}` as any)}
            />
          ))
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 0,
    marginBottom: Spacing.sm,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    height: 46,
  },
  searchIcon: {
    marginRight: Spacing.xs + 2,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text,
    padding: 0,
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          outlineWidth: 0,
          outlineColor: 'transparent',
        } as any)
      : {}),
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: Radii.lg,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryScrollView: {
    flexGrow: 0,
    height: 44,
    marginVertical: Spacing.xs,
  },
  categoryScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 4,
    paddingVertical: 2,
  },
  categoryPill: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: Radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  categoryPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryPillInactive: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  categoryPillText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    lineHeight: 18,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: Typography.weights.semibold,
  },
  categoryPillTextInactive: {
    color: Colors.textSecondary,
  },
  listContainer: {
    marginTop: Spacing.xs,
  },
  emptyContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
