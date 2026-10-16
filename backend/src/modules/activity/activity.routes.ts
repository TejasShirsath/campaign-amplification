import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate, uuidParamSchema } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess, sendPaginated, sendNoContent } from '../../utils/response.js';
import { paginationSchema } from '../../utils/pagination.js';

const router = Router();

// GET /activity/notifications - Get user notifications (authenticated)
router.get(
  '/notifications',
  ...authenticate,
  validate({ query: paginationSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = (req as any).validatedQuery;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.userId! },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId: req.userId! } }),
    ]);

    sendPaginated(res, notifications, { page, limit, total });
  })
);

// GET /activity/notifications/unread-count
router.get(
  '/notifications/unread-count',
  ...authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const count = await prisma.notification.count({
      where: { userId: req.userId!, isRead: false },
    });
    sendSuccess(res, { unreadCount: count });
  })
);

// PATCH /activity/notifications/:id/read - Mark notification as read
router.patch(
  '/notifications/:id/read',
  ...authenticate,
  validate({ params: uuidParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.notification.updateMany({
      where: { id: req.params.id as string, userId: req.userId! },
      data: { isRead: true },
    });
    sendNoContent(res);
  })
);

// POST /activity/notifications/read-all - Mark all notifications as read
router.post(
  '/notifications/read-all',
  ...authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.notification.updateMany({
      where: { userId: req.userId!, isRead: false },
      data: { isRead: true },
    });
    sendNoContent(res);
  })
);

// GET /activity/campaigns/:id/events - Get campaign activity/events
router.get(
  '/campaigns/:id/events',
  validate({ params: uuidParamSchema, query: paginationSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = (req as any).validatedQuery;
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      prisma.campaignEvent.findMany({
        where: { campaignId: req.params.id as string },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          metadata: true,
          createdAt: true,
        },
      }),
      prisma.campaignEvent.count({ where: { campaignId: req.params.id as string } }),
    ]);

    sendPaginated(res, events, { page, limit, total });
  })
);

export default router;
