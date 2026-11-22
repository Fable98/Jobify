import { z } from 'zod';
import { Role, UserStatus, JobStatus } from '@prisma/client';

export const listAdminUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  search: z.string().trim().optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export const listAdminCompaniesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  verified: z.coerce.boolean().optional(),
  search: z.string().trim().optional(),
});

export const verifyCompanySchema = z.object({
  verified: z.boolean(),
});

export const listAdminJobsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  status: z.nativeEnum(JobStatus).optional(),
  search: z.string().trim().optional(),
});

export const moderateJobSchema = z.object({
  status: z.nativeEnum(JobStatus),
});
