import type { Request, Response, NextFunction } from 'express';
import { z, type ZodSchema } from 'zod';
import { ApiError } from '../utils/api-error.js';

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: unknown[] = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.push(
          ...result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
            source: 'body',
          }))
        );
      } else {
        req.body = result.data;
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.push(
          ...result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
            source: 'params',
          }))
        );
      } else {
        (req as any).validatedParams = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.push(
          ...result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
            source: 'query',
          }))
        );
      } else {
        (req as any).validatedQuery = result.data;
      }
    }

    if (errors.length > 0) {
      throw ApiError.validationError('Validation failed', errors);
    }

    next();
  };
}

// Common param schemas
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});
