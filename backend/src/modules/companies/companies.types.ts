import { z } from 'zod';
import {
  createCompanySchema,
  updateCompanySchema,
  addMemberSchema,
  updateMemberRoleSchema,
  listCompaniesQuerySchema,
} from './companies.schemas';

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type ListCompaniesQuery = z.infer<typeof listCompaniesQuerySchema>;
