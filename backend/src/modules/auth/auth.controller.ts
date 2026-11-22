import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { registerSchema, loginSchema, changePasswordSchema } from './auth.schemas';
import { SESSION_COOKIE_NAME } from '../../middleware/auth';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await authService.register(validated, res);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const existingCookieToken = req.cookies[SESSION_COOKIE_NAME];
      const result = await authService.login(validated, res, existingCookieToken);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const cookieToken = req.cookies[SESSION_COOKIE_NAME];
      await authService.logout(res, cookieToken);
      res.status(200).json({ data: { message: 'Logged out successfully' } });
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.me(req.user!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = changePasswordSchema.parse(req.body);
      await authService.changePassword(req.user!.id, req.sessionId, validated);
      res.status(200).json({ data: { message: 'Password updated successfully' } });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
