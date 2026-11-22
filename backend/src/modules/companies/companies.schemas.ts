import { z } from 'zod';
import { CompanyMemberRole } from '@prisma/client';

export const createCompanySchema = z.object({
  name: z.string().trim().min(2, 'Company name must be at least 2 characters').max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be alphanumeric words separated by single hyphens')
    .optional(),
  description: z.string().trim().max(3000).optional().nullable(),
  website: z.string().trim().url('Invalid website URL').optional().nullable(),
  industry: z.string().trim().max(100).optional().nullable(),
  location: z.string().trim().max(100).optional().nullable(),
  logoUrl: z.string().trim().url('Invalid logo URL').optional().nullable(),
});

export const updateCompanySchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(3000).optional().nullable(),
  website: z.string().trim().url('Invalid website URL').optional().nullable(),
  industry: z.string().trim().max(100).optional().nullable(),
  location: z.string().trim().max(100).optional().nullable(),
  logoUrl: z.string().trim().url('Invalid logo URL').optional().nullable(),
});

export const addMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  role: z.enum([CompanyMemberRole.OWNER, CompanyMemberRole.RECRUITER], {
    errorMap: () => ({ message: 'Role must be either OWNER or RECRUITER' }),
  }),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum([CompanyMemberRole.OWNER, CompanyMemberRole.RECRUITER], {
    errorMap: () => ({ message: 'Role must be either OWNER or RECRUITER' }),
  }),
});

export const listCompaniesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  search: z.string().trim().optional(),
  industry: z.string().trim().optional(),
});
