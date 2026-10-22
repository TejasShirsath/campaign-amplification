import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bookmark, LogIn, Compass } from 'lucide-react-native';
import { HeaderBar } from '../../components/common/header-bar';
import { Button } from '../../components/common/button';
import { CampaignCardRow } from '../../components/campaign/campaign-cards';
import { SkeletonCampaignCardRow } from '../../components/common/skeleton';
import { Colors, Radii, Spacing, Typography } from '../../constants/theme';
import { CampaignSummary, campaignsApi } from '../../api/campaigns';
import { userApi } from '../../api/user';
import { useAuth } from '../../context/auth-context';

export default function SavedCampaignsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, promptAuth, isAuthenticating } = useAuth();
  const [saved, setSaved] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSavedCampaigns = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const list = await userApi.getMySavedCampaigns();
      setSaved(list);
    } catch (err) {
      console.warn('Failed to load saved campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadSavedCampaigns();
  }, [loadSavedCampaigns]);

  const handleUnsave = async (id: string) => {
    setSaved((prev) => prev.filter((c) => c.id !== id));
    try {
      await campaignsApi.unsaveCampaign(id);
    } catch {
      // ignore
    }
  };

  // ─── GUEST STATE ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <HeaderBar title="Saved Campaigns" showBack style={styles.header} />
        <View style={styles.guestContainer}>
          <View style={styles.guestIconCircle}>
            <Bookmark size={36} color={Colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Saved Campaigns</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to bookmark campaigns, track funding progress, and access them quickly across devices.
          </Text>
          <Button
            title="Sign In with Auth0"
            icon={<LogIn size={18} color="#FFFFFF" />}
            loading={isAuthenticating}
            onPress={() =>
              promptAuth({
                title: 'Saved Campaigns',
                reason: 'Sign in to access and manage your bookmarked campaigns.',
                onSuccess: () => loadSavedCampaigns(),
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
      <HeaderBar title="Saved Campaigns" showBack style={styles.header} />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + Spacing.xl }]}>
        {loading ? (
          <>
            <SkeletonCampaignCardRow />
            <SkeletonCampaignCardRow />
            <SkeletonCampaignCardRow />
          </>
        ) : saved.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Bookmark size={32} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No saved campaigns yet</Text>
            <Text style={styles.emptySubtitle}>
              When browsing, tap the bookmark icon on any campaign to save it here for quick access.
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
          saved.map((camp) => (
            <CampaignCardRow
              key={camp.id}
              campaign={camp}
              isSaved={true}
              onToggleSave={() => handleUnsave(camp.id)}
              onPress={() => router.push(`/campaign/${camp.id}` as any)}
            />
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
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
