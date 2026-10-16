import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate, uuidParamSchema } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess } from '../../utils/response.js';
import { ApiError } from '../../utils/api-error.js';

const router = Router();

// GET /campaigns/:id/report - Get distribution report (creator or public for completed)
router.get(
  '/:id/report',
  validate({ params: uuidParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const campaignId = req.params.id as string;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, creatorId: true, status: true },
    });

    if (!campaign) throw ApiError.notFound('Campaign');

    // Reports are visible to creator always, public only for completed campaigns
    const isCreator = req.userId === campaign.creatorId;
    if (!isCreator && campaign.status !== 'COMPLETED') {
      throw ApiError.forbidden('Report is only available for completed campaigns');
    }

    const report = await prisma.distributionReport.findFirst({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    });

    if (!report) throw ApiError.notFound('Distribution report');

    sendSuccess(res, report);
  })
);

export default router;
