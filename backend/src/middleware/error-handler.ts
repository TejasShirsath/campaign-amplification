import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error.js';
import { sendError } from '../utils/response.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // Already sent response
  if (res.headersSent) {
    return;
  }

  if (err instanceof ApiError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // Handle JSON parsing errors
  if ((err as any).type === 'entity.parse.failed' || (err as any).status === 400) {
    sendError(res, 400, 'BAD_REQUEST', 'Invalid JSON in request body');
    return;
  }

  // Handle payload too large
  if ((err as any).type === 'entity.too.large') {
    sendError(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body too large');
    return;
  }

  // Log unexpected errors
  console.error('Unhandled error:', err);

  // Prisma-specific diagnostic messages
  const prismaCode = (err as any).code;
  if (prismaCode === 'P2021') {
    sendError(res, 500, 'DATABASE_TABLE_NOT_FOUND', 'Database tables have not been created yet. Please run migrations.');
    return;
  }
  if (prismaCode === 'P1001') {
    sendError(res, 500, 'DATABASE_UNREACHABLE', 'Cannot reach database server. Please check connection string, pooling port, and SSL settings.');
    return;
  }
  if (prismaCode === 'P1000') {
    sendError(res, 500, 'DATABASE_AUTH_FAILED', 'Database authentication failed. Please verify database password and user in Vercel environment variables.');
    return;
  }

  sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}
