import { Request, Response, NextFunction } from 'express';
import { statsService } from './stats.service';

export class StatsController {
  async getJobSeekerStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await statsService.getJobSeekerStats(req.user!);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getEmployerStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await statsService.getEmployerStats(req.user!);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const statsController = new StatsController();
