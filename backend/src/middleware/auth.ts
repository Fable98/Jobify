import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { hashToken } from '../utils/crypto';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { redisService } from '../utils/redis';
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
 * Uses Cache-Aside with Redis for sub-millisecond session authentication.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const rawToken = req.cookies[SESSION_COOKIE_NAME];
    if (!rawToken) {
      throw new UnauthorizedError('Authentication required: no active session', undefined, 'UNAUTHORIZED');
    }

    const tokenHash = hashToken(rawToken);
    const redisKey = `jobify:session:${tokenHash}`;

    let session: any = null;
    const cached = await redisService.get(redisKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        parsed.expiresAt = new Date(parsed.expiresAt);
        parsed.lastActiveAt = new Date(parsed.lastActiveAt);
        parsed.user.createdAt = new Date(parsed.user.createdAt);
        parsed.user.updatedAt = new Date(parsed.user.updatedAt);
        session = parsed;
      } catch {
        session = null;
      }
    }

    if (!session) {
      session = await prisma.session.findUnique({
        where: { sessionTokenHash: tokenHash },
        include: {
          user: true,
        },
      });

      if (session && session.user.status !== UserStatus.SUSPENDED) {
        const ttlSeconds = Math.max(1, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
        await redisService.set(redisKey, JSON.stringify(session), ttlSeconds);
      }
    }

    if (!session) {
      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
      throw new UnauthorizedError('Invalid or expired session', undefined, 'INVALID_SESSION');
    }

    const now = new Date();

    // Check expiry
    if (session.expiresAt < now) {
      await redisService.del(redisKey);
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
      throw new UnauthorizedError('Session expired, please log in again', undefined, 'SESSION_EXPIRED');
    }

    // Check idle timeout
    const idleTime = now.getTime() - session.lastActiveAt.getTime();
    if (idleTime > SESSION_IDLE_TIMEOUT_MS) {
      await redisService.del(redisKey);
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
      throw new UnauthorizedError('Session timed out due to inactivity', undefined, 'SESSION_IDLE_TIMEOUT');
    }

    // Check suspended user status
    if (session.user.status === UserStatus.SUSPENDED) {
      await redisService.del(redisKey);
      await prisma.session.deleteMany({ where: { userId: session.user.id } }).catch(() => {});
      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
      throw new ForbiddenError('Account is suspended. Access denied.', undefined, 'USER_SUSPENDED');
    }

    // Refresh last active timestamp if older than 1 minute to avoid excessive writes
    if (idleTime > 60 * 1000) {
      session.lastActiveAt = now;
      await prisma.session.update({
        where: { id: session.id },
        data: { lastActiveAt: now },
      }).catch(() => {});
      const ttlSeconds = Math.max(1, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
      await redisService.set(redisKey, JSON.stringify(session), ttlSeconds);
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
    const redisKey = `jobify:session:${tokenHash}`;

    let session: any = null;
    const cached = await redisService.get(redisKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        parsed.expiresAt = new Date(parsed.expiresAt);
        session = parsed;
      } catch {
        session = null;
      }
    }

    if (!session) {
      session = await prisma.session.findUnique({
        where: { sessionTokenHash: tokenHash },
        include: { user: true },
      });
    }

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
