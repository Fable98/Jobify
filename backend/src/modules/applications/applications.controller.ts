import { Request, Response, NextFunction } from 'express';
import { applicationsService } from './applications.service';
import {
  applyJobSchema,
  updateApplicationStatusSchema,
  listEmployerApplicationsQuerySchema,
} from './applications.schemas';

export class ApplicationsController {
  async applyToJob(req: Request, res: Response, next: NextFunction) {
    try {
      const jobId = req.params.jobId as string;
      const validated = applyJobSchema.parse(req.body);
      const result = await applicationsService.applyToJob(jobId, req.user!, validated);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getMyApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await applicationsService.getMyApplications(req.user!);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getApplicationById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await applicationsService.getApplicationById(id, req.user!);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async withdrawApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await applicationsService.withdrawApplication(id, req.user!);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getEmployerApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = listEmployerApplicationsQuerySchema.parse(req.query);
      const result = await applicationsService.getEmployerApplications(req.user!, validated);
      res.status(200).json({ data: result.applications, meta: result.meta });
    } catch (err) {
      next(err);
    }
  }

  async updateApplicationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const validated = updateApplicationStatusSchema.parse(req.body);
      const result = await applicationsService.updateApplicationStatus(id, req.user!, validated);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const applicationsController = new ApplicationsController();
