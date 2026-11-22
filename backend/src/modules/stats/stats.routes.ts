import { Router } from 'express';
import { statsController } from './stats.controller';
import { adminController } from '../admin/admin.controller';
import { requireAuth, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';

export const statsRouter = Router();

statsRouter.get(
  '/job-seeker',
  requireAuth,
  requireRole(Role.JOB_SEEKER, Role.ADMIN),
  statsController.getJobSeekerStats
);

statsRouter.get(
  '/employer',
  requireAuth,
  requireRole(Role.EMPLOYER, Role.ADMIN),
  statsController.getEmployerStats
);

statsRouter.get(
  '/admin',
  requireAuth,
  requireRole(Role.ADMIN),
  adminController.getAdminStats
);
