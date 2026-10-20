import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import type {
  CampaignBasicsInput,
  CampaignStoryInput,
  CampaignVisualsInput,
  CampaignReachInput,
  CampaignSubmitInput,
  UpdateCampaignInput,
  CampaignQueryInput,
} from './campaigns.schema.js';
import type { Prisma, CampaignStatus } from '@prisma/client';

// Campaign select fields for listing
const campaignListSelect = {
  id: true,
  title: true,
  category: true,
  creatorName: true,
  summary: true,
  coverImageUrl: true,
  status: true,
  fundingGoalPaise: true,
  totalRaisedPaise: true,
  contributorCount: true,
  estimatedReach: true,
  isFeatured: true,
  createdAt: true,
  fundingEndsAt: true,
  creator: {
    select: {
      id: true,
      name: true,
      displayName: true,
      avatarUrl: true,
    },
  },
} satisfies Prisma.CampaignSelect;

// Campaign select fields for detail
const campaignDetailSelect = {
  id: true,
  creatorId: true,
  status: true,
  title: true,
  category: true,
  creatorName: true,
  summary: true,
  coverImageUrl: true,
  headline: true,
  introText: true,
  storyContent: true,
  sources: true,
  suggestedActions: true,
  targetLocations: true,
  audienceInterests: true,
  distributionChannels: true,
  campaignDuration: true,
  fundingGoalPaise: true,
  estimatedReach: true,
  agreedToTerms: true,
  totalRaisedPaise: true,
  contributorCount: true,
  submittedAt: true,
  approvedAt: true,
  fundingEndsAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  isFeatured: true,
  completedSteps: true,
  creator: {
    select: {
      id: true,
      name: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  creatives: {
    orderBy: { sortOrder: 'asc' as const },
    select: {
      id: true,
      type: true,
      url: true,
      headline: true,
      description: true,
      callToAction: true,
      caption: true,
      credit: true,
      sortOrder: true,
    },
  },
  targeting: {
    select: {
      locations: true,
      ageRange: true,
      interests: true,
      gender: true,
      platforms: true,
      budgetSplit: true,
    },
  },
} satisfies Prisma.CampaignSelect;

// Valid status transitions
const VALID_TRANSITIONS: Partial<Record<CampaignStatus, CampaignStatus[]>> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'],
  CHANGES_REQUESTED: ['SUBMITTED'],
  APPROVED: ['FUNDING'],
  FUNDING: ['FUNDED', 'COMPLETED', 'CANCELLED'],
  FUNDED: ['DISTRIBUTION_PREP'],
  DISTRIBUTION_PREP: ['PROMOTING'],
  PROMOTING: ['COMPLETED'],
};

export class CampaignService {
  /**
   * Create a new campaign draft.
   */
  async createDraft(userId: string, data?: Partial<CampaignBasicsInput>) {
    const campaign = await prisma.campaign.create({
      data: {
        creatorId: userId,
        status: 'DRAFT',
        title: data?.title || null,
        category: data?.category || null,
        creatorName: data?.creatorName || null,
        summary: data?.summary || null,
        coverImageUrl: data?.coverImageUrl || null,
        completedSteps: [],
      },
      select: campaignDetailSelect,
    });

    // Record campaign creation event
    await prisma.campaignEvent.create({
      data: {
        campaignId: campaign.id,
        userId,
        type: 'created',
        title: 'Campaign draft created',
      },
    });

    return campaign;
  }

  /**
   * Get campaign by ID, optionally checking ownership.
   */
  async getById(id: string, userId?: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: campaignDetailSelect,
    });

    if (!campaign) {
      throw ApiError.notFound('Campaign');
    }

    // If campaign is a draft, only the owner can view it
    if (campaign.status === 'DRAFT' && campaign.creatorId !== userId) {
      throw ApiError.notFound('Campaign');
    }

    return campaign;
  }

  /**
   * Update campaign basics (Step 1).
   */
  async updateBasics(id: string, userId: string, data: CampaignBasicsInput) {
    const campaign = await this.ensureOwnerAndEditable(id, userId);

    const completedSteps = this.addCompletedStep(campaign.completedSteps as string[] | null, 'basics');

    return prisma.campaign.update({
      where: { id },
      data: {
        title: data.title,
        category: data.category,
        creatorName: data.creatorName,
        summary: data.summary ?? null,
        coverImageUrl: data.coverImageUrl ?? null,
        completedSteps,
      },
      select: campaignDetailSelect,
    });
  }

  /**
   * Update campaign story (Step 2).
   */
  async updateStory(id: string, userId: string, data: CampaignStoryInput) {
    const campaign = await this.ensureOwnerAndEditable(id, userId);

    const completedSteps = this.addCompletedStep(campaign.completedSteps as string[] | null, 'story');

    const cleanSources = Array.isArray(data.sources)
      ? data.sources.filter((s) => s && (s.title?.trim() || s.url?.trim()))
      : data.sources;

    return prisma.campaign.update({
      where: { id },
      data: {
        headline: data.headline ?? null,
        introText: data.introText ?? null,
        storyContent: data.storyContent as any ?? undefined,
        sources: cleanSources as any ?? undefined,
        suggestedActions: data.suggestedActions ?? null,
        completedSteps,
      },
      select: campaignDetailSelect,
    });
  }

  /**
   * Update campaign visuals (Step 3).
   */
  async updateVisuals(id: string, userId: string, data: CampaignVisualsInput) {
    const campaign = await this.ensureOwnerAndEditable(id, userId);

    const completedSteps = this.addCompletedStep(campaign.completedSteps as string[] | null, 'visuals');

    const validCreatives = (data.creatives || []).filter((c) => c && c.url && c.url.trim());

    // Replace all creatives for this campaign
    await prisma.$transaction([
      prisma.campaignCreative.deleteMany({ where: { campaignId: id } }),
      ...validCreatives.map((creative) =>
        prisma.campaignCreative.create({
          data: {
            campaignId: id,
            type: creative.type,
            url: creative.url!,
            headline: creative.headline ?? null,
            description: creative.description ?? null,
            callToAction: creative.callToAction ?? null,
            caption: creative.caption ?? null,
            credit: creative.credit ?? null,
            sortOrder: creative.sortOrder,
          },
        })
      ),
      prisma.campaign.update({
        where: { id },
        data: { completedSteps },
      }),
    ]);

    return this.getById(id, userId);
  }

  /**
   * Update campaign reach/targeting (Step 4).
   */
  async updateReach(id: string, userId: string, data: CampaignReachInput) {
    const campaign = await this.ensureOwnerAndEditable(id, userId);

    const completedSteps = this.addCompletedStep(campaign.completedSteps as string[] | null, 'reach');

    if (data.budgetSplit || data.budgetAllocation) {
      await prisma.campaignTargeting.upsert({
        where: { campaignId: id },
        create: {
          campaignId: id,
          locations: (data.targetLocations as any) ?? undefined,
          interests: (data.audienceInterests as any) ?? undefined,
          platforms: (data.distributionChannels as any) ?? undefined,
          budgetSplit: (data.budgetSplit ?? { allocation: data.budgetAllocation }) as any,
        },
        update: {
          locations: (data.targetLocations as any) ?? undefined,
          interests: (data.audienceInterests as any) ?? undefined,
          platforms: (data.distributionChannels as any) ?? undefined,
          budgetSplit: (data.budgetSplit ?? { allocation: data.budgetAllocation }) as any,
        },
      });
    }

    return prisma.campaign.update({
      where: { id },
      data: {
        targetLocations: data.targetLocations as any ?? undefined,
        audienceInterests: data.audienceInterests as any ?? undefined,
        distributionChannels: data.distributionChannels as any ?? undefined,
        campaignDuration: data.campaignDuration ?? null,
        completedSteps,
      },
      select: campaignDetailSelect,
    });
  }

  /**
   * General campaign update (for saving drafts with any fields).
   */
  async update(id: string, userId: string, data: UpdateCampaignInput) {
    await this.ensureOwnerAndEditable(id, userId);

    const { completedSteps, ...updateData } = data;

    return prisma.campaign.update({
      where: { id },
      data: {
        ...updateData,
        ...(completedSteps && { completedSteps }),
      } as any,
      select: campaignDetailSelect,
    });
  }

  /**
   * Submit campaign for review (Step 5).
   */
  async submit(id: string, userId: string, data: CampaignSubmitInput) {
    const campaign = await this.ensureOwnerAndEditable(id, userId);

    // Validate required fields from previous steps
    if (!campaign.title) throw ApiError.badRequest('Campaign title is required before submission');
    if (!campaign.category) throw ApiError.badRequest('Campaign category is required before submission');
    if (!campaign.creatorName) throw ApiError.badRequest('Creator name is required before submission');

    // Validate status - only DRAFT or CHANGES_REQUESTED can be submitted
    if (campaign.status !== 'DRAFT' && campaign.status !== 'CHANGES_REQUESTED') {
      throw ApiError.conflict(`Campaign in ${campaign.status} status cannot be submitted`);
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        fundingGoalPaise: data.fundingGoalPaise,
        estimatedReach: data.estimatedReach ?? null,
        agreedToTerms: data.agreedToTerms,
        submittedAt: new Date(),
        completedSteps: ['basics', 'story', 'visuals', 'reach', 'submit'],
      },
      select: campaignDetailSelect,
    });

    // Record submission event
    await prisma.campaignEvent.create({
      data: {
        campaignId: id,
        userId,
        type: 'submitted',
        title: 'Campaign submitted for review',
        metadata: { fundingGoalPaise: data.fundingGoalPaise },
      },
    });

    // Create notification for the creator
    await prisma.notification.create({
      data: {
        userId,
        type: 'CAMPAIGN_SUBMITTED',
        title: 'Campaign submitted',
        message: `Your campaign "${updatedCampaign.title}" has been submitted for review.`,
        metadata: { campaignId: id },
      },
    });

    return updatedCampaign;
  }

  /**
   * Get campaign preview (submitted or draft).
   */
  async getPreview(id: string, userId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: campaignDetailSelect,
    });

    if (!campaign) throw ApiError.notFound('Campaign');
    if (campaign.creatorId !== userId) throw ApiError.forbidden();

    return campaign;
  }

  /**
   * Campaign discovery - list published/funding campaigns.
   */
  async discover(query: CampaignQueryInput) {
    const { page, limit, category, status, search, sort, featured } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CampaignWhereInput = {
      // Public campaigns only - exclude drafts, submitted (under review)
      status: status
        ? { equals: status as CampaignStatus }
        : { in: ['APPROVED', 'FUNDING', 'FUNDED', 'PROMOTING', 'COMPLETED'] },
      ...(category && { category: { equals: category } }),
      ...(featured !== undefined && { isFeatured: featured }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } },
          { creatorName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    let orderBy: Prisma.CampaignOrderByWithRelationInput;
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'most_funded':
        orderBy = { totalRaisedPaise: 'desc' };
        break;
      case 'least_funded':
        orderBy = { totalRaisedPaise: 'asc' };
        break;
      case 'ending_soon':
        orderBy = { fundingEndsAt: 'asc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: campaignListSelect,
      }),
      prisma.campaign.count({ where }),
    ]);

    return { campaigns, total };
  }

  /**
   * Get featured campaigns.
   */
  async getFeatured(limit = 6) {
    return prisma.campaign.findMany({
      where: {
        isFeatured: true,
        status: { in: ['APPROVED', 'FUNDING', 'FUNDED', 'PROMOTING', 'COMPLETED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: campaignListSelect,
    });
  }

  /**
   * Get campaign funding progress.
   */
  async getProgress(id: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: {
        id: true,
        fundingGoalPaise: true,
        totalRaisedPaise: true,
        contributorCount: true,
        estimatedReach: true,
        fundingEndsAt: true,
        status: true,
      },
    });

    if (!campaign) throw ApiError.notFound('Campaign');

    const percentFunded = campaign.fundingGoalPaise
      ? Math.min(100, Math.round((campaign.totalRaisedPaise / campaign.fundingGoalPaise) * 100))
      : 0;

    const daysRemaining = campaign.fundingEndsAt
      ? Math.max(0, Math.ceil((campaign.fundingEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

    return {
      ...campaign,
      percentFunded,
      daysRemaining,
    };
  }

  /**
   * Transition campaign status (internal/admin use).
   */
  async transitionStatus(id: string, newStatus: CampaignStatus, userId?: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true, status: true, title: true, creatorId: true, campaignDuration: true },
    });

    if (!campaign) throw ApiError.notFound('Campaign');

    const allowedTransitions = VALID_TRANSITIONS[campaign.status];
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      throw ApiError.conflict(
        `Cannot transition from ${campaign.status} to ${newStatus}`
      );
    }

    const updateData: Prisma.CampaignUpdateInput = { status: newStatus };

    if (newStatus === 'APPROVED') {
      updateData.approvedAt = new Date();
    }
    if (newStatus === 'FUNDING') {
      // Set funding end date based on campaign duration
      const durationDays = campaign.campaignDuration || 30;
      updateData.fundingEndsAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    }
    if (newStatus === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: updateData,
      select: campaignDetailSelect,
    });

    // Record event
    await prisma.campaignEvent.create({
      data: {
        campaignId: id,
        userId: userId || null,
        type: `status_${newStatus.toLowerCase()}`,
        title: `Campaign status changed to ${newStatus}`,
      },
    });

    // Notify creator
    const notificationTypeMap: Partial<Record<CampaignStatus, string>> = {
      APPROVED: 'CAMPAIGN_APPROVED',
      REJECTED: 'CAMPAIGN_REJECTED',
      CHANGES_REQUESTED: 'CAMPAIGN_CHANGES_REQUESTED',
      FUNDING: 'CAMPAIGN_FUNDING_AVAILABLE',
      COMPLETED: 'CAMPAIGN_COMPLETED',
    };

    const notificationType = notificationTypeMap[newStatus];
    if (notificationType) {
      await prisma.notification.create({
        data: {
          userId: campaign.creatorId,
          type: notificationType as any,
          title: `Campaign ${newStatus.toLowerCase().replace('_', ' ')}`,
          message: `Your campaign "${campaign.title}" has been ${newStatus.toLowerCase().replace('_', ' ')}.`,
          metadata: { campaignId: id },
        },
      });
    }

    return updated;
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private async ensureOwnerAndEditable(id: string, userId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: {
        id: true,
        creatorId: true,
        status: true,
        title: true,
        category: true,
        creatorName: true,
        completedSteps: true,
      },
    });

    if (!campaign) {
      throw ApiError.notFound('Campaign');
    }

    if (campaign.creatorId !== userId) {
      throw ApiError.forbidden('You do not own this campaign');
    }

    // Only DRAFT and CHANGES_REQUESTED campaigns can be edited
    if (campaign.status !== 'DRAFT' && campaign.status !== 'CHANGES_REQUESTED') {
      throw ApiError.conflict(`Campaign in ${campaign.status} status cannot be edited`);
    }

    return campaign;
  }

  private addCompletedStep(current: string[] | null, step: string): string[] {
    const steps = Array.isArray(current) ? [...current] : [];
    if (!steps.includes(step)) {
      steps.push(step);
    }
    return steps;
  }
}

export const campaignService = new CampaignService();
