import { Response } from 'express';
import { prisma } from '../../utils/prisma';
import {
  generateRandomToken,
  hashToken,
  hashPassword,
  verifyPassword,
  DUMMY_ARGON2_HASH,
} from '../../utils/crypto';
import {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '../../utils/errors';
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_MS,
} from '../../middleware/auth';
import { env } from '../../config/env';
import { redisService } from '../../utils/redis';
import { emailService } from '../email/email.service';
import { RegisterInput, LoginInput, UserResponse } from './auth.types';
import { UserStatus } from '@prisma/client';

export class AuthService {
  private setSessionCookie(res: Response, token: string): void {
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_MS,
    });
  }

  private clearSessionCookie(res: Response): void {
    res.clearCookie(SESSION_COOKIE_NAME, {
      path: '/',
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  async register(input: RegisterInput, res: Response): Promise<{ user: UserResponse }> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictError('Email is already registered', undefined, 'USER_ALREADY_EXISTS');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: input.role,
        status: UserStatus.ACTIVE,
        ...(input.role === 'JOB_SEEKER'
          ? {
              profile: {
                create: {
                  headline: input.name ? `${input.name}` : undefined,
                  skills: [],
                },
              },
            }
          : {}),
      },
    });

    // Create session in DB
    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

    const session = await prisma.session.create({
      data: {
        sessionTokenHash: tokenHash,
        userId: user.id,
        expiresAt,
      },
      include: {
        user: true,
      },
    });

    // Cache in Redis for sub-millisecond lookup
    const ttlSeconds = Math.max(1, Math.floor(SESSION_MAX_AGE_MS / 1000));
    await redisService.set(`jobify:session:${tokenHash}`, JSON.stringify(session), ttlSeconds);

    this.setSessionCookie(res, rawToken);

    // Send transactional welcome email asynchronously
    emailService.sendWelcomeEmail(user.email, input.name || user.email.split('@')[0]).catch(() => {});

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    };
  }

  async login(
    input: LoginInput,
    res: Response,
    existingCookieToken?: string
  ): Promise<{ user: UserResponse }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      // Constant-time failure path
      await verifyPassword(DUMMY_ARGON2_HASH, input.password);
      throw new UnauthorizedError('Invalid email or password', undefined, 'INVALID_CREDENTIALS');
    }

    if (user.status === UserStatus.SUSPENDED) {
      // Account suspended
      throw new ForbiddenError('Account has been suspended. Please contact support.', undefined, 'USER_SUSPENDED');
    }

    const isValid = await verifyPassword(user.passwordHash, input.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password', undefined, 'INVALID_CREDENTIALS');
    }

    // Session rotation on login: delete old session if present
    if (existingCookieToken) {
      const oldHash = hashToken(existingCookieToken);
      await redisService.del(`jobify:session:${oldHash}`);
      await prisma.session.deleteMany({
        where: { sessionTokenHash: oldHash },
      }).catch(() => {});
    }

    // Issue new session
    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

    const session = await prisma.session.create({
      data: {
        sessionTokenHash: tokenHash,
        userId: user.id,
        expiresAt,
      },
      include: {
        user: true,
      },
    });

    // Cache in Redis
    const ttlSeconds = Math.max(1, Math.floor(SESSION_MAX_AGE_MS / 1000));
    await redisService.set(`jobify:session:${tokenHash}`, JSON.stringify(session), ttlSeconds);

    this.setSessionCookie(res, rawToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    };
  }

  async logout(res: Response, cookieToken?: string): Promise<void> {
    if (cookieToken) {
      const tokenHash = hashToken(cookieToken);
      await redisService.del(`jobify:session:${tokenHash}`);
      await prisma.session.deleteMany({
        where: { sessionTokenHash: tokenHash },
      }).catch(() => {});
    }
    this.clearSessionCookie(res);
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          include: {
            defaultResume: true,
          },
        },
        companyMemberships: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return { user };
  }

  async changePassword(
    userId: string,
    currentSessionId: string | undefined,
    input: { currentPassword: string; newPassword: string }
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValid = await verifyPassword(user.passwordHash, input.currentPassword);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect', undefined, 'INVALID_CURRENT_PASSWORD');
    }

    const newHash = await hashPassword(input.newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Invalidate sessions in Redis and DB
    if (currentSessionId) {
      const otherSessions = await prisma.session.findMany({
        where: {
          userId,
          id: { not: currentSessionId },
        },
        select: { sessionTokenHash: true },
      });
      for (const s of otherSessions) {
        await redisService.del(`jobify:session:${s.sessionTokenHash}`);
      }
      await prisma.session.deleteMany({
        where: {
          userId,
          id: { not: currentSessionId },
        },
      });
    } else {
      const allSessions = await prisma.session.findMany({
        where: { userId },
        select: { sessionTokenHash: true },
      });
      for (const s of allSessions) {
        await redisService.del(`jobify:session:${s.sessionTokenHash}`);
      }
      await prisma.session.deleteMany({
        where: { userId },
      });
    }
  }
}

export const authService = new AuthService();
