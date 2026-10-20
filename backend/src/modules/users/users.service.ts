import { prisma } from '../../lib/prisma.js';
import type { UpdateUserInput } from './users.schema.js';
import { ApiError } from '../../utils/api-error.js';

export class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User');
    }

    return user;
  }

  async updateProfile(userId: string, data: UpdateUserInput) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getUserCampaigns(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where: { creatorId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          coverImageUrl: true,
          fundingGoalPaise: true,
          totalRaisedPaise: true,
          contributorCount: true,
          estimatedReach: true,
          createdAt: true,
          updatedAt: true,
          completedSteps: true,
        },
      }),
      prisma.campaign.count({ where: { creatorId: userId } }),
    ]);

    return { campaigns, total };
  }

  async getUserContributions(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [contributions, total] = await Promise.all([
      prisma.contribution.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          amountPaise: true,
          platformFeePaise: true,
          totalPaise: true,
          status: true,
          isAnonymous: true,
          createdAt: true,
          campaign: {
            select: {
              id: true,
              title: true,
              coverImageUrl: true,
              status: true,
            },
          },
        },
      }),
      prisma.contribution.count({ where: { userId } }),
    ]);

    return { contributions, total };
  }

  async getUserSavedCampaigns(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [saved, total] = await Promise.all([
      prisma.savedCampaign.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          createdAt: true,
          campaign: {
            select: {
              id: true,
              title: true,
              category: true,
              coverImageUrl: true,
              creatorName: true,
              summary: true,
              fundingGoalPaise: true,
              totalRaisedPaise: true,
              contributorCount: true,
              estimatedReach: true,
              status: true,
            },
          },
        },
      }),
      prisma.savedCampaign.count({ where: { userId } }),
    ]);

    return { saved, total };
  }

  async getUserStats(userId: string) {
    const [campaignsCount, contributionsCount, savedCount] = await Promise.all([
      prisma.campaign.count({ where: { creatorId: userId } }),
      prisma.contribution.count({ where: { userId } }),
      prisma.savedCampaign.count({ where: { userId } }),
    ]);

    return {
      campaignsCount,
      contributionsCount,
      savedCount,
    };
  }

  async getOrCreateGuestUser(): Promise<string> {
    const guestAuthSubject = 'guest|anonymous';
    let user = await prisma.user.findUnique({
      where: { authSubject: guestAuthSubject },
      select: { id: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          authSubject: guestAuthSubject,
          email: 'guest@rippleup.dev',
          name: 'Guest Contributor',
          displayName: 'Anonymous Supporter',
        },
        select: { id: true },
      });
    }

    return user.id;
  }
}

export const userService = new UserService();
