import { Router } from 'express';
import { savedJobsController } from './saved-jobs.controller';
import { requireAuth } from '../../middleware/auth';
import { csrfProtection } from '../../middleware/csrf';

export const savedJobsRouter = Router();

savedJobsRouter.get('/', requireAuth, savedJobsController.getSavedJobs);
savedJobsRouter.post('/', requireAuth, csrfProtection, savedJobsController.saveJob);
savedJobsRouter.delete('/:jobId', requireAuth, csrfProtection, savedJobsController.unsaveJob);
