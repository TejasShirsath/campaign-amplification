import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess } from '../../utils/response.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'ok',
    service: 'campaign-amplification-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get('/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    sendSuccess(res, {
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database is not available',
      },
    });
  }
});

export default router;
