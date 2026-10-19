import { apiRequest } from './client';

export interface ContributionOrderResponse {
  contributionId: string;
  orderId: string;
  amountPaise: number;
  platformFeePaise: number;
  totalPaise: number;
  currency: string;
  keyId: string;
  campaignTitle: string;
  isDemoMode: boolean;
}

export interface VerifyPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface ContributionRecord {
  id: string;
  campaignId: string;
  amountPaise: number;
  platformFeePaise: number;
  totalPaise: number;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
  isAnonymous: boolean;
  createdAt: string;
  campaign?: {
    id: string;
    title: string;
    coverImageUrl?: string;
  };
}

export const contributionsApi = {
  createOrder: async (campaignId: string, amountPaise: number, isAnonymous = false): Promise<ContributionOrderResponse> => {
    return apiRequest<ContributionOrderResponse>(`/api/v1/campaigns/${campaignId}/contributions`, {
      method: 'POST',
      body: { amountPaise, isAnonymous },
    });
  },

  verifyPayment: async (data: VerifyPaymentInput): Promise<{ contributionId: string; status: string; campaignTitle?: string }> => {
    return apiRequest('/api/v1/payments/razorpay/verify', {
      method: 'POST',
      body: data,
    });
  },

  getById: async (id: string): Promise<ContributionRecord> => {
    return apiRequest<ContributionRecord>(`/api/v1/contributions/${id}`);
  },
};
