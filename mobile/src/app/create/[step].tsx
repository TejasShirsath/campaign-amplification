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
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Eye, Users, Check, Globe, UploadCloud, RefreshCw, Trash2, Image as ImageIcon } from 'lucide-react-native';
import { HeaderBar } from '../../components/common/header-bar';
import { StepStepper } from '../../components/creation/step-stepper';
import { Input, SelectDropdown } from '../../components/common/input';
import { Button } from '../../components/common/button';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../constants/theme';
import { useDraft } from '../../context/draft-context';
import { uploadImageFile } from '../../api/uploads';
import { resolveImageUrl } from '../../constants/config';

const CATEGORY_OPTIONS = [
  { label: 'Environment & Climate', value: 'ENVIRONMENT' },
  { label: 'Healthcare & Wellbeing', value: 'HEALTH' },
  { label: 'Education & Literacy', value: 'EDUCATION' },
  { label: 'Science & Research', value: 'SCIENCE' },
  { label: 'Public Policy', value: 'PUBLIC_POLICY' },
  { label: 'Community & Civic', value: 'COMMUNITY' },
  { label: 'Business & Economy', value: 'BUSINESS' },
  { label: 'Arts & Culture', value: 'ARTS_CULTURE' },
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
  'Education',
  'Healthcare',
  'Public Welfare',
  'Clean Energy',
  'Civic Action',
  'Science & Tech',
];

const FUNDING_PRESETS = [10000, 25000, 50000, 100000];

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
    updateCoverImage,
    updateAdImage,
    saveCurrentStep,
    resetDraft,
  } = useDraft();

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [customLocation, setCustomLocation] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAd, setUploadingAd] = useState(false);

  // Image picker & uploader
  const pickAndUploadImage = async (target: 'cover' | 'ad') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photos to upload campaign images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: target === 'cover' ? [16, 9] : [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (result.canceled || !result.assets || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];

      // 1. Immediately show chosen image preview in the upload section
      if (target === 'cover') {
        updateCoverImage(asset.uri);
        setUploadingCover(true);
      } else {
        updateAdImage(asset.uri);
        setUploadingAd(true);
      }
      setErrorMsg(null);

      // 2. Upload to backend
      const uploadRes = await uploadImageFile(asset);
      const uploadedUrl = uploadRes.url;

      // 3. Persist uploaded server URL
      if (target === 'cover') {
        updateCoverImage(uploadedUrl);
      } else {
        updateAdImage(uploadedUrl);
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setErrorMsg(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploadingCover(false);
      setUploadingAd(false);
    }
  };

  // Validation & step advancement
  const handleNext = async () => {
    setErrorMsg(null);

    // 1. Basics validation
    if (stepNumber === 1) {
      if (!draft.basics.title.trim()) {
        setErrorMsg('Please enter a campaign title');
        return;
      }
    }

    // 2. Story validation
    if (stepNumber === 2) {
      if (!draft.story.introText?.trim()) {
        setErrorMsg('Please share your story');
        return;
      }
    }

    // 3. Visuals validation
    if (stepNumber === 3) {
      const coverUrl =
        draft.basics.coverImageUrl?.trim() || draft.visuals.creatives[0]?.url?.trim();
      if (!coverUrl) {
        setErrorMsg('Please upload a campaign cover image to proceed');
        return;
      }
    }

    // 4. Reach validation
    if (stepNumber === 4) {
      if (!draft.reach.targetLocations?.length) {
        updateReach({ targetLocations: ['All India'] });
      }
    }

    // 5. Submit validation
    if (stepNumber === 5) {
      if (!draft.submit.agreedToTerms) {
        updateSubmit({ agreedToTerms: true });
      }
      if ((draft.submit.fundingGoalPaise || 0) < 10000) {
        setErrorMsg('Funding goal must be at least ₹100');
        return;
      }
    }

    try {
      setSaving(true);
      await saveCurrentStep(stepNumber);

      if (stepNumber < 5) {
        router.push(`/create/${stepNumber + 1}` as any);
      } else {
        await resetDraft();
        if (Platform.OS === 'web') {
          // On Web, show alert if available and navigate cleanly to user campaigns
          if (typeof window !== 'undefined') {
            window.alert('Your campaign has been successfully submitted for review and will be live shortly.');
          }
          router.replace('/user/campaigns' as any);
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

  // Cover image helper
  const activeCoverImage =
    draft.basics.coverImageUrl ||
    draft.visuals.creatives[0]?.url ||
    '';

  // Estimated reach calculation helper
  const fundingInRupees = Math.round((draft.submit.fundingGoalPaise || 5000000) / 100);
  const calculatedReachMin = Math.round(fundingInRupees * 0.85);
  const calculatedReachMax = Math.round(fundingInRupees * 1.6);

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
        {/* ─── 1. BASICS ─── */}
        {stepNumber === 1 && (
          <View>
            <Text style={styles.stepTitle}>Let's start with your idea.</Text>
            <Text style={styles.stepSubtitle}>
              Give your campaign a clear foundation so people immediately understand your message.
            </Text>

            <Input
              label="Campaign title"
              placeholder="What is your message?"
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
              label="Short description (optional)"
              placeholder="Describe your campaign in one sentence."
              value={draft.basics.summary}
              multiline
              maxLength={300}
              showCharCount
              onChangeText={(text) => updateBasics({ summary: text })}
            />
          </View>
        )}

        {/* ─── 2. STORY ─── */}
        {stepNumber === 2 && (
          <View>
            <Text style={styles.stepTitle}>Tell people why it matters.</Text>
            <Text style={styles.stepSubtitle}>
              Share the context, facts, and why this public interest message needs amplification.
            </Text>

            <Input
              label="Your story"
              placeholder="What should people know, and why does it matter?"
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

            <Input
              label="Supporting source (optional)"
              placeholder="Add a URL or reference (e.g. https://example.org/report)"
              value={draft.story.sources?.[0]?.url || ''}
              autoCapitalize="none"
              keyboardType="url"
              onChangeText={(text) => {
                updateStory({
                  sources: text.trim() ? [{ title: 'Supporting Reference', url: text.trim() }] : [],
                });
              }}
            />
          </View>
        )}

        {/* ─── 3. VISUALS ─── */}
        {stepNumber === 3 && (
          <View>
            <Text style={styles.stepTitle}>Give your message a visual identity.</Text>
            <Text style={styles.stepSubtitle}>
              Visuals grab attention and power digital advertisements across channels.
            </Text>

            {/* Campaign Cover Image */}
            <Text style={styles.fieldLabel}>Campaign image</Text>
            <Text style={styles.fieldSubtitle}>
              Upload a cover image for your campaign.
            </Text>

            {activeCoverImage ? (
              <View style={styles.uploadedContainer}>
                <View style={styles.imagePreviewWrapper}>
                  <RNImage
                    source={{ uri: resolveImageUrl(activeCoverImage) }}
                    style={styles.uploadedImagePreview}
                    resizeMode="cover"
                  />
                  {uploadingCover && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.uploadingOverlayText}>Saving upload...</Text>
                    </View>
                  )}
                </View>
                <View style={styles.uploadedActionOverlay}>
                  <TouchableOpacity
                    style={styles.changeImageBtn}
                    activeOpacity={0.8}
                    disabled={uploadingCover}
                    onPress={() => pickAndUploadImage('cover')}
                  >
                    <RefreshCw size={13} color="#FFFFFF" />
                    <Text style={styles.changeImageBtnText}>Change Image</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    activeOpacity={0.8}
                    disabled={uploadingCover}
                    onPress={() => updateCoverImage('')}
                  >
                    <Trash2 size={13} color="#EF4444" />
                    <Text style={styles.removeImageBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : uploadingCover ? (
              <View style={styles.uploadingBox}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.uploadingText}>Uploading cover image...</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadDropzone}
                activeOpacity={0.7}
                onPress={() => pickAndUploadImage('cover')}
              >
                <View style={styles.uploadIconCircle}>
                  <UploadCloud size={24} color={Colors.primary} />
                </View>
                <Text style={styles.uploadTitle}>Upload cover image</Text>
                <Text style={styles.uploadSubtext}>JPG, PNG, or WebP from your device</Text>
              </TouchableOpacity>
            )}

            {/* Advertisement (optional) */}
            <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>
              Advertisement (optional)
            </Text>
            <Text style={styles.fieldSubtitle}>
              Upload an ad image or video creative for social distribution.
            </Text>

            {draft.visuals.creatives[1]?.url ? (
              <View style={styles.uploadedContainer}>
                <View style={styles.imagePreviewWrapper}>
                  <RNImage
                    source={{ uri: resolveImageUrl(draft.visuals.creatives[1].url) }}
                    style={styles.uploadedImagePreview}
                    resizeMode="cover"
                  />
                  {uploadingAd && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.uploadingOverlayText}>Saving upload...</Text>
                    </View>
                  )}
                </View>
                <View style={styles.uploadedActionOverlay}>
                  <TouchableOpacity
                    style={styles.changeImageBtn}
                    activeOpacity={0.8}
                    disabled={uploadingAd}
                    onPress={() => pickAndUploadImage('ad')}
                  >
                    <RefreshCw size={13} color="#FFFFFF" />
                    <Text style={styles.changeImageBtnText}>Change Ad Image</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    activeOpacity={0.8}
                    disabled={uploadingAd}
                    onPress={() => updateAdImage('')}
                  >
                    <Trash2 size={13} color="#EF4444" />
                    <Text style={styles.removeImageBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : uploadingAd ? (
              <View style={styles.uploadingBox}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.uploadingText}>Uploading advertisement...</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadDropzoneCompact}
                activeOpacity={0.7}
                onPress={() => pickAndUploadImage('ad')}
              >
                <View style={styles.uploadIconCircleSmall}>
                  <UploadCloud size={20} color={Colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uploadTitleSmall}>Upload ad creative (optional)</Text>
                  <Text style={styles.uploadSubtextSmall}>Square or banner image from your device</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Ad headline (optional) */}
            <Input
              label="Ad headline (optional)"
              placeholder={`Defaults to: ${draft.basics.title || 'Campaign Title'}`}
              value={draft.visuals.creatives[0]?.headline || ''}
              onChangeText={(text) => {
                const updated = [...draft.visuals.creatives];
                if (!updated[0]) {
                  updated[0] = {
                    type: 'cover',
                    url: draft.basics.coverImageUrl || '',
                    headline: text,
                    sortOrder: 0,
                  };
                } else {
                  updated[0] = { ...updated[0], headline: text };
                }
                updateVisuals({ creatives: updated });
              }}
            />
          </View>
        )}

        {/* ─── 4. REACH ─── */}
        {stepNumber === 4 && (
          <View>
            <Text style={styles.stepTitle}>Choose who you want to reach.</Text>
            <Text style={styles.stepSubtitle}>
              Select target geographies and audience interest areas for verified ad distribution.
            </Text>

            {/* Target Location */}
            <Text style={styles.fieldLabel}>Target location</Text>
            <Text style={styles.fieldSubtitle}>Country, state, or city:</Text>
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

            {/* Audience Interests */}
            <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
              Audience interests (optional)
            </Text>
            <Text style={styles.fieldSubtitle}>
              Focus on people passionate about specific causes:
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

            {/* Compact Estimated Reach Preview */}
            <View style={styles.compactReachBox}>
              <View style={styles.reachIconCircle}>
                <Globe size={24} color="#059669" />
              </View>
              <View style={styles.reachTextBox}>
                <Text style={styles.compactReachTitle}>
                  ~45,000 – 85,000 people
                </Text>
                <Text style={styles.compactReachSub}>
                  Estimated reach across verified digital ad networks in{' '}
                  <Text style={{ fontWeight: '700', color: '#111827' }}>
                    {draft.reach.targetLocations?.join(', ') || 'All India'}
                  </Text>
                  .
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── 5. SUBMIT ─── */}
        {stepNumber === 5 && (
          <View>
            <Text style={styles.stepTitle}>One last look before you submit.</Text>
            <Text style={styles.stepSubtitle}>
              Review your campaign preview, set your promotion goal, and submit for verification.
            </Text>

            {/* Clean Campaign Preview Card */}
            <View style={styles.previewCard}>
              {activeCoverImage ? (
                <RNImage
                  source={{ uri: resolveImageUrl(activeCoverImage) }}
                  style={styles.previewCardImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.previewCardImage, styles.previewPlaceholderBox]}>
                  <ImageIcon size={32} color="#9CA3AF" />
                  <Text style={styles.previewPlaceholderText}>No cover image uploaded</Text>
                </View>
              )}
              <View style={styles.previewCardBody}>
                <View style={styles.previewBadgeRow}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {(CATEGORY_OPTIONS.find((c) => c.value === draft.basics.category)?.label) ||
                        draft.basics.category}
                    </Text>
                  </View>
                  <Text style={styles.locationTag}>
                    📍 {draft.reach.targetLocations?.[0] || 'All India'}
                  </Text>
                </View>

                <Text style={styles.previewCardTitle}>
                  {draft.basics.title || 'Untitled Campaign'}
                </Text>
                <Text numberOfLines={3} style={styles.previewCardDesc}>
                  {draft.basics.summary ||
                    draft.story.introText ||
                    'Every contribution directly powers verified digital ads to amplify this message.'}
                </Text>
              </View>
            </View>

            {/* Funding Goal */}
            <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
              Funding goal
            </Text>
            <Text style={styles.fieldSubtitle}>
              “How much funding do you need for promotion?”
            </Text>

            {/* Funding Preset Chips */}
            <View style={styles.presetsRow}>
              {FUNDING_PRESETS.map((amount) => {
                const isSelected = fundingInRupees === amount;
                return (
                  <TouchableOpacity
                    key={amount}
                    onPress={() => {
                      updateSubmit({
                        fundingGoalPaise: amount * 100,
                        estimatedReach: Math.round(amount * 1.3),
                      });
                    }}
                    style={[styles.fundingChip, isSelected && styles.fundingChipActive]}
                  >
                    <Text style={[styles.fundingChipText, isSelected && styles.fundingChipTextActive]}>
                      ₹{amount.toLocaleString('en-IN')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Or enter custom amount (₹)"
              placeholder="50000"
              keyboardType="numeric"
              value={String(fundingInRupees)}
              onChangeText={(text) => {
                const val = parseInt(text.replace(/[^0-9]/g, '') || '0', 10);
                updateSubmit({
                  fundingGoalPaise: val * 100,
                  estimatedReach: Math.round(val * 1.3),
                });
              }}
            />

            {/* Reach Projection Banner */}
            <View style={styles.projectionBanner}>
              <Users size={20} color="#059669" />
              <Text style={styles.projectionText}>
                Projected reach:{' '}
                <Text style={{ fontWeight: '800', color: '#059669' }}>
                  ~{calculatedReachMin.toLocaleString('en-IN')} – {calculatedReachMax.toLocaleString('en-IN')} people
                </Text>
              </Text>
            </View>

            {/* One Simple Guidelines & Non-Donation Checkbox */}
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
                I agree to the campaign guidelines and understand that contributions fund message distribution, not direct donations.
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Inline Error Message */}
        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.fixedBottomBar}>
        {errorMsg && (
          <View style={[styles.errorBox, { marginBottom: Spacing.sm }]}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
        <Button
          title={stepNumber === 5 ? 'Submit for Review' : 'Save and Continue'}
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
    paddingHorizontal: 12,
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
  presetsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  uploadingBox: {
    height: 140,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    gap: 10,
  },
  uploadingText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  uploadDropzone: {
    height: 150,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
    marginBottom: 2,
  },
  uploadSubtext: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  uploadDropzoneCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSubtle,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: 12,
  },
  uploadIconCircleSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitleSmall: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  uploadSubtextSmall: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  uploadedContainer: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  uploadedImagePreview: {
    width: '100%',
    height: 180,
  },
  imagePreviewWrapper: {
    position: 'relative',
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadingOverlayText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: '#FFFFFF',
  },
  uploadedActionOverlay: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 10,
  },
  changeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.md,
    backgroundColor: Colors.primary,
  },
  changeImageBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
  },
  removeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.md,
    backgroundColor: '#FEE2E2',
  },
  removeImageBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#EF4444',
  },
  previewPlaceholderBox: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  previewPlaceholderText: {
    fontSize: Typography.sizes.xs,
    color: '#9CA3AF',
    fontWeight: Typography.weights.medium,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  chip: {
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
  compactReachBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginTop: Spacing.sm,
    gap: 14,
  },
  reachIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reachTextBox: {
    flex: 1,
  },
  compactReachTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 2,
  },
  compactReachSub: {
    fontSize: 12,
    lineHeight: 18,
    color: '#047857',
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
  previewCardImage: {
    width: '100%',
    height: 150,
  },
  previewCardBody: {
    padding: 14,
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
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 22,
  },
  previewCardDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
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
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    marginBottom: Spacing.md,
  },
  projectionText: {
    fontSize: 13,
    color: '#374151',
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
  nextBtn: {
    width: '100%',
  },
});
