import { auth, type AuthResult } from 'express-oauth2-jwt-bearer';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/api-error.js';

// Auth0 JWT validation middleware
export const jwtCheck = auth({
  audience: [env.AUTH0_AUDIENCE, env.AUTH0_AUDIENCE.replace(/\/+$/, '')],
  issuerBaseURL: `https://${env.AUTH0_DOMAIN.replace(/\/+$/, '')}/`,
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
export async function resolveDemoUser(req: Request, token: string): Promise<boolean> {
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
 * Dynamically fetches Auth0 userinfo if name/email are missing from JWT claims.
 */
export async function resolveUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authPayload = (req as any).auth as AuthResult;
    if (!authPayload?.payload?.sub) {
      throw ApiError.unauthorized('Invalid token: missing subject');
    }

    const authSubject = authPayload.payload.sub;
    req.authSubject = authSubject;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { authSubject },
      select: { id: true, email: true, name: true, displayName: true, avatarUrl: true },
    });

    if (!user) {
      // Extract from token claims
      let email = (authPayload.payload as any).email || (authPayload.payload as any)['https://rippleup.dev/email'] || null;
      let name = (authPayload.payload as any).name || (authPayload.payload as any)['https://rippleup.dev/name'] || null;
      let avatarUrl = (authPayload.payload as any).picture || null;

      // If missing from token claims, query Auth0 /userinfo using Bearer token
      const authHeader = req.headers.authorization;
      if ((!email || !name || !avatarUrl) && authHeader) {
        try {
          const domain = env.AUTH0_DOMAIN.replace(/\/+$/, '');
          const infoRes = await fetch(`https://${domain}/userinfo`, {
            headers: { Authorization: authHeader },
          });
          if (infoRes.ok) {
            const info = (await infoRes.json()) as any;
            email = email || info.email || null;
            name = name || info.name || info.nickname || null;
            avatarUrl = avatarUrl || info.picture || null;
          }
        } catch (fetchErr) {
          console.warn('[Auth0 /userinfo]', fetchErr);
        }
      }

      user = await prisma.user.create({
        data: {
          authSubject,
          email,
          name,
          displayName: name || (email ? email.split('@')[0] : 'RippleUp Creator'),
          avatarUrl,
        },
        select: { id: true, email: true, name: true, displayName: true, avatarUrl: true },
      });
    } else if (!user.avatarUrl || !user.name || !user.email) {
      // User exists, but was created before userinfo enrichment: update missing fields
      let email = user.email || (authPayload.payload as any).email || (authPayload.payload as any)['https://rippleup.dev/email'] || null;
      let name = user.name || (authPayload.payload as any).name || (authPayload.payload as any)['https://rippleup.dev/name'] || null;
      let avatarUrl = user.avatarUrl || (authPayload.payload as any).picture || null;

      const authHeader = req.headers.authorization;
      if ((!email || !name || !avatarUrl) && authHeader) {
        try {
          const domain = env.AUTH0_DOMAIN.replace(/\/+$/, '');
          const infoRes = await fetch(`https://${domain}/userinfo`, {
            headers: { Authorization: authHeader },
          });
          if (infoRes.ok) {
            const info = (await infoRes.json()) as any;
            email = email || info.email || null;
            name = name || info.name || info.nickname || null;
            avatarUrl = avatarUrl || info.picture || null;
          }
        } catch (fetchErr) {
          console.warn('[Auth0 /userinfo]', fetchErr);
        }
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: email || undefined,
          name: name || undefined,
          displayName: user.displayName || name || (email ? email.split('@')[0] : 'RippleUp Creator'),
          avatarUrl: avatarUrl || undefined,
        },
        select: { id: true, email: true, name: true, displayName: true, avatarUrl: true },
      });
    }

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
