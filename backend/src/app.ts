import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { ZodError } from 'zod';
import { env } from './config/env';
import { logger } from './utils/logger';
import { AppError } from './utils/errors';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { companiesRouter } from './modules/companies/companies.routes';
import { jobsRouter } from './modules/jobs/jobs.routes';
import { filesRouter } from './modules/files/files.routes';
import { applicationsRouter } from './modules/applications/applications.routes';
import { savedJobsRouter } from './modules/saved-jobs/saved-jobs.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { statsRouter } from './modules/stats/stats.routes';
import { jobsController } from './modules/jobs/jobs.controller';
import { applicationsController } from './modules/applications/applications.controller';
import { requireAuth, requireRole } from './middleware/auth';
import { csrfProtection } from './middleware/csrf';
import { Role } from '@prisma/client';

export const app = express();

// Request Correlation ID Middleware
app.use((req, res, next) => {
  const reqId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.headers['x-request-id'] = reqId;
  res.setHeader('X-Request-Id', reqId);
  next();
});

// Structured Request Logging (Pino)
if (env.NODE_ENV !== 'test') {
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req.headers['x-request-id'] as string) || crypto.randomUUID(),
      customLogLevel: (_req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    })
  );
}

app.use(helmet());
app.use(
  cors({
    origin: [env.CLIENT_ORIGIN],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Base health check
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({
    data: {
      status: 'ok',
      service: 'jobify-backend',
      timestamp: new Date().toISOString(),
    },
  });
});

// Mounted Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/companies', companiesRouter);
app.use('/api/v1/jobs', jobsRouter);
app.use('/api/v1/files', filesRouter);
app.use('/api/v1/applications', applicationsRouter);
app.use('/api/v1/saved-jobs', savedJobsRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/stats', statsRouter);

// Section 5 direct aliases:
// POST /api/v1/jobs/:jobId/apply
app.post(
  '/api/v1/jobs/:jobId/apply',
  requireAuth,
  csrfProtection,
  applicationsController.applyToJob
);

// GET /api/v1/employer/jobs
app.get(
  '/api/v1/employer/jobs',
  requireAuth,
  requireRole(Role.EMPLOYER, Role.ADMIN),
  jobsController.getEmployerJobs
);

// GET /api/v1/employer/applications
app.get(
  '/api/v1/employer/applications',
  requireAuth,
  requireRole(Role.EMPLOYER, Role.ADMIN),
  applicationsController.getEmployerApplications
);

// PATCH /api/v1/employer/applications/:id/status
app.patch(
  '/api/v1/employer/applications/:id/status',
  requireAuth,
  requireRole(Role.EMPLOYER, Role.ADMIN),
  csrfProtection,
  applicationsController.updateApplicationStatus
);

// 404 handler for unmatched routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint does not exist',
    },
  });
});

// Centralized error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.format(),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const message = err.message || 'An unexpected error occurred';

  if (statusCode === 500) {
    logger.error({ err, reqId: _req.headers['x-request-id'] }, 'Unhandled server error');
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(env.NODE_ENV !== 'production' && err.stack ? { stack: err.stack } : {}),
    },
  });
});
