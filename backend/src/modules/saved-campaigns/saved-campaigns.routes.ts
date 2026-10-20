import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate, optionalAuth } from '../../middleware/auth.js';
import { validate, uuidParamSchema } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.js';
import { ApiError } from '../../utils/api-error.js';

const router = Router();

// POST /campaigns/:id/save - Save a campaign (requires auth)
router.post(
  '/:id/save',
  ...authenticate,
  validate({ params: uuidParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const campaignId = req.params.id as string;
    const userId = req.userId!;

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    });
    if (!campaign) throw ApiError.notFound('Campaign');

    // Upsert to prevent duplicate
    await prisma.savedCampaign.upsert({
      where: {
        userId_campaignId: { userId, campaignId },
      },
      create: { userId, campaignId },
      update: {},
    });

    sendCreated(res, { saved: true });
  })
);

// DELETE /campaigns/:id/save - Unsave a campaign (requires auth)
router.delete(
  '/:id/save',
  ...authenticate,
  validate({ params: uuidParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const campaignId = req.params.id as string;
    const userId = req.userId!;

    await prisma.savedCampaign.deleteMany({
      where: { userId, campaignId },
    });

    sendNoContent(res);
  })
);

// GET /campaigns/:id/saved - Check if campaign is saved (safe for guests)
router.get(
  '/:id/saved',
  optionalAuth,
  validate({ params: uuidParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.userId) {
      sendSuccess(res, { isSaved: false });
      return;
    }

    const saved = await prisma.savedCampaign.findUnique({
      where: {
        userId_campaignId: {
          userId: req.userId,
          campaignId: req.params.id as string,
        },
      },
    });

    sendSuccess(res, { isSaved: !!saved });
  })
);

export default router;
