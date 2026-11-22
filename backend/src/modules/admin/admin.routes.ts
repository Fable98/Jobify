import { Router } from 'express';
import { adminController } from './admin.controller';
import { requireAuth, requireRole } from '../../middleware/auth';
import { csrfProtection } from '../../middleware/csrf';
import { Role } from '@prisma/client';

export const adminRouter = Router();

// Strictly ADMIN only
adminRouter.use(requireAuth, requireRole(Role.ADMIN));

adminRouter.get('/users', adminController.listUsers);
adminRouter.patch('/users/:id/status', csrfProtection, adminController.updateUserStatus);

adminRouter.get('/companies', adminController.listCompanies);
adminRouter.patch('/companies/:id/verify', csrfProtection, adminController.verifyCompany);

adminRouter.get('/jobs', adminController.listJobs);
adminRouter.patch('/jobs/:id/moderate', csrfProtection, adminController.moderateJob);

adminRouter.get('/applications', adminController.listApplications);
adminRouter.get('/stats', adminController.getAdminStats);
