import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { HeartHandshake, LogIn, Compass } from 'lucide-react-native';
import { HeaderBar } from '../../components/common/header-bar';
import { Button } from '../../components/common/button';
import { SkeletonContributionCard } from '../../components/common/skeleton';
import { formatINR } from '../../components/campaign/campaign-cards';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../constants/theme';
import { ContributionRecord } from '../../api/contributions';
import { userApi } from '../../api/user';
import { useAuth } from '../../context/auth-context';

export default function MyContributionsScreen() {
  const router = useRouter();
  const { isAuthenticated, promptAuth, isAuthenticating } = useAuth();
  const [contributions, setContributions] = useState<ContributionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContributions = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const list = await userApi.getMyContributions();
      setContributions(list);
    } catch (err) {
      console.warn('Failed to load contributions:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadContributions();
  }, [loadContributions]);

  // ─── GUEST STATE ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <HeaderBar title="My Contributions" showBack style={styles.header} />
        <View style={styles.guestContainer}>
          <View style={styles.guestIconCircle}>
            <HeartHandshake size={36} color={Colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Contribution History</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to track campaigns you've supported, view verification receipts, and review distribution impact.
          </Text>
          <Button
            title="Sign In with Auth0"
            icon={<LogIn size={18} color="#FFFFFF" />}
            loading={isAuthenticating}
            onPress={() =>
              promptAuth({
                title: 'My Contributions',
                reason: 'Sign in to access your contribution history and impact reports.',
                onSuccess: () => loadContributions(),
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
    <View style={styles.container}>
      <HeaderBar title="My Contributions" showBack style={styles.header} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <>
            <SkeletonContributionCard />
            <SkeletonContributionCard />
            <SkeletonContributionCard />
          </>
        ) : contributions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <HeartHandshake size={32} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No contributions yet</Text>
            <Text style={styles.emptySubtitle}>
              You haven't contributed to any campaigns yet. Browse campaigns to find causes you'd like to amplify.
            </Text>
            <Button
              title="Explore Campaigns"
              variant="outline"
              icon={<Compass size={18} color={Colors.primary} />}
              onPress={() => router.push('/(tabs)/explore' as any)}
              style={{ marginTop: Spacing.lg }}
            />
          </View>
        ) : (
          contributions.map((item) => (
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
                  {item.campaign?.title || 'Campaign Contribution'}
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
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'CONFIRMED'
                      ? styles.statusBadgeConfirmed
                      : item.status === 'FAILED'
                      ? styles.statusBadgeFailed
                      : styles.statusBadgePending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.status === 'CONFIRMED'
                        ? styles.statusTextConfirmed
                        : item.status === 'FAILED'
                        ? styles.statusTextFailed
                        : styles.statusTextPending,
                    ]}
                  >
                    {item.status}
                  </Text>
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  statusBadgeConfirmed: {
    backgroundColor: Colors.primaryBg,
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeFailed: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  statusTextConfirmed: {
    color: Colors.primary,
  },
  statusTextPending: {
    color: '#D97706',
  },
  statusTextFailed: {
    color: '#DC2626',
  },
  emptyContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
    lineHeight: 18,
  },
});
