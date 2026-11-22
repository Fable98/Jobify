import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import {
  listAdminUsersQuerySchema,
  updateUserStatusSchema,
  listAdminCompaniesQuerySchema,
  verifyCompanySchema,
  listAdminJobsQuerySchema,
  moderateJobSchema,
} from './admin.schemas';

export class AdminController {
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = listAdminUsersQuerySchema.parse(req.query);
      const result = await adminService.listUsers(validated);
      res.status(200).json({ data: result.users, meta: result.meta });
    } catch (err) {
      next(err);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const validated = updateUserStatusSchema.parse(req.body);
      const result = await adminService.updateUserStatus(id, validated);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async listCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = listAdminCompaniesQuerySchema.parse(req.query);
      const result = await adminService.listCompanies(validated);
      res.status(200).json({ data: result.companies, meta: result.meta });
    } catch (err) {
      next(err);
    }
  }

  async verifyCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const validated = verifyCompanySchema.parse(req.body);
      const result = await adminService.verifyCompany(id, validated);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async listJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = listAdminJobsQuerySchema.parse(req.query);
      const result = await adminService.listJobs(validated);
      res.status(200).json({ data: result.jobs, meta: result.meta });
    } catch (err) {
      next(err);
    }
  }

  async moderateJob(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const validated = moderateJobSchema.parse(req.body);
      const result = await adminService.moderateJob(id, validated);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async listApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 20;
      const result = await adminService.listApplicationsMonitor(page, pageSize);
      res.status(200).json({ data: result.applications, meta: result.meta });
    } catch (err) {
      next(err);
    }
  }

  async getAdminStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getAdminStats();
      res.status(200).json({ data: result.stats });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
