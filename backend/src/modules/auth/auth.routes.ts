import { Router } from 'express';
import { authController } from './auth.controller';
import { requireAuth } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rate-limiter';
import { csrfProtection } from '../../middleware/csrf';

export const authRouter = Router();

authRouter.post('/register', csrfProtection, authRateLimiter, authController.register);
authRouter.post('/login', csrfProtection, authRateLimiter, authController.login);
authRouter.post('/logout', csrfProtection, authController.logout);
authRouter.get('/me', requireAuth, authController.me);
authRouter.patch('/password', requireAuth, csrfProtection, authController.changePassword);
