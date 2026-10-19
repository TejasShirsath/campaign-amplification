import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Users, Sparkles } from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/screen-container';
import { Button } from '../../components/common/button';
import { HighlightCard } from '../../components/common/metric-card';
import { CampaignCardLarge } from '../../components/campaign/campaign-cards';
import { HeaderBar } from '../../components/common/header-bar';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { CampaignSummary, campaignsApi } from '../../api/campaigns';
import { activityApi } from '../../api/activity';
import { SkeletonCampaignCardLarge } from '../../components/common/skeleton';

export default function HomeScreen() {
  const router = useRouter();
  const [featured, setFeatured] = useState<CampaignSummary[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    try {
      const [featRes, unreadRes] = await Promise.allSettled([
        campaignsApi.getFeatured(),
        activityApi.getUnreadCount(),
      ]);

      if (featRes.status === 'fulfilled' && featRes.value?.length) {
        setFeatured(featRes.value);
      } else {
        // Fallback to discovery if featured list is empty
        const discRes = await campaignsApi.discover({ limit: 3 });
        setFeatured(discRes);
      }

      if (unreadRes.status === 'fulfilled') {
        setUnreadCount(unreadRes.value.unreadCount);
      }
    } catch (err) {
      console.warn('Failed to load home data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleSave = async (id: string) => {
    const isCurrentlySaved = !!savedIds[id];
    setSavedIds((prev) => ({ ...prev, [id]: !isCurrentlySaved }));
    try {
      if (isCurrentlySaved) {
        await campaignsApi.unsaveCampaign(id);
      } else {
        await campaignsApi.saveCampaign(id);
      }
    } catch {
      // rollback on error
      setSavedIds((prev) => ({ ...prev, [id]: isCurrentlySaved }));
    }
  };

  const primaryFeatured = featured[0];

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      {/* Top Header matching reference */}
      <HeaderBar
        title="RippleUp"
        showBell
        unreadCount={unreadCount}
        showAvatar
        style={styles.header}
      />

      {/* Hero Section matching reference */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>
          Small contributions.{'\n'}
          <Text style={styles.heroTitleEmerald}>Wider impact.</Text>
        </Text>
        <Text style={styles.heroSubtitle}>
          Community-driven amplification to help vital public interest messages reach wider audiences.
        </Text>

        <View style={styles.heroActions}>
          <Button
            title="Explore Campaigns"
            showArrow
            onPress={() => router.push('/(tabs)/explore')}
            style={styles.primaryHeroBtn}
          />
          <Button
            title="Start a Campaign"
            variant="secondary"
            onPress={() => router.push('/create/1' as any)}
            style={styles.secondaryHeroBtn}
          />
        </View>
      </View>

      {/* Stat Highlight Card matching reference */}
      <HighlightCard
        value="12,5K"
        label="People reached this week"
        trend="↑ 28%"
        icon={<Users size={22} color={Colors.primary} />}
        style={styles.statCard}
      />

      {/* Featured Campaigns Section matching reference */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Campaigns</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <>
          <SkeletonCampaignCardLarge />
          <SkeletonCampaignCardLarge />
        </>
      ) : primaryFeatured ? (
        <>
          <CampaignCardLarge
            campaign={primaryFeatured}
            isSaved={!!savedIds[primaryFeatured.id]}
            onToggleSave={() => toggleSave(primaryFeatured.id)}
            onPress={() => router.push(`/campaign/${primaryFeatured.id}` as any)}
          />

          {/* Additional featured campaigns if available */}
          {featured.slice(1, 3).map((camp) => (
            <View key={camp.id} style={{ marginTop: Spacing.md }}>
              <CampaignCardLarge
                campaign={camp}
                isSaved={!!savedIds[camp.id]}
                onToggleSave={() => toggleSave(camp.id)}
                onPress={() => router.push(`/campaign/${camp.id}` as any)}
              />
            </View>
          ))}
        </>
      ) : (
        <View style={styles.emptyFeatured}>
          <Sparkles size={24} color={Colors.primary} />
          <Text style={styles.emptyFeaturedText}>Discover campaigns creating real impact</Text>
          <Button
            title="Browse All Campaigns"
            size="sm"
            onPress={() => router.push('/(tabs)/explore')}
            style={{ marginTop: Spacing.sm }}
          />
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 0,
    marginBottom: Spacing.sm,
  },
  heroSection: {
    paddingVertical: Spacing.md,
  },
  heroTitle: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  heroTitleEmerald: {
    color: Colors.primary,
  },
  heroSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  heroActions: {
    gap: Spacing.sm,
  },
  primaryHeroBtn: {
    width: '100%',
  },
  secondaryHeroBtn: {
    width: '100%',
  },
  statCard: {
    marginVertical: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  seeAllText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  emptyFeatured: {
    padding: Spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSubtle,
  },
  emptyFeaturedText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginVertical: Spacing.xs,
  },
});
