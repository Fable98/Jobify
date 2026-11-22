import { Request, Response, NextFunction } from 'express';
import { companiesService } from './companies.service';
import {
  createCompanySchema,
  updateCompanySchema,
  addMemberSchema,
  updateMemberRoleSchema,
  listCompaniesQuerySchema,
} from './companies.schemas';

export class CompaniesController {
  async createCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createCompanySchema.parse(req.body);
      const result = await companiesService.createCompany(req.user!, validated);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async listCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = listCompaniesQuerySchema.parse(req.query);
      const result = await companiesService.listCompanies(validated);
      res.status(200).json({ data: result.companies, meta: result.meta });
    } catch (err) {
      next(err);
    }
  }

  async getCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const idOrSlug = req.params.id as string;
      const result = await companiesService.getCompany(idOrSlug, req.user);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateCompanySchema.parse(req.body);
      const id = req.params.id as string;
      const result = await companiesService.updateCompany(id, req.user!, validated);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getCompanyJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await companiesService.getCompanyJobs(id, req.user);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await companiesService.getMembers(id, req.user!);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = addMemberSchema.parse(req.body);
      const id = req.params.id as string;
      const result = await companiesService.addMember(id, req.user!, validated);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateMemberRoleSchema.parse(req.body);
      const id = req.params.id as string;
      const memberId = req.params.memberId as string;
      const result = await companiesService.updateMemberRole(
        id,
        req.user!,
        memberId,
        validated
      );
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const memberId = req.params.memberId as string;
      const result = await companiesService.removeMember(
        id,
        req.user!,
        memberId
      );
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const companiesController = new CompaniesController();
