import { apiRequest } from './client';

export interface CampaignSummary {
  id: string;
  title: string;
  category: string;
  creatorName: string;
  summary: string;
  coverImageUrl?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'FUNDING' | 'FUNDED' | 'COMPLETED' | 'REJECTED';
  fundingGoalPaise: number;
  totalRaisedPaise: number;
  contributorCount: number;
  estimatedReach: number;
  isFeatured: boolean;
  createdAt: string;
  fundingEndsAt?: string;
  completedSteps?: string[];
  creator?: {
    id: string;
    name: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export interface StoryBlock {
  id: string;
  type: 'text' | 'statistic' | 'quote';
  content?: string;
  value?: string;
  caption?: string;
  label?: string;
}

export interface SourceItem {
  title: string;
  url: string;
}

export interface CreativeItem {
  id?: string;
  type: 'cover' | 'ad_image' | 'video';
  url: string;
  headline?: string;
  description?: string;
  caption?: string;
  callToAction?: string;
  sortOrder?: number;
}

export interface CampaignDetail extends CampaignSummary {
  headline?: string;
  introText?: string;
  storyContent?: StoryBlock[];
  sources?: SourceItem[];
  creatives?: CreativeItem[];
  targetLocations?: string[];
  audienceInterests?: string[];
  distributionChannels?: string[];
  campaignDuration?: number;
  suggestedActions?: string;
}

export interface CampaignProgress {
  fundingGoalPaise: number;
  totalRaisedPaise: number;
  percentFunded: number;
  contributorCount: number;
  daysRemaining: number;
  estimatedReach: number;
}

export interface FeedbackSummary {
  visualEngagement: {
    yes: number;
    somewhat: number;
    no: number;
    total: number;
  };
  messageImpact: {
    yes: number;
    somewhat: number;
    no: number;
    total: number;
  };
}

export interface DistributionReport {
  id: string;
  campaignId: string;
  totalRaisedPaise: number;
  adSpendPaise: number;
  platformFeePaise: number;
  impressions: number;
  clicks: number;
  estimatedReach: number;
  measuredReach: number;
  startDate: string;
  endDate: string;
  metadata?: {
    platforms?: string[];
    topLocations?: string[];
    engagementRate?: number;
  };
}

export interface CampaignEvent {
  id: string;
  type: string;
  title: string;
  metadata?: any;
  createdAt: string;
}

export const campaignsApi = {
  getFeatured: async (): Promise<CampaignSummary[]> => {
    return apiRequest<CampaignSummary[]>('/api/v1/campaigns/featured', {
      requiresAuth: false,
    });
  },

  discover: async (params: {
    page?: number;
    limit?: number;
    category?: string;
    sort?: 'newest' | 'oldest' | 'most_funded' | 'least_funded' | 'ending_soon';
    search?: string;
    featured?: boolean;
  } = {}): Promise<CampaignSummary[]> => {
    return apiRequest<CampaignSummary[]>('/api/v1/campaigns', {
      params,
      requiresAuth: false,
    });
  },

  getById: async (id: string): Promise<CampaignDetail> => {
    return apiRequest<CampaignDetail>(`/api/v1/campaigns/${id}`, {
      requiresAuth: false,
    });
  },

  getProgress: async (id: string): Promise<CampaignProgress> => {
    return apiRequest<CampaignProgress>(`/api/v1/campaigns/${id}/progress`, {
      requiresAuth: false,
    });
  },

  getFeedback: async (id: string): Promise<FeedbackSummary> => {
    return apiRequest<FeedbackSummary>(`/api/v1/campaigns/${id}/feedback`, {
      requiresAuth: false,
    });
  },

  submitFeedback: async (id: string, type: 'VISUAL_ENGAGEMENT' | 'MESSAGE_IMPACT', value: 'YES' | 'SOMEWHAT' | 'NO') => {
    return apiRequest(`/api/v1/campaigns/${id}/feedback`, {
      method: 'POST',
      body: { type, value },
    });
  },

  saveCampaign: async (id: string) => {
    return apiRequest(`/api/v1/campaigns/${id}/save`, {
      method: 'POST',
    });
  },

  unsaveCampaign: async (id: string) => {
    return apiRequest(`/api/v1/campaigns/${id}/save`, {
      method: 'DELETE',
    });
  },

  checkSaved: async (id: string): Promise<{ isSaved: boolean }> => {
    return apiRequest<{ isSaved: boolean }>(`/api/v1/campaigns/${id}/saved`);
  },

  getReport: async (id: string): Promise<DistributionReport> => {
    return apiRequest<DistributionReport>(`/api/v1/campaigns/${id}/report`);
  },

  getEvents: async (id: string, page = 1, limit = 10): Promise<CampaignEvent[]> => {
    return apiRequest<CampaignEvent[]>(`/api/v1/activity/campaigns/${id}/events`, {
      params: { page, limit },
      requiresAuth: false,
    });
  },
};
