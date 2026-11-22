import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { hashToken } from '../utils/crypto';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { Role, UserStatus } from '@prisma/client';

export const SESSION_COOKIE_NAME = 'jobify_session';
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const SESSION_IDLE_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours idle timeout

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionId?: string;
    }
  }
}

/**
 * Middleware: Requires an active, non-expired, non-suspended session.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const rawToken = req.cookies[SESSION_COOKIE_NAME];
    if (!rawToken) {
      throw new UnauthorizedError('Authentication required: no active session', undefined, 'UNAUTHORIZED');
    }

    const tokenHash = hashToken(rawToken);
    const session = await prisma.session.findUnique({
      where: { sessionTokenHash: tokenHash },
      include: {
        user: true,
      },
    });

    if (!session) {
      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
      throw new UnauthorizedError('Invalid or expired session', undefined, 'INVALID_SESSION');
    }

    const now = new Date();

    // Check expiry
    if (session.expiresAt < now) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
      throw new UnauthorizedError('Session expired, please log in again', undefined, 'SESSION_EXPIRED');
    }

    // Check idle timeout
    const idleTime = now.getTime() - session.lastActiveAt.getTime();
    if (idleTime > SESSION_IDLE_TIMEOUT_MS) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
      throw new UnauthorizedError('Session timed out due to inactivity', undefined, 'SESSION_IDLE_TIMEOUT');
    }

    // Check suspended user status
    if (session.user.status === UserStatus.SUSPENDED) {
      await prisma.session.deleteMany({ where: { userId: session.user.id } }).catch(() => {});
      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
      throw new ForbiddenError('Account is suspended. Access denied.', undefined, 'USER_SUSPENDED');
    }

    // Refresh last active timestamp if older than 1 minute to avoid excessive writes
    if (idleTime > 60 * 1000) {
      await prisma.session.update({
        where: { id: session.id },
        data: { lastActiveAt: now },
      }).catch(() => {});
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      status: session.user.status,
      createdAt: session.user.createdAt,
      updatedAt: session.user.updatedAt,
    };
    req.sessionId = session.id;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware: Optional authentication (attaches req.user if valid session exists, but does not block).
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const rawToken = req.cookies[SESSION_COOKIE_NAME];
    if (!rawToken) {
      return next();
    }

    const tokenHash = hashToken(rawToken);
    const session = await prisma.session.findUnique({
      where: { sessionTokenHash: tokenHash },
      include: { user: true },
    });

    if (session && session.expiresAt >= new Date() && session.user.status !== UserStatus.SUSPENDED) {
      req.user = {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        status: session.user.status,
        createdAt: session.user.createdAt,
        updatedAt: session.user.updatedAt,
      };
      req.sessionId = session.id;
    }
  } catch {
    // Ignore errors for optional auth
  }
  next();
}

/**
 * Middleware: Role-Based Access Control.
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access forbidden: requires one of [${allowedRoles.join(', ')}] role`,
          undefined,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}
