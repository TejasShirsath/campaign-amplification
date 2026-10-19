import { apiRequest } from './client';
import { CampaignSummary } from './campaigns';
import { ContributionRecord } from './contributions';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface UserStats {
  campaignsCount: number;
  contributionsCount: number;
  savedCount: number;
}

export const userApi = {
  getProfile: async (): Promise<UserProfile> => {
    return apiRequest<UserProfile>('/api/v1/users/me');
  },

  updateProfile: async (data: UpdateProfileInput): Promise<UserProfile> => {
    return apiRequest<UserProfile>('/api/v1/users/me', {
      method: 'PATCH',
      body: data,
    });
  },

  getMyCampaigns: async (page = 1, limit = 20): Promise<CampaignSummary[]> => {
    return apiRequest<CampaignSummary[]>('/api/v1/users/me/campaigns', {
      params: { page, limit },
    });
  },

  getMyContributions: async (page = 1, limit = 20): Promise<ContributionRecord[]> => {
    return apiRequest<ContributionRecord[]>('/api/v1/users/me/contributions', {
      params: { page, limit },
    });
  },

  getMySavedCampaigns: async (page = 1, limit = 20): Promise<CampaignSummary[]> => {
    return apiRequest<CampaignSummary[]>('/api/v1/users/me/saved-campaigns', {
      params: { page, limit },
    });
  },
};
