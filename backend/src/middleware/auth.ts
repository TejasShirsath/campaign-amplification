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
 * Combined authentication middleware: validate JWT + resolve user.
 * Use this for all protected routes.
 */
export const authenticate = [jwtCheck, resolveUser] as const;

/**
 * Optional authentication: tries to resolve user but doesn't fail if no token.
 * Useful for endpoints that work for both authenticated and unauthenticated users.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    // Manually run jwt check
    await new Promise<void>((resolve, reject) => {
      jwtCheck(req as any, {} as any, (err?: any) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await resolveUser(req, {} as any, (err?: any) => {
      if (err) {
        // Silently ignore auth errors for optional auth
        next();
      } else {
        next();
      }
    });
  } catch {
    // If auth fails, continue without user context
    next();
  }
}
