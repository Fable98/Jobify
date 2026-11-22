import { Request, Response, NextFunction } from 'express';
import { jobsService } from './jobs.service';
import { createJobSchema, updateJobSchema, listJobsQuerySchema } from './jobs.schemas';

export class JobsController {
  async createJob(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createJobSchema.parse(req.body);
      const result = await jobsService.createJob(req.user!, validated);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async listPublicJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = listJobsQuerySchema.parse(req.query);
      const result = await jobsService.listPublicJobs(validated);
      res.status(200).json({ data: result.jobs, meta: result.meta });
    } catch (err) {
      next(err);
    }
  }

  async getJobById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await jobsService.getJobById(id, req.user);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateJob(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateJobSchema.parse(req.body);
      const id = req.params.id as string;
      const result = await jobsService.updateJob(id, req.user!, validated);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async deleteJob(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await jobsService.deleteJob(id, req.user!);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getEmployerJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobsService.getEmployerJobs(req.user!);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const jobsController = new JobsController();
