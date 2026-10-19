import { auth, type AuthResult } from 'express-oauth2-jwt-bearer';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/api-error.js';

// Auth0 JWT validation middleware
export const jwtCheck = auth({
  audience: env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${env.AUTH0_DOMAIN}`,
  tokenSigningAlg: 'RS256',
});

// Extend Request type to include user context
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      authSubject?: string;
    }
  }
}

/**
 * Handle demo token resolution
 */
async function resolveDemoUser(req: Request, token: string): Promise<boolean> {
  if (!token.startsWith('demo-')) return false;

  const authSubject = token === 'demo-backer' || token === 'demo-backer-token'
    ? 'demo|seed-user-002'
    : 'demo|seed-user-001';

  let user = await prisma.user.findUnique({
    where: { authSubject },
    select: { id: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        authSubject,
        email: authSubject === 'demo|seed-user-002' ? 'backer@campaignamplify.dev' : 'demo@campaignamplify.dev',
        name: authSubject === 'demo|seed-user-002' ? 'Demo Backer' : 'Demo Creator',
        displayName: authSubject === 'demo|seed-user-002' ? 'Eco Supporter' : 'CampaignAmp Demo',
      },
      select: { id: true },
    });
  }

  req.authSubject = authSubject;
  req.userId = user.id;
  return true;
}

/**
 * After JWT validation, resolve or create the local user record.
 * Maps Auth0 subject to our internal user ID.
 */
export async function resolveUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authPayload = (req as any).auth as AuthResult;
    if (!authPayload?.payload?.sub) {
      throw ApiError.unauthorized('Invalid token: missing subject');
    }

    const authSubject = authPayload.payload.sub;
    req.authSubject = authSubject;

    // Upsert user: create if not exists, otherwise fetch
    const user = await prisma.user.upsert({
      where: { authSubject },
      update: { updatedAt: new Date() },
      create: {
        authSubject,
        email: (authPayload.payload as any).email || null,
        name: (authPayload.payload as any).name || null,
      },
      select: { id: true },
    });

    req.userId = user.id;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(ApiError.unauthorized('Failed to resolve user'));
    }
  }
}

/**
 * Combined authentication middleware: validate JWT or demo token + resolve user.
 */
export const authenticate = [
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      if (token.startsWith('demo-')) {
        try {
          await resolveDemoUser(req, token);
          return next();
        } catch (err) {
          return next(err);
        }
      }
    }

    // Standard Auth0 token validation
    jwtCheck(req as any, res as any, (err?: any) => {
      if (err) return next(err);
      resolveUser(req, res, next);
    });
  },
] as const;

/**
 * Optional authentication: tries to resolve user but doesn't fail if no token.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (token.startsWith('demo-')) {
    try {
      await resolveDemoUser(req, token);
    } catch {
      // Continue even if demo user resolution fails
    }
    next();
    return;
  }

  try {
    await new Promise<void>((resolve, reject) => {
      jwtCheck(req as any, {} as any, (err?: any) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await resolveUser(req, {} as any, (err?: any) => {
      next();
    });
  } catch {
    next();
  }
}
