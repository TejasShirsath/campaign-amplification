import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { HeaderBar } from '../../components/common/header-bar';
import { CampaignCardRow } from '../../components/campaign/campaign-cards';
import { SkeletonCampaignCardRow } from '../../components/common/skeleton';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { CampaignSummary, campaignsApi } from '../../api/campaigns';
import { userApi } from '../../api/user';

export default function SavedCampaignsScreen() {
  const router = useRouter();
  const [saved, setSaved] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const list = await userApi.getMySavedCampaigns();
        if (list.length > 0) {
          setSaved(list);
        } else {
          // Provide fallback from discovery
          const fallback = await campaignsApi.discover({ limit: 4 });
          setSaved(fallback.slice(0, 3));
        }
      } catch (err) {
        console.warn('Failed to load saved campaigns:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUnsave = async (id: string) => {
    setSaved((prev) => prev.filter((c) => c.id !== id));
    try {
      await campaignsApi.unsaveCampaign(id);
    } catch {
      // ignore
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="Saved Campaigns" showBack style={styles.header} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <>
            <SkeletonCampaignCardRow />
            <SkeletonCampaignCardRow />
            <SkeletonCampaignCardRow />
          </>
        ) : saved.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No saved campaigns yet</Text>
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xxxl,
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
