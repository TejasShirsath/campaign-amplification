import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate, uuidParamSchema } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { z } from 'zod';

const feedbackSchema = z.object({
  type: z.enum(['VISUAL_ENGAGEMENT', 'MESSAGE_IMPACT']),
  value: z.enum(['NO', 'SOMEWHAT', 'YES']),
});

const router = Router();

// POST /campaigns/:id/feedback - Submit feedback
router.post(
  '/:id/feedback',
  ...authenticate,
  validate({ params: uuidParamSchema, body: feedbackSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const campaignId = req.params.id as string;
    const userId = req.userId!;
    const { type, value } = req.body;

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    });
    if (!campaign) {
      const { ApiError } = await import('../../utils/api-error.js');
      throw ApiError.notFound('Campaign');
    }

    // Upsert feedback - allows changing vote
    const feedback = await prisma.campaignFeedback.upsert({
      where: {
        campaignId_userId_type: { campaignId, userId, type },
      },
      create: { campaignId, userId, type, value },
      update: { value },
    });

    sendCreated(res, feedback);
  })
);

// GET /campaigns/:id/feedback - Get campaign feedback summary
router.get(
  '/:id/feedback',
  validate({ params: uuidParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const campaignId = req.params.id as string;

    const feedback = await prisma.campaignFeedback.groupBy({
      by: ['type', 'value'],
      where: { campaignId },
      _count: { _all: true },
    });

    // Transform into a more useful shape
    const summary: Record<string, Record<string, number>> = {};
    for (const item of feedback) {
      if (!summary[item.type]) {
        summary[item.type] = {};
      }
      summary[item.type][item.value] = item._count._all;
    }

    sendSuccess(res, summary);
  })
);

// GET /campaigns/:id/feedback/me - Get user's own feedback
router.get(
  '/:id/feedback/me',
  ...authenticate,
  validate({ params: uuidParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const feedback = await prisma.campaignFeedback.findMany({
      where: {
        campaignId: req.params.id as string,
        userId: req.userId!,
      },
    });

    sendSuccess(res, feedback);
  })
);

export default router;
