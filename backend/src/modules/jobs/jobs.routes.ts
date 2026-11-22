import { Router } from 'express';
import { jobsController } from './jobs.controller';
import { requireAuth, optionalAuth, requireRole } from '../../middleware/auth';
import { csrfProtection } from '../../middleware/csrf';
import { Role } from '@prisma/client';

export const jobsRouter = Router();

// Public routes
jobsRouter.get('/', jobsController.listPublicJobs);

// Employer jobs endpoint (all statuses for employer's companies)
jobsRouter.get(
  '/employer/all',
  requireAuth,
  requireRole(Role.EMPLOYER, Role.ADMIN),
  jobsController.getEmployerJobs
);

jobsRouter.get('/:id', optionalAuth, jobsController.getJobById);

// Protected routes
jobsRouter.post(
  '/',
  requireAuth,
  requireRole(Role.EMPLOYER, Role.ADMIN),
  csrfProtection,
  jobsController.createJob
);

jobsRouter.patch(
  '/:id',
  requireAuth,
  requireRole(Role.EMPLOYER, Role.ADMIN),
  csrfProtection,
  jobsController.updateJob
);

jobsRouter.delete(
  '/:id',
  requireAuth,
  requireRole(Role.EMPLOYER, Role.ADMIN),
  csrfProtection,
  jobsController.deleteJob
);
