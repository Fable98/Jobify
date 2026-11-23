import { Router } from 'express';
import { usersController } from './users.controller';
import { requireAuth } from '../../middleware/auth';
import { csrfProtection } from '../../middleware/csrf';

export const usersRouter = Router();

usersRouter.get('/me', requireAuth, usersController.getMe);
usersRouter.get('/me/export', requireAuth, usersController.exportData);
usersRouter.patch('/me', requireAuth, csrfProtection, usersController.updateProfile);
usersRouter.patch('/profile', requireAuth, csrfProtection, usersController.updateProfile);
