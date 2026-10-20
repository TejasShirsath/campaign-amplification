import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate, optionalAuth } from '../../middleware/auth.js';
import { validate, uuidParamSchema } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import {
  campaignBasicsSchema,
  campaignStorySchema,
  campaignVisualsSchema,
  campaignReachSchema,
  campaignSubmitSchema,
  updateCampaignSchema,
  campaignQuerySchema,
} from './campaigns.schema.js';
import { campaignService } from './campaigns.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.js';

const router = Router();

// ─── Public Routes (no auth required) ────────────────────────────────────────

// GET /campaigns - Discover campaigns
router.get(
  '/',
  validate({ query: campaignQuerySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const query = (req as any).validatedQuery;
    const { campaigns, total } = await campaignService.discover(query);
    sendPaginated(res, campaigns, { page: query.page, limit: query.limit, total });
  })
);

// GET /campaigns/featured - Featured campaigns
router.get(
  '/featured',
  asyncHandler(async (_req: Request, res: Response) => {
    const campaigns = await campaignService.getFeatured();
    sendSuccess(res, campaigns);
  })
);

// GET /campaigns/:id - Get campaign detail (public, optional auth resolves userId if logged in)
router.get(
  '/:id',
  optionalAuth,
  validate({ params: uuidParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    // Try to get userId from optional auth
    const userId = req.userId;
    const campaign = await campaignService.getById(req.params.id as string, userId);
    sendSuccess(res, campaign);
  })
);

// GET /campaigns/:id/progress - Get campaign funding progress
router.get(
  '/:id/progress',
  validate({ params: uuidParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const progress = await campaignService.getProgress(req.params.id as string);
    sendSuccess(res, progress);
  })
);

// ─── Protected Routes (auth required) ────────────────────────────────────────

// POST /campaigns - Create a new campaign draft
router.post(
  '/',
  ...authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const campaign = await campaignService.createDraft(req.userId!, req.body);
    sendCreated(res, campaign);
  })
);

// PATCH /campaigns/:id - General update (save draft)
router.patch(
  '/:id',
  ...authenticate,
  validate({ params: uuidParamSchema, body: updateCampaignSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const campaign = await campaignService.update(req.params.id as string, req.userId!, req.body);
    sendSuccess(res, campaign);
  })
);

// PUT /campaigns/:id/basics - Update Step 1
router.put(
  '/:id/basics',
  ...authenticate,
  validate({ params: uuidParamSchema, body: campaignBasicsSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const campaign = await campaignService.updateBasics(req.params.id as string, req.userId!, req.body);
    sendSuccess(res, campaign);
  })
);

// PUT /campaigns/:id/story - Update Step 2
router.put(
  '/:id/story',
  ...authenticate,
  validate({ params: uuidParamSchema, body: campaignStorySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const campaign = await campaignService.updateStory(req.params.id as string, req.userId!, req.body);
    sendSuccess(res, campaign);
  })
);

// PUT /campaigns/:id/visuals - Update Step 3
router.put(
  '/:id/visuals',
  ...authenticate,
  validate({ params: uuidParamSchema, body: campaignVisualsSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const campaign = await campaignService.updateVisuals(req.params.id as string, req.userId!, req.body);
    sendSuccess(res, campaign);
  })
);

// PUT /campaigns/:id/reach - Update Step 4
router.put(
  '/:id/reach',
  ...authenticate,
  validate({ params: uuidParamSchema, body: campaignReachSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const campaign = await campaignService.updateReach(req.params.id as string, req.userId!, req.body);
    sendSuccess(res, campaign);
  })
);

// POST /campaigns/:id/submit - Submit for review (Step 5)
router.post(
  '/:id/submit',
  ...authenticate,
  validate({ params: uuidParamSchema, body: campaignSubmitSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const campaign = await campaignService.submit(req.params.id as string, req.userId!, req.body);
    sendSuccess(res, campaign);
  })
);

// GET /campaigns/:id/preview - Preview campaign (creator only)
router.get(
  '/:id/preview',
  ...authenticate,
  validate({ params: uuidParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const campaign = await campaignService.getPreview(req.params.id as string, req.userId!);
    sendSuccess(res, campaign);
  })
);

// POST /campaigns/:id/status - Transition campaign status (Admin / Reviewer / Demo)
router.post(
  '/:id/status',
  optionalAuth,
  validate({ params: uuidParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;
    const campaign = await campaignService.transitionStatus(
      req.params.id as string,
      status,
      req.userId
    );
    sendSuccess(res, campaign);
  })
);

export default router;
