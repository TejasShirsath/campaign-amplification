import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';

// Module routes
import healthRoutes from './modules/health/health.routes.js';
import userRoutes from './modules/users/users.routes.js';
import campaignRoutes from './modules/campaigns/campaigns.routes.js';
import contributionRoutes from './modules/contributions/contributions.routes.js';
import savedCampaignRoutes from './modules/saved-campaigns/saved-campaigns.routes.js';
import feedbackRoutes from './modules/feedback/feedback.routes.js';
import activityRoutes from './modules/activity/activity.routes.js';
import reportRoutes from './modules/reports/reports.routes.js';
import uploadRoutes, { uploadDir } from './modules/uploads/uploads.routes.js';

export function createApp() {
  const app = express();

  // Trust reverse proxy headers (e.g. Vercel, Nginx, cloud load balancers)
  app.set('trust proxy', 1);

  // ─── Global Middleware ──────────────────────────────────────────────────────

  // Restore original URL when running behind Vercel rewrites
  app.use((req, _res, next) => {
    const originalUrl = (req.headers['x-forwarded-url'] || req.headers['x-original-url']) as string | undefined;
    if (originalUrl) {
      req.url = originalUrl;
    }
    next();
  });

  // Security headers with cross-origin resource sharing for uploaded static files
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    })
  );

  // CORS
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Rate limiting
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests, please try again later',
      },
    },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(generalLimiter);

  // Webhook route needs raw body for signature verification
  // This MUST come before express.json()
  app.use(
    '/api/v1/webhooks/razorpay',
    express.raw({ type: 'application/json' }),
    (req, _res, next) => {
      // Store raw body for webhook signature verification
      (req as any).rawBody = req.body;
      // Parse raw body to JSON for route handler
      if (Buffer.isBuffer(req.body)) {
        req.body = JSON.parse(req.body.toString());
      }
      next();
    }
  );

  // JSON body parser with size limit
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Static files serving for uploaded assets with permissive cross-origin and private network headers
  app.use(
    '/uploads',
    (_req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
      next();
    },
    express.static(uploadDir)
  );

  // ─── Routes ─────────────────────────────────────────────────────────────────

  // Health (no prefix, no rate limit restriction beyond general)
  app.use('/', healthRoutes);
  app.use('/api/v1', healthRoutes);

  // API v1 routes
  app.use('/api/v1/uploads', uploadRoutes);
  app.use('/api/v1/users', authLimiter, userRoutes);
  app.use('/api/v1/campaigns', campaignRoutes);
  app.use('/api/v1', paymentLimiter, contributionRoutes);
  app.use('/api/v1/campaigns', savedCampaignRoutes);
  app.use('/api/v1/campaigns', feedbackRoutes);
  app.use('/api/v1/activity', activityRoutes);
  app.use('/api/v1/campaigns', reportRoutes);

  // ─── Error Handling ─────────────────────────────────────────────────────────

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const app = createApp();
export default app;
