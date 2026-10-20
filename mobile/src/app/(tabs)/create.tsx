import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/screen-container';
import { Button } from '../../components/common/button';
import { HeaderBar } from '../../components/common/header-bar';
import { Colors, Radii, Spacing, Typography } from '../../constants/theme';
import { useDraft } from '../../context/draft-context';
import { useAuth } from '../../context/auth-context';

export default function CreateLauncherScreen() {
  const router = useRouter();
  const { draft, resetDraft } = useDraft();
  const { isAuthenticated, promptAuth } = useAuth();

  const hasExistingDraft = !!draft.basics.title || !!draft.campaignId;

  const handleStartCampaign = () => {
    if (!isAuthenticated) {
      promptAuth({
        title: 'Create a Campaign',
        reason: 'Sign in to create, edit, and publish campaigns on RippleUp.',
        onSuccess: () => router.push('/create/1' as any),
      });
      return;
    }
    router.push('/create/1' as any);
  };

  const handleResumeDraft = () => {
    if (!isAuthenticated) {
      promptAuth({
        title: 'Resume Campaign Draft',
        reason: 'Sign in to resume editing your saved campaign draft.',
        onSuccess: () => router.push(`/create/${draft.currentStep}` as any),
      });
      return;
    }
    router.push(`/create/${draft.currentStep}` as any);
  };

  const handleStartNew = async () => {
    if (!isAuthenticated) {
      promptAuth({
        title: 'Create a Campaign',
        reason: 'Sign in to create, edit, and publish campaigns on RippleUp.',
        onSuccess: async () => {
          await resetDraft();
          router.push('/create/1' as any);
        },
      });
      return;
    }
    await resetDraft();
    router.push('/create/1' as any);
  };

  return (
    <ScreenContainer>
      <HeaderBar title="Create Campaign" />

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Sparkles size={36} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Start a Ripple</Text>
        <Text style={styles.subtitle}>
          Launch a community-funded campaign in 5 structured steps. Turn small contributions into wide, lasting impact.
        </Text>

        {hasExistingDraft ? (
          <View style={styles.draftCard}>
            <Text style={styles.draftBadge}>Draft in progress</Text>
            <Text style={styles.draftTitle} numberOfLines={1}>
              {draft.basics.title || 'Untitled Campaign'}
            </Text>
            <Text style={styles.draftSubtitle}>Step {draft.currentStep} of 5</Text>

            <View style={styles.draftActions}>
              <Button
                title="Resume Draft"
                showArrow
                onPress={handleResumeDraft}
                style={{ flex: 1 }}
              />
              <Button
                title="Start New"
                variant="outline"
                onPress={handleStartNew}
              />
            </View>
          </View>
        ) : (
          <Button
            title="Start New Campaign"
            showArrow
            onPress={handleStartCampaign}
            style={{ width: '100%', marginTop: Spacing.lg }}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: Radii.full,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.sm,
    maxWidth: 340,
  },
  draftCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginTop: Spacing.xxl,
  },
  draftBadge: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  draftTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginVertical: 4,
  },
  draftSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  draftActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
