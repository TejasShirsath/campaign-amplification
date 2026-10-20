import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CampaignBasicsInput,
  CampaignReachInput,
  CampaignStoryInput,
  CampaignSubmitInput,
  CampaignVisualsInput,
  creationApi,
} from '../api/creation';
import { CampaignDetail, CreativeItem, campaignsApi } from '../api/campaigns';

const DRAFT_STORAGE_KEY = '@rippleup_local_draft';

export interface DraftState {
  campaignId: string | null;
  currentStep: number; // 1 to 5
  basics: CampaignBasicsInput;
  story: CampaignStoryInput;
  visuals: CampaignVisualsInput;
  reach: CampaignReachInput;
  submit: CampaignSubmitInput;
  isSaving: boolean;
  lastSavedAt?: string;
}

const initialDraftState: DraftState = {
  campaignId: null,
  currentStep: 1,
  basics: {
    title: '',
    category: 'ENVIRONMENT',
    creatorName: '',
    summary: '',
    coverImageUrl: '',
  },
  story: {
    headline: '',
    introText: '',
    storyContent: [
      { id: '1', type: 'text', content: '' },
    ],
    sources: [],
    suggestedActions: '',
  },
  visuals: {
    creatives: [
      {
        type: 'cover',
        url: '',
        headline: '',
        callToAction: 'Support Amplification',
        sortOrder: 0,
      },
    ],
  },
  reach: {
    targetLocations: ['Mumbai', 'Delhi', 'Bangalore'],
    audienceInterests: ['Public Interest', 'Conservation', 'Education'],
    distributionChannels: ['Instagram', 'YouTube', 'Social Feeds'],
    campaignDuration: 30,
  },
  submit: {
    fundingGoalPaise: 100000, // $1,000 (100,000 cents)
    estimatedReach: 100000,
    agreedToTerms: false,
  },
  isSaving: false,
};

interface DraftContextType {
  draft: DraftState;
  updateBasics: (data: Partial<CampaignBasicsInput>) => void;
  updateStory: (data: Partial<CampaignStoryInput>) => void;
  updateVisuals: (data: Partial<CampaignVisualsInput>) => void;
  updateReach: (data: Partial<CampaignReachInput>) => void;
  updateSubmit: (data: Partial<CampaignSubmitInput>) => void;
  updateCoverImage: (url: string) => void;
  updateAdImage: (url: string) => void;
  updateAdCreative: (fields: Partial<import('../api/campaigns').CreativeItem>) => void;
  saveCurrentStep: (stepNumber: number) => Promise<boolean>;
  saveDraftOnly: (stepNumber?: number) => Promise<boolean>;
  loadDraftFromBackend: (campaignId: string) => Promise<void>;
  resetDraft: () => Promise<void>;
}

const DraftContext = createContext<DraftContextType>({
  draft: initialDraftState,
  updateBasics: () => {},
  updateStory: () => {},
  updateVisuals: () => {},
  updateReach: () => {},
  updateSubmit: () => {},
  updateCoverImage: () => {},
  updateAdImage: () => {},
  updateAdCreative: () => {},
  saveCurrentStep: async () => false,
  saveDraftOnly: async () => false,
  loadDraftFromBackend: async () => {},
  resetDraft: async () => {},
});

export const DraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [draft, setDraft] = useState<DraftState>(initialDraftState);
  const draftRef = React.useRef<DraftState>(initialDraftState);
  draftRef.current = draft;

  // Restore cached draft on app start
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setDraft(parsed);
          draftRef.current = parsed;
        }
      } catch (err) {
        console.warn('Failed to restore local draft:', err);
      }
    })();
  }, []);

  const persistLocally = async (updated: DraftState) => {
    setDraft(updated);
    try {
      await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // storage error
    }
  };

  const updateBasics = (data: Partial<CampaignBasicsInput>) => {
    setDraft((prev) => {
      const updated = {
        ...prev,
        basics: { ...prev.basics, ...data },
      };
      AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const updateStory = (data: Partial<CampaignStoryInput>) => {
    setDraft((prev) => {
      const updated = {
        ...prev,
        story: { ...prev.story, ...data },
      };
      AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const updateVisuals = (data: Partial<CampaignVisualsInput>) => {
    setDraft((prev) => {
      const updated = {
        ...prev,
        visuals: { ...prev.visuals, ...data },
      };
      AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const updateReach = (data: Partial<CampaignReachInput>) => {
    setDraft((prev) => {
      const updated = {
        ...prev,
        reach: { ...prev.reach, ...data },
      };
      AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const updateSubmit = (data: Partial<CampaignSubmitInput>) => {
    setDraft((prev) => {
      const updated = {
        ...prev,
        submit: { ...prev.submit, ...data },
      };
      AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const updateCoverImage = (url: string) => {
    setDraft((prev) => {
      const updatedCreatives = [...(prev.visuals?.creatives || [])];
      if (url) {
        updatedCreatives[0] = {
          type: 'cover',
          url,
          headline: updatedCreatives[0]?.headline || prev.basics.title,
          callToAction: 'Support Amplification',
          sortOrder: 0,
        };
      } else {
        if (updatedCreatives[0]) {
          updatedCreatives[0] = { ...updatedCreatives[0], url: '' };
        }
      }

      const updated: DraftState = {
        ...prev,
        basics: {
          ...prev.basics,
          coverImageUrl: url,
        },
        visuals: {
          ...prev.visuals,
          creatives: updatedCreatives,
        },
      };
      AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const updateAdCreative = (fields: Partial<CreativeItem>) => {
    setDraft((prev) => {
      const updatedCreatives = [...(prev.visuals?.creatives || [])];
      const existingAd = updatedCreatives[1] || {
        type: 'ad_image',
        url: '',
        headline: prev.basics.title || '',
        description: '',
        callToAction: 'Support Amplification',
        sortOrder: 1,
      };

      updatedCreatives[1] = {
        ...existingAd,
        ...fields,
        type: 'ad_image',
        sortOrder: 1,
      };

      const updated: DraftState = {
        ...prev,
        visuals: {
          ...prev.visuals,
          creatives: updatedCreatives,
        },
      };
      AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const updateAdImage = (url: string) => {
    updateAdCreative({ url });
  };

  const saveDraftOnly = async (_stepNumber?: number): Promise<boolean> => {
    setDraft((prev) => ({ ...prev, isSaving: true }));
    try {
      const currentDraft = draftRef.current;
      let currentCampaignId = currentDraft.campaignId;
      const titleToUse = currentDraft.basics.title?.trim() || 'Untitled Draft';
      const categoryToUse = currentDraft.basics.category || 'ENVIRONMENT';
      const creatorNameToUse = currentDraft.basics.creatorName || 'Campaign Creator';
      const coverUrl =
        currentDraft.basics.coverImageUrl?.trim() ||
        currentDraft.visuals.creatives[0]?.url?.trim() ||
        '';

      if (!currentCampaignId) {
        const createRes = await creationApi.createDraft({
          title: titleToUse,
          category: categoryToUse,
          creatorName: creatorNameToUse,
          summary: currentDraft.basics.summary || '',
          coverImageUrl: coverUrl,
        });
        currentCampaignId = createRes.id;
      } else {
        await creationApi.updateBasics(currentCampaignId, {
          ...currentDraft.basics,
          title: titleToUse,
          category: categoryToUse,
          creatorName: creatorNameToUse,
          coverImageUrl: coverUrl,
        });
      }

      // Sync step 2 story
      if (currentDraft.story.introText?.trim() || currentDraft.story.sources?.length) {
        const cleanSources = (currentDraft.story.sources || []).filter(
          (s) => s && (s.title?.trim() || s.url?.trim())
        );
        await creationApi.updateStory(currentCampaignId, {
          headline: titleToUse,
          introText: currentDraft.story.introText?.trim() || '',
          storyContent: [
            { id: '1', type: 'text', content: currentDraft.story.introText?.trim() || '' },
          ],
          sources: cleanSources,
        });
      }

      // Sync step 3 visuals
      const creatives: any[] = [];
      if (coverUrl) {
        creatives.push({
          type: 'cover',
          url: coverUrl,
          headline: titleToUse,
          callToAction: 'Support Amplification',
          sortOrder: 0,
        });
      }
      const adCreative = currentDraft.visuals.creatives[1];
      if (adCreative?.url?.trim()) {
        creatives.push({
          type: 'ad_image',
          url: adCreative.url.trim(),
          headline: adCreative.headline?.trim() || titleToUse,
          description: adCreative.description?.trim() || null,
          callToAction: adCreative.callToAction?.trim() || 'Support Amplification',
          sortOrder: 1,
        });
      }
      if (creatives.length > 0) {
        await creationApi.updateVisuals(currentCampaignId, { creatives });
      }

      // Sync step 4 reach
      await creationApi.updateReach(currentCampaignId, {
        targetLocations: currentDraft.reach.targetLocations?.length
          ? currentDraft.reach.targetLocations
          : ['All India'],
        audienceInterests: currentDraft.reach.audienceInterests || [],
        distributionChannels: currentDraft.reach.distributionChannels?.length
          ? currentDraft.reach.distributionChannels
          : ['Meta (Instagram & Facebook)', 'Google & YouTube Ads'],
        campaignDuration: currentDraft.reach.campaignDuration || 30,
        budgetAllocation: currentDraft.reach.budgetAllocation || 'Balanced (50% Social / 50% Search & Feeds)',
      });

      setDraft((prev) => {
        const updated: DraftState = {
          ...prev,
          campaignId: currentCampaignId,
          isSaving: false,
          lastSavedAt: new Date().toISOString(),
        };
        AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
        draftRef.current = updated;
        return updated;
      });
      return true;
    } catch (err: any) {
      console.warn('Error saving draft only:', err);
      setDraft((prev) => ({ ...prev, isSaving: false }));
      return false;
    }
  };

  const saveCurrentStep = async (stepNumber: number): Promise<boolean> => {
    setDraft((prev) => ({ ...prev, isSaving: true }));
    try {
      const currentDraft = draftRef.current;
      let currentCampaignId = currentDraft.campaignId;
      const coverUrl =
        currentDraft.basics.coverImageUrl?.trim() ||
        currentDraft.visuals.creatives[0]?.url?.trim() ||
        '';

      if (stepNumber === 1) {
        const title = currentDraft.basics.title.trim() || 'Untitled Campaign';
        const category = currentDraft.basics.category || 'ENVIRONMENT';
        const creatorName = currentDraft.basics.creatorName?.trim() || 'Campaign Creator';

        if (!currentCampaignId) {
          const res = await creationApi.createDraft({
            title,
            category,
            creatorName,
            summary: currentDraft.basics.summary || '',
            coverImageUrl: coverUrl,
          });
          currentCampaignId = res.id;
        } else {
          await creationApi.updateBasics(currentCampaignId, {
            ...currentDraft.basics,
            title,
            category,
            creatorName,
            summary: currentDraft.basics.summary || '',
            coverImageUrl: coverUrl,
          });
        }
      } else if (stepNumber === 2 && currentCampaignId) {
        const cleanSources = (currentDraft.story.sources || []).filter(
          (s) => s && (s.title?.trim() || s.url?.trim())
        );
        const storyText = currentDraft.story.introText?.trim() || '';

        await creationApi.updateStory(currentCampaignId, {
          headline: currentDraft.basics.title || 'Campaign Story',
          introText: storyText,
          storyContent: [
            {
              id: '1',
              type: 'text',
              content: storyText,
            },
          ],
          sources: cleanSources,
        });
      } else if (stepNumber === 3 && currentCampaignId) {
        const adCreative = currentDraft.visuals.creatives[1];
        const adUrl = adCreative?.url?.trim();
        const adHeadline =
          adCreative?.headline?.trim() || currentDraft.basics.title || 'Campaign Ad';
        const adDescription = adCreative?.description?.trim() || null;
        const callToAction = adCreative?.callToAction?.trim() || 'Support Amplification';

        const creatives: any[] = [];
        if (coverUrl) {
          creatives.push({
            type: 'cover',
            url: coverUrl,
            headline: currentDraft.basics.title || 'Campaign Visual',
            callToAction: 'Support Amplification',
            sortOrder: 0,
          });
        }

        if (adUrl) {
          creatives.push({
            type: 'ad_image',
            url: adUrl,
            headline: adHeadline,
            description: adDescription,
            callToAction,
            sortOrder: 1,
          });
        }

        await creationApi.updateBasics(currentCampaignId, {
          ...currentDraft.basics,
          coverImageUrl: coverUrl,
        });

        await creationApi.updateVisuals(currentCampaignId, { creatives });
      } else if (stepNumber === 4 && currentCampaignId) {
        await creationApi.updateReach(currentCampaignId, {
          targetLocations: currentDraft.reach.targetLocations?.length
            ? currentDraft.reach.targetLocations
            : ['All India'],
          audienceInterests: currentDraft.reach.audienceInterests || [],
          distributionChannels: currentDraft.reach.distributionChannels?.length
            ? currentDraft.reach.distributionChannels
            : ['Meta (Instagram & Facebook)', 'Google & YouTube Ads'],
          campaignDuration: currentDraft.reach.campaignDuration || 30,
          budgetAllocation: currentDraft.reach.budgetAllocation || 'Balanced (50% Social / 50% Search & Feeds)',
        });
      } else if (stepNumber === 5) {
        const titleToUse = currentDraft.basics.title?.trim() || 'My Campaign';
        const categoryToUse = currentDraft.basics.category || 'ENVIRONMENT';
        const creatorNameToUse = currentDraft.basics.creatorName || 'Campaign Creator';

        if (!currentCampaignId) {
          const createRes = await creationApi.createDraft({
            title: titleToUse,
            category: categoryToUse,
            creatorName: creatorNameToUse,
            summary: currentDraft.basics.summary || '',
            coverImageUrl: coverUrl,
          });
          currentCampaignId = createRes.id;
        } else {
          await creationApi.updateBasics(currentCampaignId, {
            ...currentDraft.basics,
            title: titleToUse,
            category: categoryToUse,
            creatorName: creatorNameToUse,
            coverImageUrl: coverUrl,
          });
        }

        // Sync story if present
        if (currentDraft.story.introText?.trim() || currentDraft.story.sources?.length) {
          const cleanSources = (currentDraft.story.sources || []).filter(
            (s) => s && (s.title?.trim() || s.url?.trim())
          );
          await creationApi.updateStory(currentCampaignId, {
            headline: titleToUse,
            introText: currentDraft.story.introText?.trim() || '',
            storyContent: [
              { id: '1', type: 'text', content: currentDraft.story.introText?.trim() || '' },
            ],
            sources: cleanSources,
          });
        }

        // Sync visuals
        const creatives: any[] = [];
        if (coverUrl) {
          creatives.push({
            type: 'cover',
            url: coverUrl,
            headline: titleToUse,
            callToAction: 'Support Amplification',
            sortOrder: 0,
          });
        }
        const adCreative = currentDraft.visuals.creatives[1];
        if (adCreative?.url?.trim()) {
          creatives.push({
            type: 'ad_image',
            url: adCreative.url.trim(),
            headline: adCreative.headline?.trim() || titleToUse,
            description: adCreative.description?.trim() || null,
            callToAction: adCreative.callToAction?.trim() || 'Support Amplification',
            sortOrder: 1,
          });
        }
        await creationApi.updateVisuals(currentCampaignId, { creatives });

        // Sync reach
        await creationApi.updateReach(currentCampaignId, {
          targetLocations: currentDraft.reach.targetLocations?.length
            ? currentDraft.reach.targetLocations
            : ['All India'],
          audienceInterests: currentDraft.reach.audienceInterests || [],
          distributionChannels: currentDraft.reach.distributionChannels?.length
            ? currentDraft.reach.distributionChannels
            : ['Meta (Instagram & Facebook)', 'Google & YouTube Ads'],
          campaignDuration: currentDraft.reach.campaignDuration || 30,
          budgetAllocation: currentDraft.reach.budgetAllocation || 'Balanced (50% Social / 50% Search & Feeds)',
        });

        // Submit for review
        await creationApi.submitCampaign(currentCampaignId, {
          fundingGoalPaise: currentDraft.submit.fundingGoalPaise || 5000000,
          estimatedReach: currentDraft.submit.estimatedReach || 65000,
          agreedToTerms: true,
        });
      }

      setDraft((prev) => {
        const updated: DraftState = {
          ...prev,
          campaignId: currentCampaignId,
          currentStep: Math.min(stepNumber + 1, 5),
          isSaving: false,
          lastSavedAt: new Date().toISOString(),
        };
        AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
        draftRef.current = updated;
        return updated;
      });
      return true;
    } catch (err: any) {
      console.warn(`Error saving step ${stepNumber}:`, err);
      setDraft((prev) => ({ ...prev, isSaving: false }));
      throw err;
    }
  };

  const loadDraftFromBackend = async (campaignId: string) => {
    try {
      const camp = await campaignsApi.getById(campaignId);
      const loaded: DraftState = {
        campaignId: camp.id,
        currentStep: 1,
        basics: {
          title: camp.title || '',
          category: camp.category || 'ENVIRONMENT',
          creatorName: camp.creatorName || '',
          summary: camp.summary || '',
          coverImageUrl: camp.coverImageUrl || '',
        },
        story: {
          headline: camp.headline || '',
          introText: camp.introText || '',
          storyContent: camp.storyContent?.length ? camp.storyContent : [{ id: '1', type: 'text', content: '' }],
          sources: camp.sources?.length ? camp.sources : [{ title: '', url: '' }],
          suggestedActions: camp.suggestedActions || '',
        },
        visuals: {
          creatives: camp.creatives?.length
            ? camp.creatives
            : [{ type: 'cover', url: camp.coverImageUrl || '', sortOrder: 0 }],
        },
        reach: {
          targetLocations: camp.targetLocations?.length ? camp.targetLocations : ['India'],
          audienceInterests: camp.audienceInterests?.length ? camp.audienceInterests : ['General Public'],
          distributionChannels: camp.distributionChannels?.length ? camp.distributionChannels : ['Social Media'],
          campaignDuration: camp.campaignDuration || 30,
          budgetAllocation: (camp as any).budgetAllocation || (camp as any).targeting?.budgetAllocation || 'Balanced (50% Social / 50% Search & Feeds)',
        },
        submit: {
          fundingGoalPaise: camp.fundingGoalPaise || 100000,
          estimatedReach: camp.estimatedReach || 50000,
          agreedToTerms: false,
        },
        isSaving: false,
        lastSavedAt: new Date().toISOString(),
      };
      await persistLocally(loaded);
    } catch (err) {
      console.warn('Failed to load draft from backend:', err);
    }
  };

  const resetDraft = async () => {
    setDraft(initialDraftState);
    await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  return (
    <DraftContext.Provider
      value={{
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
        loadDraftFromBackend,
        resetDraft,
      }}
    >
      {children}
    </DraftContext.Provider>
  );
};

export const useDraft = () => useContext(DraftContext);
