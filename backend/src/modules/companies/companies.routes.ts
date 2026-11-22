import { Router } from 'express';
import { companiesController } from './companies.controller';
import { requireAuth, optionalAuth, requireRole } from '../../middleware/auth';
import { csrfProtection } from '../../middleware/csrf';
import { Role } from '@prisma/client';

export const companiesRouter = Router();

// Public routes
companiesRouter.get('/', companiesController.listCompanies);
companiesRouter.get('/:id', optionalAuth, companiesController.getCompany);
companiesRouter.get('/:id/jobs', optionalAuth, companiesController.getCompanyJobs);

// Protected routes
companiesRouter.post(
  '/',
  requireAuth,
  requireRole(Role.EMPLOYER, Role.ADMIN),
  csrfProtection,
  companiesController.createCompany
);

companiesRouter.patch(
  '/:id',
  requireAuth,
  csrfProtection,
  companiesController.updateCompany
);

// Member management
companiesRouter.get('/:id/members', requireAuth, companiesController.getMembers);

companiesRouter.post(
  '/:id/members',
  requireAuth,
  csrfProtection,
  companiesController.addMember
);

companiesRouter.patch(
  '/:id/members/:memberId',
  requireAuth,
  csrfProtection,
  companiesController.updateMemberRole
);

companiesRouter.delete(
  '/:id/members/:memberId',
  requireAuth,
  csrfProtection,
  companiesController.removeMember
);
