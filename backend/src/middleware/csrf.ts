import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';
import { env } from '../config/env';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF Protection Middleware:
 * Enforces SameSite=Lax cookie safety combined with requiring the custom X-Requested-With header
 * on all state-changing HTTP methods (POST, PUT, PATCH, DELETE).
 * Browsers cannot attach custom headers cross-origin without an explicit CORS preflight check.
 */
export function csrfProtection(req: Request, _res: Response, next: NextFunction) {
  if (STATE_CHANGING_METHODS.has(req.method.toUpperCase())) {
    const customHeader = req.headers[env.CSRF_HEADER_NAME.toLowerCase()] || req.headers['x-requested-with'];
    if (!customHeader) {
      throw new ForbiddenError(
        `CSRF validation failed: missing required custom header (${env.CSRF_HEADER_NAME})`,
        undefined,
        'CSRF_DETECTED'
      );
    }
  }
  next();
}
