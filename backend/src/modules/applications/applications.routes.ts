import { Router } from 'express';
import { applicationsController } from './applications.controller';
import { requireAuth, requireRole } from '../../middleware/auth';
import { csrfProtection } from '../../middleware/csrf';
import { Role } from '@prisma/client';

export const applicationsRouter = Router();

// Job Seeker endpoints
applicationsRouter.get('/my', requireAuth, applicationsController.getMyApplications);
applicationsRouter.get('/:id', requireAuth, applicationsController.getApplicationById);
applicationsRouter.patch(
  '/:id/withdraw',
  requireAuth,
  csrfProtection,
  applicationsController.withdrawApplication
);

// Employer endpoints
applicationsRouter.get(
  '/employer/all',
  requireAuth,
  requireRole(Role.EMPLOYER, Role.ADMIN),
  applicationsController.getEmployerApplications
);

applicationsRouter.patch(
  '/employer/:id/status',
  requireAuth,
  requireRole(Role.EMPLOYER, Role.ADMIN),
  csrfProtection,
  applicationsController.updateApplicationStatus
);
