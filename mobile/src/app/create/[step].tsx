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
  ActivityIndicator,
  Image as RNImage,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Eye,
  Users,
  Check,
  Globe,
  Trash2,
  Image as ImageIcon,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Layers,
  Sparkles,
  ExternalLink,
  Calendar,
  Share2,
} from 'lucide-react-native';
import { HeaderBar } from '../../components/common/header-bar';
import { StepStepper } from '../../components/creation/step-stepper';
import { Input, SelectDropdown } from '../../components/common/input';
import { Button } from '../../components/common/button';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../constants/theme';
import { useDraft } from '../../context/draft-context';
import { useAuth } from '../../context/auth-context';
import { ImageUploadDropzone } from '../../components/creation/image-upload-dropzone';
import { resolveImageUrl } from '../../constants/config';

const CATEGORY_OPTIONS = [
  { label: 'Environment & Climate', value: 'ENVIRONMENT' },
  { label: 'Healthcare & Wellbeing', value: 'HEALTH' },
  { label: 'Education & Literacy', value: 'EDUCATION' },
  { label: 'Science & Research', value: 'SCIENCE' },
  { label: 'Public Policy', value: 'PUBLIC_POLICY' },
  { label: 'Economic Policy', value: 'ECONOMIC_POLICY' },
  { label: 'Community & Civic', value: 'COMMUNITY' },
  { label: 'Arts & Culture', value: 'ARTS_CULTURE' },
  { label: 'Business & Economy', value: 'BUSINESS' },
  { label: 'Other', value: 'OTHER' },
];

const LOCATION_OPTIONS = [
  'All India',
  'Mumbai',
  'Delhi NCR',
  'Bangalore',
  'Pune',
  'Hyderabad',
  'Chennai',
  'Kolkata',
];

const INTEREST_OPTIONS = [
  'Sustainability',
  'Public Health',
  'Education & Literacy',
  'Clean Tech',
  'Civic Action',
  'Science & Innovation',
  'Consumer Welfare',
  'Renewable Energy',
];

const CHANNEL_OPTIONS = [
  'Meta (Instagram & Facebook)',
  'Google & YouTube Ads',
  'Verified Public Feeds',
  'X / Twitter Promoted',
];

const DURATION_OPTIONS = [
  { days: 15, label: '15 Days' },
  { days: 30, label: '30 Days (Recommended)' },
  { days: 45, label: '45 Days' },
  { days: 60, label: '60 Days' },
];

const BUDGET_ALLOCATION_OPTIONS = [
  {
    title: 'Balanced (50% Social / 50% Search & Feeds)',
    desc: 'Even split across feed awareness and high-intent search ads.',
  },
  {
    title: 'Social Feed Heavy (80% Social / 20% Search)',
    desc: 'Maximum visual impact and shares on Instagram and Facebook feeds.',
  },
  {
    title: 'High-Intent Search & Video (30% Social / 70% Search & Video)',
    desc: 'Prioritizes educational video distribution and Google search queries.',
  },
];

const CTA_OPTIONS = [
  'Support Amplification',
  'Learn More',
  'Take Action',
  'Join the Cause',
  'Spread the Word',
];

const FUNDING_PRESETS = [500, 1000, 2500, 5000];

export default function CreateStepScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { step } = useLocalSearchParams<{ step: string }>();
  const stepNumber = Math.max(1, Math.min(5, parseInt(step || '1', 10)));

  const {
    draft,
    updateBasics,
    updateStory,
    updateVisuals,
    updateReach,
    updateSubmit,
    updateCoverImage,
    updateAdImage,
    updateAdCreative,
    saveCurrentStep,
    saveDraftOnly,
    resetDraft,
  } = useDraft();
  const { isAuthenticated, promptAuth } = useAuth();

  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [customLocation, setCustomLocation] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Active cover image helper
  const activeCoverImage =
    draft.basics.coverImageUrl || draft.visuals.creatives[0]?.url || '';

  // Active ad creative helper
  const adCreative = draft.visuals.creatives[1] || {
    type: 'ad_image',
    url: '',
    headline: draft.basics.title || '',
    description: '',
    callToAction: 'Support Amplification',
    sortOrder: 1,
  };

  // Funding calculations
  const fundingInDollars = Math.round((draft.submit.fundingGoalPaise || 100000) / 100);
  const calculatedReachMin = Math.round(fundingInDollars * 70);
  const calculatedReachMax = Math.round(fundingInDollars * 130);

  // Sources helper
  const sourcesList =
    draft.story.sources && draft.story.sources.length > 0
      ? draft.story.sources
      : [{ title: '', url: '' }];

  const handleUpdateSource = (index: number, field: 'title' | 'url', value: string) => {
    const updated = [...sourcesList];
    updated[index] = { ...updated[index], [field]: value };
    updateStory({ sources: updated });
  };

  const handleAddSource = () => {
    updateStory({ sources: [...sourcesList, { title: '', url: '' }] });
  };

  const handleRemoveSource = (index: number) => {
    if (sourcesList.length <= 1) {
      updateStory({ sources: [{ title: '', url: '' }] });
      return;
    }
    const updated = sourcesList.filter((_, i) => i !== index);
    updateStory({ sources: updated });
  };

  // Manual "Save as Draft" action
  const handleSaveDraft = async () => {
    if (!isAuthenticated) {
      promptAuth({
        title: 'Sign In to Save Draft',
        reason: 'Sign in to save this campaign draft to your account.',
        onSuccess: async () => {
          await handleSaveDraft();
        },
      });
      return;
    }

    setErrorMsg(null);
    setSavingDraft(true);
    try {
      const ok = await saveDraftOnly(stepNumber);
      if (ok) {
        setDraftSavedToast(true);
        setTimeout(() => setDraftSavedToast(false), 3000);
      } else {
        setErrorMsg('Failed to save draft. Please check your connection.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error saving draft');
    } finally {
      setSavingDraft(false);
    }
  };

  // Step advancement & validation
  const handleNext = async () => {
    if (!isAuthenticated) {
      promptAuth({
        title: 'Sign In to Continue',
        reason: 'Sign in to save and proceed with your campaign creation.',
        onSuccess: async () => {
          await handleNext();
        },
      });
      return;
    }

    setErrorMsg(null);

    // 1. Basics validation
    if (stepNumber === 1) {
      if (!draft.basics.title?.trim()) {
        setErrorMsg('Campaign title is required.');
        return;
      }
      if (draft.basics.title.trim().length > 60) {
        setErrorMsg('Campaign title must be 60 characters or fewer.');
        return;
      }
      if (!draft.basics.creatorName?.trim()) {
        setErrorMsg('Creator or organization name is required.');
        return;
      }
    }

    // 2. Story validation
    if (stepNumber === 2) {
      if (!draft.story.introText?.trim()) {
        setErrorMsg('Please share your campaign story.');
        return;
      }
    }

    // 3. Visuals validation
    if (stepNumber === 3) {
      const hasImage =
        Boolean(draft.basics.coverImageUrl?.trim()) ||
        Boolean(draft.visuals.creatives[0]?.url?.trim()) ||
        Boolean(adCreative.url?.trim());

      if (!hasImage) {
        updateCoverImage('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800');
      }
    }

    // 4. Reach validation
    if (stepNumber === 4) {
      if (!draft.reach.targetLocations?.length) {
        updateReach({ targetLocations: ['All India'] });
      }
      if (!draft.reach.distributionChannels?.length) {
        updateReach({ distributionChannels: ['Meta (Instagram & Facebook)', 'Google & YouTube Ads'] });
      }
      if (!draft.reach.budgetAllocation) {
        updateReach({ budgetAllocation: BUDGET_ALLOCATION_OPTIONS[0].title });
      }
    }

    // 5. Submit validation
    if (stepNumber === 5) {
      if (!draft.submit.agreedToTerms) {
        setErrorMsg('Please confirm agreement to campaign rules and non-donation policies.');
        return;
      }
      if ((draft.submit.fundingGoalPaise || 0) < 1000) {
        setErrorMsg('Funding goal must be at least $10.');
        return;
      }
    }

    try {
      setSaving(true);
      await saveCurrentStep(stepNumber);

      if (stepNumber < 5) {
        router.push(`/create/${stepNumber + 1}` as any);
      } else {
        // Step 5 successfully submitted to backend! Show confirmation screen with status timeline
        setIsSubmitted(true);
      }
    } catch (err: any) {
      const detailsMsg = err.details?.length
        ? ': ' +
          err.details
            .map((d: any) => `${d.field ? d.field + ': ' : ''}${d.message}`)
            .join(', ')
        : '';
      setErrorMsg(
        (err.message || 'Failed to submit campaign. Please check required fields.') + detailsMsg
      );
    } finally {
      setSaving(false);
    }
  };

  // ─── Post-Submission Confirmation Screen with Campaign Status Timeline ───
  if (isSubmitted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <HeaderBar title="Submission Complete" showBack={false} />
        <ScrollView contentContainerStyle={styles.confirmationScroll}>
          <View style={styles.successBadgeCircle}>
            <CheckCircle2 size={44} color="#059669" />
          </View>

          <Text style={styles.successTitle}>Campaign Submitted for Review!</Text>
          <Text style={styles.successSubtitle}>
            Your campaign “{draft.basics.title || 'My Campaign'}” has been received and is now in
            the editorial queue.
          </Text>

          {/* Campaign Status Timeline */}
          <View style={styles.timelineCard}>
            <Text style={styles.timelineHeaderTitle}>Campaign Status Timeline</Text>
            <Text style={styles.timelineHeaderSub}>
              Track your campaign's progress from verification to verified live ad reach.
            </Text>

            <View style={styles.timelineList}>
              {/* Timeline item 1 */}
              <View style={styles.timelineRow}>
                <View style={styles.timelineIconCol}>
                  <View style={[styles.timelineNode, styles.timelineNodeDone]}>
                    <Check size={13} color="#FFFFFF" strokeWidth={3} />
                  </View>
                  <View style={[styles.timelineBar, styles.timelineBarDone]} />
                </View>
                <View style={styles.timelineContentCol}>
                  <Text style={styles.timelineStepTitle}>1. Draft Submitted</Text>
                  <Text style={styles.timelineStepDesc}>
                    Campaign details, story, verified sources, and ad creatives saved.
                  </Text>
                  <Text style={styles.timelineStepTime}>Completed just now</Text>
                </View>
              </View>

              {/* Timeline item 2 */}
              <View style={styles.timelineRow}>
                <View style={styles.timelineIconCol}>
                  <View style={[styles.timelineNode, styles.timelineNodeActive]}>
                    <Clock size={13} color="#2563EB" strokeWidth={2.5} />
                  </View>
                  <View style={styles.timelineBar} />
                </View>
                <View style={styles.timelineContentCol}>
                  <Text style={[styles.timelineStepTitle, { color: '#2563EB' }]}>
                    2. Editorial & Policy Review
                  </Text>
                  <Text style={styles.timelineStepDesc}>
                    RippleUp editors review supporting sources, factual claims, and advertising
                    content for safety and transparency.
                  </Text>
                  <View style={styles.inReviewBadge}>
                    <Text style={styles.inReviewBadgeText}>In Progress • Usually within 24h</Text>
                  </View>
                </View>
              </View>

              {/* Timeline item 3 */}
              <View style={styles.timelineRow}>
                <View style={styles.timelineIconCol}>
                  <View style={styles.timelineNode}>
                    <DollarSign size={13} color="#9CA3AF" />
                  </View>
                  <View style={styles.timelineBar} />
                </View>
                <View style={styles.timelineContentCol}>
                  <Text style={styles.timelineStepTitleMuted}>3. Backer Funding Live</Text>
                  <Text style={styles.timelineStepDesc}>
                    Campaign is published for supporters to contribute toward the{' '}
                    <Text style={{ fontWeight: '700' }}>${fundingInDollars.toLocaleString()}</Text>{' '}
                    message amplification pool.
                  </Text>
                </View>
              </View>

              {/* Timeline item 4 */}
              <View style={styles.timelineRow}>
                <View style={styles.timelineIconCol}>
                  <View style={styles.timelineNode}>
                    <Globe size={13} color="#9CA3AF" />
                  </View>
                  <View style={styles.timelineBar} />
                </View>
                <View style={styles.timelineContentCol}>
                  <Text style={styles.timelineStepTitleMuted}>4. Verified Ad Distribution</Text>
                  <Text style={styles.timelineStepDesc}>
                    Targeted advertisements run across {draft.reach.distributionChannels?.join(', ') || 'Meta and Google'}{' '}
                    to reach ~{calculatedReachMin.toLocaleString()} – {calculatedReachMax.toLocaleString()} people.
                  </Text>
                </View>
              </View>

              {/* Timeline item 5 */}
              <View style={[styles.timelineRow, { marginBottom: 0 }]}>
                <View style={styles.timelineIconCol}>
                  <View style={styles.timelineNode}>
                    <Sparkles size={13} color="#9CA3AF" />
                  </View>
                </View>
                <View style={styles.timelineContentCol}>
                  <Text style={styles.timelineStepTitleMuted}>5. Impact & Verification Report</Text>
                  <Text style={styles.timelineStepDesc}>
                    Live metrics, click-through data, and verified reach receipts are generated for
                    all campaign backers.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.confirmationActions}>
            <Button
              title="View My Campaigns"
              onPress={async () => {
                await resetDraft();
                router.replace('/user/campaigns' as any);
              }}
              style={{ width: '100%', marginBottom: Spacing.sm }}
            />
            <Button
              title="Return to Home"
              variant="outline"
              onPress={async () => {
                await resetDraft();
                router.replace('/' as any);
              }}
              style={{ width: '100%' }}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <HeaderBar
          title="Create Campaign"
          showBack
          onBack={() => {
            if (stepNumber > 1) {
              router.push(`/create/${stepNumber - 1}` as any);
            } else if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)' as any);
            }
          }}
          rightAction={
            <View style={styles.headerRightActions}>
              <TouchableOpacity
                onPress={handleSaveDraft}
                disabled={savingDraft}
                style={styles.saveDraftBtn}
                activeOpacity={0.8}
              >
                {savingDraft ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <Clock size={14} color={Colors.primary} />
                    <Text style={styles.saveDraftBtnText}>Save as Draft</Text>
                  </>
                )}
              </TouchableOpacity>

              {draft.campaignId ? (
                <TouchableOpacity
                  onPress={() => router.push('/create/preview' as any)}
                  style={styles.previewBtn}
                >
                  <Eye size={15} color={Colors.primary} />
                  <Text style={styles.previewBtnText}>Preview</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />

        <StepStepper
          currentStep={stepNumber}
          onStepPress={(s) => {
            if (s <= draft.currentStep || draft.campaignId) {
              router.push(`/create/${s}` as any);
            }
          }}
        />

        {draftSavedToast && (
          <View style={styles.savedToast}>
            <CheckCircle2 size={14} color="#059669" />
            <Text style={styles.savedToastText}>Draft saved successfully</Text>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 90 },
        ]}
      >
        {/* ─── STEP 1: BASICS ─── */}
        {stepNumber === 1 && (
          <View>
            <Text style={styles.stepTitle}>Let's start with your idea.</Text>
            <Text style={styles.stepSubtitle}>
              Give your campaign a clear foundation so people immediately understand your message.
            </Text>

            <Input
              label="Campaign title (Required)"
              placeholder="What is your message? (e.g. Save Coastal Mangroves)"
              value={draft.basics.title}
              maxLength={60}
              showCharCount
              onChangeText={(text) => {
                updateBasics({ title: text });
                if (!adCreative.headline || adCreative.headline === draft.basics.title) {
                  updateAdCreative({ headline: text });
                }
              }}
            />

            <SelectDropdown
              label="Category (Required)"
              value={draft.basics.category}
              options={CATEGORY_OPTIONS}
              onSelect={(val) => updateBasics({ category: val })}
            />

            <Input
              label="Creator or organization name (Required)"
              placeholder="e.g. Maya Sharma or Clean Air Coalition"
              value={draft.basics.creatorName}
              maxLength={80}
              onChangeText={(text) => updateBasics({ creatorName: text })}
            />

            <Input
              label="Short summary (Optional)"
              placeholder="Describe your campaign in one or two sentences."
              value={draft.basics.summary}
              multiline
              maxLength={200}
              showCharCount
              onChangeText={(text) => updateBasics({ summary: text })}
            />

            <ImageUploadDropzone
              label="Cover image (Optional)"
              subtitle="Upload a landscape image representing your campaign."
              value={activeCoverImage}
              onChange={(url) => updateCoverImage(url)}
              target="cover"
              aspect={[16, 9]}
            />
          </View>
        )}

        {/* ─── STEP 2: STORY ─── */}
        {stepNumber === 2 && (
          <View>
            <Text style={styles.stepTitle}>Tell people why it matters.</Text>
            <Text style={styles.stepSubtitle}>
              Keep this screen focused on your campaign narrative and verified supporting references.
            </Text>

            <Input
              label="Campaign story (Required)"
              placeholder="What should people know, and why does it matter? Explain the problem, the urgency, and why spreading this message creates impact."
              value={draft.story.introText}
              multiline
              style={styles.storyInput}
              onChangeText={(text) =>
                updateStory({
                  introText: text,
                  headline: draft.basics.title,
                })
              }
            />

            {/* Dynamic Supporting Sources Section */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.fieldLabel}>Supporting sources (Optional)</Text>
                <Text style={styles.fieldSubtitle}>
                  Add credible reports, articles, or research backing your campaign.
                </Text>
              </View>
            </View>

            {sourcesList.map((src, index) => (
              <View key={`source-${index}`} style={styles.sourceCard}>
                <View style={styles.sourceCardHeader}>
                  <Text style={styles.sourceIndexBadge}>Source #{index + 1}</Text>
                  {sourcesList.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveSource(index)}
                      style={styles.removeSourceBtn}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={14} color="#EF4444" />
                      <Text style={styles.removeSourceBtnText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Input
                  label="Source title"
                  placeholder="e.g. National Biodiversity Assessment 2026"
                  value={src.title}
                  onChangeText={(val) => handleUpdateSource(index, 'title', val)}
                  containerStyle={{ marginBottom: 8 }}
                />

                <Input
                  label="Source URL"
                  placeholder="https://example.org/report"
                  value={src.url}
                  autoCapitalize="none"
                  keyboardType="url"
                  onChangeText={(val) => handleUpdateSource(index, 'url', val)}
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
            ))}

            <TouchableOpacity
              onPress={handleAddSource}
              style={styles.addSourceBtn}
              activeOpacity={0.8}
            >
              <Plus size={16} color={Colors.primary} />
              <Text style={styles.addSourceBtnText}>Add another source</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── STEP 3: CAMPAIGN & AD VISUALS ─── */}
        {stepNumber === 3 && (
          <View>
            <Text style={styles.stepTitle}>Campaign & Ad Visuals</Text>
            <Text style={styles.stepSubtitle}>
              Give your message a visual identity. Upload an advertising creative or reuse your cover image.
            </Text>

            {/* Campaign Cover Image Check / Edit */}
            <View style={styles.visualsSectionBox}>
              <Text style={styles.fieldLabel}>Campaign cover image</Text>
              <Text style={styles.fieldSubtitle}>
                This header visual represents your campaign on discover and detail pages.
              </Text>
              <ImageUploadDropzone
                value={activeCoverImage}
                onChange={(url) => updateCoverImage(url)}
                target="cover"
                aspect={[16, 9]}
                compact
              />
            </View>

            {/* Dedicated Ad Creative with 1-Click Reuse Option */}
            <View style={[styles.visualsSectionBox, { marginTop: Spacing.md }]}>
              <Text style={styles.fieldLabel}>Advertising creative image</Text>
              <Text style={styles.fieldSubtitle}>
                Square creative formatted for sponsored feeds and social ad placements.
              </Text>
              <ImageUploadDropzone
                value={adCreative.url}
                onChange={(url) => updateAdImage(url)}
                target="ad"
                aspect={[1, 1]}
                canReuseCover={Boolean(activeCoverImage)}
                coverImageUrl={activeCoverImage}
              />
            </View>

            {/* Ad Headline */}
            <Input
              label="Ad headline"
              placeholder={`Defaults to: ${draft.basics.title || 'Campaign Title'}`}
              value={adCreative.headline || draft.basics.title || ''}
              maxLength={90}
              showCharCount
              onChangeText={(text) => updateAdCreative({ headline: text })}
            />

            {/* Ad Description */}
            <Input
              label="Ad description (Optional)"
              placeholder="Short description displayed beneath your ad image in social feeds."
              value={adCreative.description || ''}
              multiline
              maxLength={280}
              showCharCount
              onChangeText={(text) => updateAdCreative({ description: text })}
            />

            {/* Call To Action Selector */}
            <Text style={styles.fieldLabel}>Call-to-action selection</Text>
            <Text style={styles.fieldSubtitle}>
              Choose the button label displayed on your distributed ads:
            </Text>
            <View style={styles.chipsWrap}>
              {CTA_OPTIONS.map((cta) => {
                const isSelected = (adCreative.callToAction || 'Support Amplification') === cta;
                return (
                  <TouchableOpacity
                    key={cta}
                    onPress={() => updateAdCreative({ callToAction: cta })}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {cta}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── STEP 4: REACH ─── */}
        {stepNumber === 4 && (
          <View>
            <Text style={styles.stepTitle}>Choose who you want to reach.</Text>
            <Text style={styles.stepSubtitle}>
              Set up straightforward targeting, channel selection, and advertising budget allocation.
            </Text>

            {/* 1. Target Geographic Location */}
            <Text style={styles.fieldLabel}>Target geographic location</Text>
            <Text style={styles.fieldSubtitle}>Select target regions, states, or major cities:</Text>
            <View style={styles.chipsWrap}>
              {LOCATION_OPTIONS.map((loc) => {
                const selected = draft.reach.targetLocations?.includes(loc);
                return (
                  <TouchableOpacity
                    key={loc}
                    onPress={() => {
                      const cur = draft.reach.targetLocations || [];
                      const updated = selected
                        ? cur.filter((l) => l !== loc)
                        : [...cur, loc];
                      updateReach({ targetLocations: updated.length ? updated : ['All India'] });
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

            <View style={styles.customLocRow}>
              <Input
                placeholder="Or type a custom city or region..."
                value={customLocation}
                containerStyle={{ flex: 1, marginBottom: 0 }}
                onChangeText={setCustomLocation}
              />
              <Button
                title="Add"
                size="sm"
                disabled={!customLocation.trim()}
                onPress={() => {
                  if (customLocation.trim()) {
                    const cur = draft.reach.targetLocations || [];
                    updateReach({ targetLocations: [...cur, customLocation.trim()] });
                    setCustomLocation('');
                  }
                }}
                style={styles.addLocBtn}
              />
            </View>

            {/* 2. Intended Audience Interests */}
            <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
              Audience interests & characteristics
            </Text>
            <Text style={styles.fieldSubtitle}>
              Select areas of interest for people receptive to your cause:
            </Text>
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

            {/* 3. Available Distribution Channels */}
            <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
              Available distribution channels
            </Text>
            <Text style={styles.fieldSubtitle}>
              Channels where verified advertisements will be served:
            </Text>
            <View style={styles.chipsWrap}>
              {CHANNEL_OPTIONS.map((channel) => {
                const selected = draft.reach.distributionChannels?.includes(channel);
                return (
                  <TouchableOpacity
                    key={channel}
                    onPress={() => {
                      const cur = draft.reach.distributionChannels || [];
                      const updated = selected
                        ? cur.filter((c) => c !== channel)
                        : [...cur, channel];
                      updateReach({ distributionChannels: updated.length ? updated : [channel] });
                    }}
                    style={[styles.chip, selected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                      {channel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 4. Campaign Duration */}
            <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
              Campaign duration
            </Text>
            <Text style={styles.fieldSubtitle}>
              How long should the ad distribution run once funded?
            </Text>
            <View style={styles.chipsWrap}>
              {DURATION_OPTIONS.map((opt) => {
                const isSelected = (draft.reach.campaignDuration || 30) === opt.days;
                return (
                  <TouchableOpacity
                    key={opt.days}
                    onPress={() => updateReach({ campaignDuration: opt.days })}
                    style={[styles.chip, isSelected && styles.chipActive]}
                  >
                    <Calendar size={13} color={isSelected ? Colors.primary : Colors.textMuted} />
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 5. Advertising Budget Allocation */}
            <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
              Advertising budget allocation
            </Text>
            <Text style={styles.fieldSubtitle}>
              Select how advertising funds are apportioned across media channels:
            </Text>
            <View style={styles.budgetAllocationWrap}>
              {BUDGET_ALLOCATION_OPTIONS.map((item) => {
                const isSelected =
                  (draft.reach.budgetAllocation || BUDGET_ALLOCATION_OPTIONS[0].title) === item.title;
                return (
                  <TouchableOpacity
                    key={item.title}
                    onPress={() => updateReach({ budgetAllocation: item.title })}
                    style={[styles.budgetAllocCard, isSelected && styles.budgetAllocCardActive]}
                    activeOpacity={0.8}
                  >
                    <View style={styles.budgetAllocRow}>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.budgetAllocTitle, isSelected && styles.budgetAllocTitleActive]}>
                          {item.title}
                        </Text>
                        <Text style={styles.budgetAllocDesc}>{item.desc}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Live Estimated Reach Preview Banner */}
            <View style={styles.compactReachBox}>
              <View style={styles.reachIconCircle}>
                <Globe size={24} color="#059669" />
              </View>
              <View style={styles.reachTextBox}>
                <View style={styles.reachBadgeRow}>
                  <Text style={styles.compactReachTitle}>
                    ~45,000 – 95,000 estimated reach
                  </Text>
                  <View style={styles.simulatedTag}>
                    <Text style={styles.simulatedTagText}>Simulated Estimate</Text>
                  </View>
                </View>
                <Text style={styles.compactReachSub}>
                  Calculated based on selected locations ({draft.reach.targetLocations?.join(', ') || 'All India'})
                  and {draft.reach.distributionChannels?.length || 2} distribution channels.
                </Text>
                <Text style={styles.reachDisclaimerText}>
                  * This figure is an algorithmic estimate based on demo benchmark models and is not a guaranteed result.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── STEP 5: SUBMIT ─── */}
        {stepNumber === 5 && (
          <View>
            <Text style={styles.stepTitle}>One last look before you submit.</Text>
            <Text style={styles.stepSubtitle}>
              Review your campaign summary, set your required funding goal, and submit for verification.
            </Text>

            {/* Complete Campaign Preview Card */}
            <View style={styles.previewCard}>
              {/* Cover & Creative Images */}
              <View style={styles.previewImagesRow}>
                {activeCoverImage ? (
                  <View style={styles.previewCoverCol}>
                    <ExpoImage
                      source={{ uri: resolveImageUrl(activeCoverImage) }}
                      style={styles.previewImageFull}
                      contentFit="cover"
                      transition={200}
                    />
                    <View style={styles.previewImageTag}>
                      <Text style={styles.previewImageTagText}>Cover Visual</Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.previewImageFull, styles.previewPlaceholderBox]}>
                    <ImageIcon size={26} color="#9CA3AF" />
                    <Text style={styles.previewPlaceholderText}>No cover image</Text>
                  </View>
                )}

                {adCreative.url ? (
                  <View style={styles.previewAdCol}>
                    <ExpoImage
                      source={{ uri: resolveImageUrl(adCreative.url) }}
                      style={styles.previewAdImage}
                      contentFit="cover"
                      transition={200}
                    />
                    <View style={styles.previewImageTag}>
                      <Text style={styles.previewImageTagText}>Ad Creative</Text>
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={styles.previewCardBody}>
                {/* Category & Location Badges */}
                <View style={styles.previewBadgeRow}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {CATEGORY_OPTIONS.find((c) => c.value === draft.basics.category)?.label ||
                        draft.basics.category}
                    </Text>
                  </View>
                  <Text style={styles.locationTag}>
                    📍 {draft.reach.targetLocations?.join(', ') || 'All India'}
                  </Text>
                </View>

                {/* Title & Creator */}
                <Text style={styles.previewCardTitle}>
                  {draft.basics.title || 'Untitled Campaign'}
                </Text>
                <Text style={styles.previewCreatorText}>
                  Created by <Text style={{ fontWeight: '700' }}>{draft.basics.creatorName || 'Campaign Creator'}</Text>
                </Text>

                {/* Summary */}
                {draft.basics.summary ? (
                  <Text style={styles.previewCardSummary}>
                    {draft.basics.summary}
                  </Text>
                ) : null}

                {/* Story Excerpt */}
                <View style={styles.previewDivider} />
                <Text style={styles.previewSubheading}>Story & Narrative</Text>
                <Text numberOfLines={4} style={styles.previewCardDesc}>
                  {draft.story.introText || 'No story provided yet.'}
                </Text>

                {/* Sources List */}
                {sourcesList.some((s) => s.title || s.url) && (
                  <View style={styles.previewSourcesBox}>
                    <Text style={styles.previewSourcesTitle}>Supporting Sources:</Text>
                    {sourcesList
                      .filter((s) => s.title || s.url)
                      .map((s, idx) => (
                        <View key={idx} style={styles.previewSourceRow}>
                          <ExternalLink size={12} color="#059669" />
                          <Text style={styles.previewSourceText}>
                            {s.title ? <Text style={{ fontWeight: '600' }}>{s.title}: </Text> : ''}
                            {s.url}
                          </Text>
                        </View>
                      ))}
                  </View>
                )}

                {/* Ad Creative Breakdown */}
                <View style={styles.previewDivider} />
                <Text style={styles.previewSubheading}>Advertising Creative Details</Text>
                <View style={styles.previewAdDetailsBox}>
                  <Text style={styles.previewAdHeadline}>
                    Headline: {adCreative.headline || draft.basics.title || 'Campaign Ad'}
                  </Text>
                  {adCreative.description ? (
                    <Text style={styles.previewAdDesc}>
                      Description: {adCreative.description}
                    </Text>
                  ) : null}
                  <View style={styles.previewCtaChip}>
                    <Text style={styles.previewCtaChipText}>
                      CTA: {adCreative.callToAction || 'Support Amplification'}
                    </Text>
                  </View>
                </View>

                {/* Reach & Targeting Details */}
                <View style={styles.previewDivider} />
                <Text style={styles.previewSubheading}>Targeting & Distribution</Text>
                <View style={styles.previewTargetingGrid}>
                  <View style={styles.previewGridItem}>
                    <Text style={styles.previewGridLabel}>Channels</Text>
                    <Text style={styles.previewGridValue}>
                      {draft.reach.distributionChannels?.join(', ') || 'Meta & Google'}
                    </Text>
                  </View>
                  <View style={styles.previewGridItem}>
                    <Text style={styles.previewGridLabel}>Duration</Text>
                    <Text style={styles.previewGridValue}>
                      {draft.reach.campaignDuration || 30} Days
                    </Text>
                  </View>
                  <View style={[styles.previewGridItem, { width: '100%' }]}>
                    <Text style={styles.previewGridLabel}>Budget Allocation</Text>
                    <Text style={styles.previewGridValue}>
                      {draft.reach.budgetAllocation || BUDGET_ALLOCATION_OPTIONS[0].title}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Transparent Fee & Funding Policy */}
            <View style={styles.policyCard}>
              <View style={styles.policyHeaderRow}>
                <ShieldCheck size={20} color="#059669" />
                <Text style={styles.policyHeaderTitle}>Transparent Funding & Fee Policies</Text>
              </View>
              <View style={styles.policyBullet}>
                <Text style={styles.policyBulletDot}>•</Text>
                <Text style={styles.policyBulletText}>
                  <Text style={{ fontWeight: '700' }}>95% Ad Placement:</Text> Directly allocated to
                  media spend on verified networks (Meta, Google, YouTube).
                </Text>
              </View>
              <View style={styles.policyBullet}>
                <Text style={styles.policyBulletDot}>•</Text>
                <Text style={styles.policyBulletText}>
                  <Text style={{ fontWeight: '700' }}>5% Processing & Platform:</Text> Covers secure payment
                  gateways, editorial verification, and live reach dashboards.
                </Text>
              </View>
              <View style={styles.policyBullet}>
                <Text style={styles.policyBulletDot}>•</Text>
                <Text style={styles.policyBulletText}>
                  <Text style={{ fontWeight: '700' }}>Non-Donation Model:</Text> Contributions fund verified
                  message amplification, not direct personal donations to the creator.
                </Text>
              </View>
            </View>

            {/* Required Funding Goal Input */}
            <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
              Funding goal (Required)
            </Text>
            <Text style={styles.fieldSubtitle}>
              “How much funding do you need for promotion?” Explicitly select or enter your target:
            </Text>

            <View style={styles.presetsRow}>
              {FUNDING_PRESETS.map((amount) => {
                const isSelected = fundingInDollars === amount;
                return (
                  <TouchableOpacity
                    key={amount}
                    onPress={() => {
                      updateSubmit({
                        fundingGoalPaise: amount * 100,
                        estimatedReach: Math.round(amount * 100),
                      });
                    }}
                    style={[styles.fundingChip, isSelected && styles.fundingChipActive]}
                  >
                    <Text style={[styles.fundingChipText, isSelected && styles.fundingChipTextActive]}>
                      ${amount.toLocaleString('en-US')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Or enter custom amount ($)"
              placeholder="1000"
              keyboardType="numeric"
              value={String(fundingInDollars)}
              onChangeText={(text) => {
                const val = parseInt(text.replace(/[^0-9]/g, '') || '0', 10);
                updateSubmit({
                  fundingGoalPaise: val * 100,
                  estimatedReach: Math.round(val * 100),
                });
              }}
            />

            {/* Live Reach Projection Banner */}
            <View style={styles.projectionBanner}>
              <Users size={20} color="#059669" />
              <View style={{ flex: 1 }}>
                <Text style={styles.projectionText}>
                  Projected reach with ${fundingInDollars.toLocaleString()}:{' '}
                  <Text style={{ fontWeight: '800', color: '#059669' }}>
                    ~{calculatedReachMin.toLocaleString('en-US')} – {calculatedReachMax.toLocaleString('en-US')} people
                  </Text>
                </Text>
                <Text style={styles.projectionDisclaimer}>
                  Algorithmic demo estimation based on selected distribution channels.
                </Text>
              </View>
            </View>

            {/* Required Agreement Checkbox */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => updateSubmit({ agreedToTerms: !draft.submit.agreedToTerms })}
              style={styles.termsBox}
            >
              <View
                style={[
                  styles.checkbox,
                  draft.submit.agreedToTerms && styles.checkboxChecked,
                ]}
              >
                {draft.submit.agreedToTerms && (
                  <Check size={14} color="#FFFFFF" strokeWidth={3} />
                )}
              </View>
              <Text style={styles.termsText}>
                I confirm that I agree to the applicable campaign rules and submission policies, and
                I understand that contributions fund message distribution, not direct donations to the cause.
              </Text>
            </TouchableOpacity>

            {/* Step 5 Action Buttons */}
            <View style={styles.step5ActionsBox}>
              <TouchableOpacity
                onPress={() => router.push('/create/preview' as any)}
                style={styles.fullPreviewActionBtn}
                activeOpacity={0.8}
              >
                <Eye size={16} color={Colors.primary} />
                <Text style={styles.fullPreviewActionText}>Preview Campaign as Backer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Error message banner */}
        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={[styles.fixedBottomBar, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : Spacing.md) }]}>
        {errorMsg && (
          <View style={[styles.errorBox, { marginBottom: Spacing.sm, marginTop: 0 }]}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
        <View style={styles.bottomBarButtonsRow}>
          {stepNumber > 1 && (
            <Button
              title="Back"
              variant="outline"
              disabled={saving}
              onPress={() => router.push(`/create/${stepNumber - 1}` as any)}
              style={styles.backBtn}
            />
          )}
          <Button
            title={stepNumber === 5 ? 'Submit for Review' : 'Continue'}
            showArrow={stepNumber < 5}
            loading={saving}
            onPress={handleNext}
            style={stepNumber > 1 ? styles.continueBtnWithBack : styles.continueBtnFull}
          />
        </View>
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveDraftBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
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
  savedToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.md,
    alignSelf: 'center',
    marginBottom: 8,
  },
  savedToastText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 120,
  },
  stepTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  stepSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  storyInput: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  fieldLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  fieldSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  sectionHeaderRow: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sourceCard: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  sourceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sourceIndexBadge: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  removeSourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  removeSourceBtnText: {
    fontSize: Typography.sizes.xs,
    color: '#EF4444',
    fontWeight: Typography.weights.medium,
  },
  addSourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: Colors.primaryBg,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  addSourceBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  visualsSectionBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  chipTextActive: {
    color: Colors.primary,
    fontWeight: Typography.weights.bold,
  },
  customLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  addLocBtn: {
    height: 48,
    paddingHorizontal: 18,
  },
  budgetAllocationWrap: {
    gap: 10,
    marginBottom: Spacing.md,
  },
  budgetAllocCard: {
    padding: 14,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  budgetAllocCardActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  budgetAllocRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioCircleActive: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  budgetAllocTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: 2,
  },
  budgetAllocTitleActive: {
    color: Colors.primary,
  },
  budgetAllocDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  compactReachBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginTop: Spacing.sm,
    gap: 14,
  },
  reachIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reachTextBox: {
    flex: 1,
  },
  reachBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  compactReachTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
  },
  simulatedTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  simulatedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  compactReachSub: {
    fontSize: 12,
    lineHeight: 17,
    color: '#047857',
    marginBottom: 4,
  },
  reachDisclaimerText: {
    fontSize: 11,
    lineHeight: 15,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  previewImagesRow: {
    flexDirection: 'row',
    height: 160,
    backgroundColor: '#F3F4F6',
  },
  previewCoverCol: {
    flex: 2,
    position: 'relative',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  previewAdCol: {
    flex: 1,
    position: 'relative',
  },
  previewImageFull: {
    width: '100%',
    height: '100%',
  },
  previewAdImage: {
    width: '100%',
    height: '100%',
  },
  previewImageTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  previewImageTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewPlaceholderBox: {
    flex: 2,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  previewPlaceholderText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  previewCardBody: {
    padding: 16,
  },
  previewBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  locationTag: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  previewCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 23,
  },
  previewCreatorText: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 8,
  },
  previewCardSummary: {
    fontSize: 13,
    color: '#4B5563',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 6,
  },
  previewDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  previewSubheading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  previewCardDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },
  previewSourcesBox: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
  },
  previewSourcesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 2,
  },
  previewSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewSourceText: {
    fontSize: 11,
    color: '#059669',
  },
  previewAdDetailsBox: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  previewAdHeadline: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  previewAdDesc: {
    fontSize: 12,
    color: '#4B5563',
  },
  previewCtaChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  previewCtaChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  previewTargetingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewGridItem: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 6,
  },
  previewGridLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  previewGridValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  policyCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 14,
    padding: 14,
    marginBottom: Spacing.md,
  },
  policyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  policyHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  policyBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  policyBulletDot: {
    fontSize: 14,
    color: '#059669',
    lineHeight: 18,
  },
  policyBulletText: {
    flex: 1,
    fontSize: 12,
    color: '#047857',
    lineHeight: 17,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  fundingChip: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fundingChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  fundingChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  fundingChipTextActive: {
    color: '#059669',
    fontWeight: '800',
  },
  projectionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    marginBottom: Spacing.md,
  },
  projectionText: {
    fontSize: 13,
    color: '#374151',
  },
  projectionDisclaimer: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  termsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 6,
    marginBottom: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
    fontWeight: '500',
  },
  step5ActionsBox: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  fullPreviewActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  fullPreviewActionText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 18,
  },
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadows.card,
  },
  bottomBarButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 90,
  },
  continueBtnWithBack: {
    flex: 1,
  },
  continueBtnFull: {
    width: '100%',
  },

  // ─── Post-Submission Confirmation & Timeline Styles ───
  confirmationScroll: {
    padding: Spacing.lg,
    paddingBottom: 40,
    alignItems: 'center',
  },
  successBadgeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  timelineCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  timelineHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  timelineHeaderSub: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
    marginBottom: Spacing.lg,
  },
  timelineList: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineIconCol: {
    alignItems: 'center',
    width: 32,
    marginRight: 12,
  },
  timelineNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNodeDone: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  timelineNodeActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  timelineBar: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  timelineBarDone: {
    backgroundColor: '#059669',
  },
  timelineContentCol: {
    flex: 1,
    paddingTop: 2,
  },
  timelineStepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  timelineStepTitleMuted: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  timelineStepDesc: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 17,
    marginBottom: 4,
  },
  timelineStepTime: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  inReviewBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  inReviewBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  confirmationActions: {
    width: '100%',
  },
});
