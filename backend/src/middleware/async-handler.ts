import type { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async route handler so thrown errors are passed to Express error middleware.
 * Works with Express 5's native async support as a safety net.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void> | void
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
