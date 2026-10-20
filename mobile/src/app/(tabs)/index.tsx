import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/screen-container';
import { Button } from '../../components/common/button';
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

      {/* Hero Section styled after reference card using hero.png background */}
      <View style={styles.heroCardContainer}>
        <ImageBackground
          source={require('../../../assets/images/hero.png')}
          style={styles.heroCard}
          imageStyle={styles.heroCardImage}
        >
          {/* Subtle Dark Gradient / Contrast Overlay for perfect text legibility */}
          <View style={styles.heroCardOverlay} />

          {/* Main Hero Copy */}
          <View style={styles.heroCopyContainer}>
            <Text style={styles.heroCardHeading}>
              Good{'\n'}messages{'\n'}deserve a{'\n'}
              <Text style={styles.heroCardHeadingHighlight}>wider audience.</Text>
            </Text>

            <Text style={styles.heroCardSubtext}>
              Bring people together to help important stories travel beyond existing networks.
            </Text>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.heroCardActions}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => router.push('/(tabs)/explore')}
              style={styles.heroBtnPrimary}
            >
              <Text style={styles.heroBtnPrimaryText}>Explore campaigns</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/create/1' as any)}
              style={styles.heroBtnSecondary}
            >
              <Text style={styles.heroBtnSecondaryText}>Start a campaign</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>


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
            onSupportPress={() =>
              router.push({
                pathname: '/campaign/contribute',
                params: { id: primaryFeatured.id },
              } as any)
            }
          />

          {/* Additional featured campaigns if available */}
          {featured.slice(1, 3).map((camp) => (
            <View key={camp.id} style={{ marginTop: Spacing.md }}>
              <CampaignCardLarge
                campaign={camp}
                isSaved={!!savedIds[camp.id]}
                onToggleSave={() => toggleSave(camp.id)}
                onPress={() => router.push(`/campaign/${camp.id}` as any)}
                onSupportPress={() =>
                  router.push({
                    pathname: '/campaign/contribute',
                    params: { id: camp.id },
                  } as any)
                }
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
  heroCardContainer: {
    marginVertical: Spacing.sm,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#042F2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  heroCard: {
    width: '100%',
    padding: Spacing.xl,
    paddingTop: Spacing.xxl + 4,
    paddingBottom: Spacing.xl,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
  },
  heroCardImage: {
    borderRadius: 28,
    resizeMode: 'cover',
  },
  heroCardOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2, 44, 34, 0.45)',
  },
  heroCopyContainer: {
    marginBottom: Spacing.xl,
  },
  heroCardHeading: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  heroCardHeadingHighlight: {
    color: '#D9F99D', // Light chartreuse / lime tint matching reference
  },
  heroCardSubtext: {
    fontSize: 15,
    lineHeight: 22,
    color: '#E2E8F0',
    fontWeight: '400',
    marginTop: Spacing.md,
    maxWidth: '92%',
  },
  heroCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  heroBtnPrimary: {
    flex: 1,
    height: 52,
    backgroundColor: '#E8FDB7', // Pale lime / chartreuse matching reference
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  heroBtnPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#064E3B', // Deep forest green
  },
  heroBtnSecondary: {
    flex: 1,
    height: 52,
    backgroundColor: 'rgba(6, 78, 59, 0.4)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBtnSecondaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xl,
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
