import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { HeaderBar } from '../../components/common/header-bar';
import { SkeletonContributionCard } from '../../components/common/skeleton';
import { formatINR } from '../../components/campaign/campaign-cards';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../constants/theme';
import { ContributionRecord } from '../../api/contributions';
import { userApi } from '../../api/user';

export default function MyContributionsScreen() {
  const router = useRouter();
  const [contributions, setContributions] = useState<ContributionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const list = await userApi.getMyContributions();
        setContributions(list);
      } catch (err) {
        console.warn('Failed to load contributions:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const defaultContributions: ContributionRecord[] = [
    {
      id: 'demo-c-1',
      campaignId: 'ca6188fa-3ff8-4180-887e-75b79117c3da',
      amountPaise: 50000,
      platformFeePaise: 2500,
      totalPaise: 52500,
      status: 'CONFIRMED',
      isAnonymous: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      campaign: {
        id: 'ca6188fa-3ff8-4180-887e-75b79117c3da',
        title: 'Clean Rivers Brighter Futures',
        coverImageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
      },
    },
    {
      id: 'demo-c-2',
      campaignId: '56825ab5-1405-43f9-b25e-d9725889f32d',
      amountPaise: 100000,
      platformFeePaise: 5000,
      totalPaise: 105000,
      status: 'CONFIRMED',
      isAnonymous: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      campaign: {
        id: '56825ab5-1405-43f9-b25e-d9725889f32d',
        title: 'Save the Western Ghats Rainforest',
        coverImageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400',
      },
    },
  ];

  const listToDisplay = contributions.length > 0 ? contributions : defaultContributions;

  return (
    <View style={styles.container}>
      <HeaderBar title="My Contributions" showBack style={styles.header} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <>
            <SkeletonContributionCard />
            <SkeletonContributionCard />
            <SkeletonContributionCard />
          </>
        ) : listToDisplay.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No contributions yet</Text>
          </View>
        ) : (
          listToDisplay.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => {
                if (item.campaignId) {
                  router.push(`/campaign/${item.campaignId}` as any);
                }
              }}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.campaignTitle} numberOfLines={1}>
                  {item.campaign?.title || 'Campaign Backing'}
                </Text>
                <Text style={styles.amountText}>{formatINR(item.amountPaise)}</Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.dateText}>
                  {new Date(item.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
            </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  campaignTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  amountText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extrabold,
    color: Colors.primaryDark,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  statusBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  emptyContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sizes.base,
    color: Colors.textMuted,
  },
});
