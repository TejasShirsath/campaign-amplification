import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { updateUserSchema } from './users.schema.js';
import { userService } from './users.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';
import { paginationSchema } from '../../utils/pagination.js';
import type { Request, Response } from 'express';

const router = Router();

// All user routes require authentication
router.use(...authenticate);

// GET /users/me
router.get(
  '/me',
  asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getProfile(req.userId!);
    sendSuccess(res, user);
  })
);

// GET /users/me/stats
router.get(
  '/me/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await userService.getUserStats(req.userId!);
    sendSuccess(res, stats);
  })
);

// PATCH /users/me
router.patch(
  '/me',
  validate({ body: updateUserSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateProfile(req.userId!, req.body);
    sendSuccess(res, user);
  })
);

// GET /users/me/campaigns
router.get(
  '/me/campaigns',
  validate({ query: paginationSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = (req as any).validatedQuery;
    const { campaigns, total } = await userService.getUserCampaigns(req.userId!, page, limit);
    sendPaginated(res, campaigns, { page, limit, total });
  })
);

// GET /users/me/contributions
router.get(
  '/me/contributions',
  validate({ query: paginationSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = (req as any).validatedQuery;
    const { contributions, total } = await userService.getUserContributions(req.userId!, page, limit);
    sendPaginated(res, contributions, { page, limit, total });
  })
);

// GET /users/me/saved-campaigns
router.get(
  '/me/saved-campaigns',
  validate({ query: paginationSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = (req as any).validatedQuery;
    const { saved, total } = await userService.getUserSavedCampaigns(req.userId!, page, limit);
    sendPaginated(res, saved, { page, limit, total });
  })
);

export default router;
