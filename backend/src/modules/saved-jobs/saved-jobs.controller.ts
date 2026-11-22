import { Request, Response, NextFunction } from 'express';
import { savedJobsService } from './saved-jobs.service';
import { saveJobSchema } from './saved-jobs.schemas';

export class SavedJobsController {
  async saveJob(req: Request, res: Response, next: NextFunction) {
    try {
      const jobId = (req.body.jobId || req.params.jobId) as string;
      const validated = saveJobSchema.parse({ jobId });
      const result = await savedJobsService.saveJob(validated.jobId, req.user!);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getSavedJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await savedJobsService.getSavedJobs(req.user!);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async unsaveJob(req: Request, res: Response, next: NextFunction) {
    try {
      const jobId = req.params.jobId as string;
      const result = await savedJobsService.unsaveJob(jobId, req.user!);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const savedJobsController = new SavedJobsController();
