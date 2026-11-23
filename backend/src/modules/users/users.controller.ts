import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { updateProfileSchema } from './users.schemas';

export class UsersController {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.getMe(req.user!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateProfileSchema.parse(req.body);
      const result = await usersService.updateProfile(req.user!.id, validated);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async exportData(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.exportUserData(req.user!.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const usersController = new UsersController();
