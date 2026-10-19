import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, Trash2, Eye } from 'lucide-react-native';
import { HeaderBar } from '../../components/common/header-bar';
import { StepStepper } from '../../components/creation/step-stepper';
import { Input, SelectDropdown, TipCallout } from '../../components/common/input';
import { Button } from '../../components/common/button';
import { Colors, Radii, Spacing, Typography } from '../../constants/theme';
import { useDraft } from '../../context/draft-context';

const CATEGORY_OPTIONS = [
  { label: 'Environment', value: 'ENVIRONMENT' },
  { label: 'Healthcare & Wellbeing', value: 'HEALTH' },
  { label: 'Science & Research', value: 'SCIENCE' },
  { label: 'Education & Literacy', value: 'EDUCATION' },
  { label: 'Public Policy', value: 'PUBLIC_POLICY' },
  { label: 'Community & Civic', value: 'COMMUNITY' },
  { label: 'Business & Economy', value: 'BUSINESS' },
  { label: 'Arts & Culture', value: 'ARTS_CULTURE' },
];

const DURATION_OPTIONS = [15, 30, 45, 60];

const CHANNEL_OPTIONS = ['Instagram', 'YouTube', 'Local Transit Screens', 'Google Display'];
const LOCATION_OPTIONS = ['Mumbai', 'Delhi NCR', 'Pune', 'Bangalore', 'Maharashtra', 'All India'];
const INTEREST_OPTIONS = ['Environmental Conservation', 'Public Welfare', 'Youth Education', 'Clean Water', 'Renewable Energy'];

export default function CreateStepScreen() {
  const router = useRouter();
  const { step } = useLocalSearchParams<{ step: string }>();
  const stepNumber = Math.max(1, Math.min(5, parseInt(step || '1', 10)));

  const {
    draft,
    updateBasics,
    updateStory,
    updateVisuals,
    updateReach,
    updateSubmit,
    saveCurrentStep,
  } = useDraft();

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1 validation & save
  const handleNext = async () => {
    setErrorMsg(null);
    if (stepNumber === 1) {
      if (!draft.basics.title.trim()) {
        setErrorMsg('Please enter a campaign title');
        return;
      }
      if (!draft.basics.summary.trim()) {
        setErrorMsg('Please enter a short description');
        return;
      }
    } else if (stepNumber === 2) {
      if (!draft.story.headline?.trim() && !draft.basics.title) {
        setErrorMsg('Please enter a headline for the campaign story');
        return;
      }
    } else if (stepNumber === 5) {
      if (!draft.submit.agreedToTerms) {
        setErrorMsg('You must agree to the terms to submit');
        return;
      }
    }

    try {
      setSaving(true);
      await saveCurrentStep(stepNumber);
      if (stepNumber < 5) {
        router.push(`/create/${stepNumber + 1}` as any);
      } else {
        Alert.alert(
          'Campaign Submitted!',
          'Your campaign has been successfully submitted for review and will be live shortly.',
          [
            {
              text: 'View My Campaigns',
              onPress: () => router.replace('/user/campaigns' as any),
            },
          ]
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save step. Please check required fields.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.headerWrapper}>
        <HeaderBar
          title="Create Campaign"
          showBack
          onBack={() => {
            if (stepNumber > 1) {
              router.push(`/create/${stepNumber - 1}` as any);
            } else {
              router.back();
            }
          }}
          rightAction={
            draft.campaignId ? (
              <TouchableOpacity
                onPress={() => router.push('/create/preview' as any)}
                style={styles.previewBtn}
              >
                <Eye size={18} color={Colors.primary} />
                <Text style={styles.previewBtnText}>Preview</Text>
              </TouchableOpacity>
            ) : null
          }
        />
        <StepStepper
          currentStep={stepNumber}
          onStepPress={(s) => {
            if (s <= draft.currentStep) {
              router.push(`/create/${s}` as any);
            }
          }}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* STEP 1: BASICS matching Screen 5 in reference */}
        {stepNumber === 1 && (
          <View>
            <Text style={styles.stepTitle}>Let's start with the basics</Text>
            <Text style={styles.stepSubtitle}>
              Give your campaign a clear and compelling foundation.
            </Text>

            <Input
              label="Campaign title"
              placeholder="e.g. Clean Rivers Brighter Futures"
              value={draft.basics.title}
              maxLength={100}
              showCharCount
              onChangeText={(text) => updateBasics({ title: text })}
            />

            <SelectDropdown
              label="Category"
              value={draft.basics.category}
              options={CATEGORY_OPTIONS}
              onSelect={(val) => updateBasics({ category: val })}
            />

            <Input
              label="Short description"
              placeholder="Briefly describe your campaign and the message you want to amplify."
              value={draft.basics.summary}
              multiline
              maxLength={300}
              showCharCount
              onChangeText={(text) => updateBasics({ summary: text })}
            />

            <Input
              label="Cover image URL"
              placeholder="https://images.unsplash.com/..."
              value={draft.basics.coverImageUrl}
              onChangeText={(text) => updateBasics({ coverImageUrl: text })}
            />

            <TipCallout text="A clear and specific title and description helps attract the right audience." />
          </View>
        )}

        {/* STEP 2: STORY */}
        {stepNumber === 2 && (
          <View>
            <Text style={styles.stepTitle}>Tell your story</Text>
            <Text style={styles.stepSubtitle}>
              Share the context, facts, and why this public interest message needs amplification.
            </Text>

            <Input
              label="Headline"
              placeholder="e.g. Children in rural schools walk 3km for drinking water"
              value={draft.story.headline}
              onChangeText={(text) => updateStory({ headline: text })}
            />

            <Input
              label="Introduction / Key Context"
              placeholder="Over 50 schools currently lack working water filters, impacting over 8,000 students."
              value={draft.story.introText}
              multiline
              onChangeText={(text) => updateStory({ introText: text })}
            />

            <Text style={styles.fieldSectionLabel}>Story Content Blocks</Text>
            {draft.story.storyContent?.map((block, idx) => (
              <View key={block.id || idx} style={styles.blockRow}>
                <Input
                  placeholder="Detail your message, key facts or solution..."
                  value={block.content}
                  multiline
                  style={{ minHeight: 70 }}
                  containerStyle={{ flex: 1 }}
                  onChangeText={(text) => {
                    const updated = [...(draft.story.storyContent || [])];
                    updated[idx] = { ...updated[idx], content: text };
                    updateStory({ storyContent: updated });
                  }}
                />
                {draft.story.storyContent!.length > 1 && (
                  <TouchableOpacity
                    onPress={() => {
                      const updated = draft.story.storyContent!.filter((_, i) => i !== idx);
                      updateStory({ storyContent: updated });
                    }}
                    style={styles.deleteBlockBtn}
                  >
                    <Trash2 size={16} color={Colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity
              onPress={() => {
                const updated = [
                  ...(draft.story.storyContent || []),
                  { id: String(Date.now()), type: 'text' as const, content: '' },
                ];
                updateStory({ storyContent: updated });
              }}
              style={styles.addBlockBtn}
            >
              <Plus size={16} color={Colors.primary} />
              <Text style={styles.addBlockText}>Add Story Paragraph</Text>
            </TouchableOpacity>

            <TipCallout text="Campaigns with verified facts and clear stories raise 3x faster than generic appeals." />
          </View>
        )}

        {/* STEP 3: VISUALS */}
        {stepNumber === 3 && (
          <View>
            <Text style={styles.stepTitle}>Campaign & Ad Visuals</Text>
            <Text style={styles.stepSubtitle}>
              Upload or link creatives that will be served as advertisements across networks.
            </Text>

            {draft.visuals.creatives.map((creative, idx) => (
              <View key={idx} style={styles.creativeCard}>
                <Text style={styles.creativeCardLabel}>
                  {creative.type === 'cover' ? 'Primary Ad Creative' : `Ad Creative #${idx + 1}`}
                </Text>
                <Input
                  label="Image URL"
                  placeholder="https://images.unsplash.com/..."
                  value={creative.url}
                  onChangeText={(text) => {
                    const updated = [...draft.visuals.creatives];
                    updated[idx] = { ...updated[idx], url: text };
                    updateVisuals({ creatives: updated });
                  }}
                />
                <Input
                  label="Ad Headline"
                  placeholder="e.g. Pure Water for Every Student"
                  value={creative.headline}
                  onChangeText={(text) => {
                    const updated = [...draft.visuals.creatives];
                    updated[idx] = { ...updated[idx], headline: text };
                    updateVisuals({ creatives: updated });
                  }}
                />
                <Input
                  label="Call to Action Label"
                  placeholder="e.g. Support Distribution"
                  value={creative.callToAction}
                  onChangeText={(text) => {
                    const updated = [...draft.visuals.creatives];
                    updated[idx] = { ...updated[idx], callToAction: text };
                    updateVisuals({ creatives: updated });
                  }}
                />
              </View>
            ))}

            <TipCallout text="High quality 16:9 and 1:1 visuals perform best on Instagram and public display ads." />
          </View>
        )}

        {/* STEP 4: REACH */}
        {stepNumber === 4 && (
          <View>
            <Text style={styles.stepTitle}>Reach & Distribution</Text>
            <Text style={styles.stepSubtitle}>
              Select where and how your community-funded ads will be distributed.
            </Text>

            <Text style={styles.fieldSectionLabel}>Target Locations</Text>
            <View style={styles.chipsWrap}>
              {LOCATION_OPTIONS.map((loc) => {
                const selected = draft.reach.targetLocations?.includes(loc);
                return (
                  <TouchableOpacity
                    key={loc}
                    onPress={() => {
                      const cur = draft.reach.targetLocations || [];
                      const updated = selected ? cur.filter((l) => l !== loc) : [...cur, loc];
                      updateReach({ targetLocations: updated });
                    }}
                    style={[styles.chip, selected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                      {loc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldSectionLabel}>Audience Interests</Text>
            <View style={styles.chipsWrap}>
              {INTEREST_OPTIONS.map((interest) => {
                const selected = draft.reach.audienceInterests?.includes(interest);
                return (
                  <TouchableOpacity
                    key={interest}
                    onPress={() => {
                      const cur = draft.reach.audienceInterests || [];
                      const updated = selected
                        ? cur.filter((i) => i !== interest)
                        : [...cur, interest];
                      updateReach({ audienceInterests: updated });
                    }}
                    style={[styles.chip, selected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                      {interest}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldSectionLabel}>Distribution Channels</Text>
            <View style={styles.chipsWrap}>
              {CHANNEL_OPTIONS.map((ch) => {
                const selected = draft.reach.distributionChannels?.includes(ch);
                return (
                  <TouchableOpacity
                    key={ch}
                    onPress={() => {
                      const cur = draft.reach.distributionChannels || [];
                      const updated = selected ? cur.filter((c) => c !== ch) : [...cur, ch];
                      updateReach({ distributionChannels: updated });
                    }}
                    style={[styles.chip, selected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                      {ch}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldSectionLabel}>Campaign Duration</Text>
            <View style={styles.durationRow}>
              {DURATION_OPTIONS.map((days) => {
                const selected = draft.reach.campaignDuration === days;
                return (
                  <TouchableOpacity
                    key={days}
                    onPress={() => updateReach({ campaignDuration: days })}
                    style={[styles.durationBtn, selected && styles.durationBtnActive]}
                  >
                    <Text
                      style={[
                        styles.durationBtnText,
                        selected && styles.durationBtnTextActive,
                      ]}
                    >
                      {days} Days
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TipCallout text="30 to 45 day distribution runs generate the most consistent engagement." />
          </View>
        )}

        {/* STEP 5: SUBMIT */}
        {stepNumber === 5 && (
          <View>
            <Text style={styles.stepTitle}>Review & Set Target Budget</Text>
            <Text style={styles.stepSubtitle}>
              Define your amplification funding goal and projected audience reach.
            </Text>

            <Input
              label="Funding Goal (in Rupees)"
              placeholder="50000"
              keyboardType="numeric"
              value={String(Math.round(draft.submit.fundingGoalPaise / 100))}
              onChangeText={(text) => {
                const val = parseInt(text.replace(/[^0-9]/g, '') || '0', 10);
                const reachEstimate = val * 25; // ~25 people reached per rupee funded
                updateSubmit({
                  fundingGoalPaise: val * 100,
                  estimatedReach: reachEstimate,
                });
              }}
            />

            <View style={styles.reachEstimateBox}>
              <Text style={styles.reachEstimateTitle}>Projected Estimated Reach</Text>
              <Text style={styles.reachEstimateValue}>
                ~ {draft.submit.estimatedReach.toLocaleString('en-IN')} people
              </Text>
              <Text style={styles.reachEstimateSub}>
                Based on current cost per thousand impressions (CPM) in selected target channels. Non-guaranteed estimate.
              </Text>
            </View>

            {/* Terms and non-donation acknowledgment checkbox */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => updateSubmit({ agreedToTerms: !draft.submit.agreedToTerms })}
              style={styles.termsRow}
            >
              <View
                style={[
                  styles.checkbox,
                  draft.submit.agreedToTerms && styles.checkboxChecked,
                ]}
              >
                {draft.submit.agreedToTerms && (
                  <Text style={styles.checkboxCheckmark}>✓</Text>
                )}
              </View>
              <Text style={styles.termsText}>
                I understand that this fund is exclusively for message distribution and ad amplification, not a direct donation. I agree to the platform amplification terms.
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {errorMsg && <Text style={styles.errorBanner}>{errorMsg}</Text>}
      </ScrollView>

      {/* Fixed bottom Save & Continue button matching reference */}
      <View style={styles.fixedBottomBar}>
        <Button
          title={stepNumber === 5 ? 'Submit Campaign for Review' : 'Save and Continue'}
          showArrow={stepNumber < 5}
          loading={saving}
          onPress={handleNext}
          style={styles.nextBtn}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerWrapper: {
    paddingHorizontal: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: Colors.primaryBg,
    borderRadius: Radii.full,
  },
  previewBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 110,
  },
  stepTitle: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  fieldSectionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  deleteBlockBtn: {
    padding: Spacing.sm,
  },
  addBlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  addBlockText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  creativeCard: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  creativeCardLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: Typography.weights.semibold,
  },
  durationRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  durationBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  durationBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  durationBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
  },
  durationBtnTextActive: {
    color: Colors.primary,
    fontWeight: Typography.weights.bold,
  },
  reachEstimateBox: {
    backgroundColor: Colors.primaryBg,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    padding: Spacing.md,
    marginVertical: Spacing.md,
  },
  reachEstimateTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  reachEstimateValue: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.extrabold,
    color: Colors.primary,
    marginVertical: 4,
  },
  reachEstimateSub: {
    fontSize: 11,
    color: Colors.primaryDark,
    lineHeight: 16,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  errorBanner: {
    color: Colors.error,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginVertical: Spacing.sm,
  },
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  nextBtn: {
    width: '100%',
  },
});
