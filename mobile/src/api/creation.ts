import { apiRequest } from './client';
import { CampaignDetail, CreativeItem, SourceItem, StoryBlock } from './campaigns';

export interface CampaignBasicsInput {
  title: string;
  category: string;
  creatorName: string;
  summary: string;
  coverImageUrl?: string;
}

export interface CampaignStoryInput {
  headline?: string;
  introText?: string;
  storyContent?: StoryBlock[];
  sources?: SourceItem[];
  suggestedActions?: string;
}

export interface CampaignVisualsInput {
  creatives: CreativeItem[];
}

export interface CampaignReachInput {
  targetLocations: string[];
  audienceInterests: string[];
  distributionChannels: string[];
  campaignDuration: number;
}

export interface CampaignSubmitInput {
  fundingGoalPaise: number;
  estimatedReach: number;
  agreedToTerms: boolean;
}

export const creationApi = {
  createDraft: async (data: CampaignBasicsInput): Promise<CampaignDetail> => {
    return apiRequest<CampaignDetail>('/api/v1/campaigns', {
      method: 'POST',
      body: data,
    });
  },

  updateBasics: async (id: string, data: CampaignBasicsInput): Promise<CampaignDetail> => {
    return apiRequest<CampaignDetail>(`/api/v1/campaigns/${id}/basics`, {
      method: 'PUT',
      body: data,
    });
  },

  updateStory: async (id: string, data: CampaignStoryInput): Promise<CampaignDetail> => {
    return apiRequest<CampaignDetail>(`/api/v1/campaigns/${id}/story`, {
      method: 'PUT',
      body: data,
    });
  },

  updateVisuals: async (id: string, data: CampaignVisualsInput): Promise<CampaignDetail> => {
    return apiRequest<CampaignDetail>(`/api/v1/campaigns/${id}/visuals`, {
      method: 'PUT',
      body: data,
    });
  },

  updateReach: async (id: string, data: CampaignReachInput): Promise<CampaignDetail> => {
    return apiRequest<CampaignDetail>(`/api/v1/campaigns/${id}/reach`, {
      method: 'PUT',
      body: data,
    });
  },

  submitCampaign: async (id: string, data: CampaignSubmitInput): Promise<CampaignDetail> => {
    return apiRequest<CampaignDetail>(`/api/v1/campaigns/${id}/submit`, {
      method: 'POST',
      body: data,
    });
  },

  getPreview: async (id: string): Promise<CampaignDetail> => {
    return apiRequest<CampaignDetail>(`/api/v1/campaigns/${id}/preview`);
  },
};
