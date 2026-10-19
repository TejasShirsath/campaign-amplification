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
import { CampaignDetail, campaignsApi } from '../api/campaigns';

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
    sources: [
      { title: '', url: '' },
    ],
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
    fundingGoalPaise: 5000000, // ₹50,000
    estimatedReach: 65000,
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
  saveCurrentStep: (stepNumber: number) => Promise<boolean>;
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
  saveCurrentStep: async () => false,
  loadDraftFromBackend: async () => {},
  resetDraft: async () => {},
});

export const DraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [draft, setDraft] = useState<DraftState>(initialDraftState);

  // Restore cached draft on app start
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setDraft(parsed);
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
    const updated = {
      ...draft,
      basics: { ...draft.basics, ...data },
    };
    persistLocally(updated);
  };

  const updateStory = (data: Partial<CampaignStoryInput>) => {
    const updated = {
      ...draft,
      story: { ...draft.story, ...data },
    };
    persistLocally(updated);
  };

  const updateVisuals = (data: Partial<CampaignVisualsInput>) => {
    const updated = {
      ...draft,
      visuals: { ...draft.visuals, ...data },
    };
    persistLocally(updated);
  };

  const updateReach = (data: Partial<CampaignReachInput>) => {
    const updated = {
      ...draft,
      reach: { ...draft.reach, ...data },
    };
    persistLocally(updated);
  };

  const updateSubmit = (data: Partial<CampaignSubmitInput>) => {
    const updated = {
      ...draft,
      submit: { ...draft.submit, ...data },
    };
    persistLocally(updated);
  };

  const saveCurrentStep = async (stepNumber: number): Promise<boolean> => {
    setDraft((prev) => ({ ...prev, isSaving: true }));
    try {
      let currentCampaignId = draft.campaignId;

      if (stepNumber === 1) {
        if (!currentCampaignId) {
          // Initialize Draft (Step 0 / 1)
          const res = await creationApi.createDraft({
            ...draft.basics,
            creatorName: draft.basics.creatorName || 'Campaign Creator',
            summary: draft.basics.summary || 'Campaign summary description',
          });
          currentCampaignId = res.id;
        } else {
          await creationApi.updateBasics(currentCampaignId, draft.basics);
        }
      } else if (stepNumber === 2 && currentCampaignId) {
        await creationApi.updateStory(currentCampaignId, draft.story);
      } else if (stepNumber === 3 && currentCampaignId) {
        await creationApi.updateVisuals(currentCampaignId, draft.visuals);
      } else if (stepNumber === 4 && currentCampaignId) {
        await creationApi.updateReach(currentCampaignId, draft.reach);
      } else if (stepNumber === 5 && currentCampaignId) {
        await creationApi.submitCampaign(currentCampaignId, draft.submit);
      }

      const updated: DraftState = {
        ...draft,
        campaignId: currentCampaignId,
        currentStep: Math.min(stepNumber + 1, 5),
        isSaving: false,
        lastSavedAt: new Date().toISOString(),
      };
      await persistLocally(updated);
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
        },
        submit: {
          fundingGoalPaise: camp.fundingGoalPaise || 5000000,
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
        saveCurrentStep,
        loadDraftFromBackend,
        resetDraft,
      }}
    >
      {children}
    </DraftContext.Provider>
  );
};

export const useDraft = () => useContext(DraftContext);
