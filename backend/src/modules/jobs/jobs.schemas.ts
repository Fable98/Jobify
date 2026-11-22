import { z } from 'zod';
import { EmploymentType, ExperienceLevel, JobStatus } from '@prisma/client';

export const createJobSchema = z
  .object({
    companyId: z.string().uuid('Invalid company ID'),
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
    description: z.string().trim().min(10, 'Description must be at least 10 characters'),
    requirements: z.string().trim().min(10, 'Requirements must be at least 10 characters'),
    responsibilities: z.string().trim().min(10, 'Responsibilities must be at least 10 characters'),
    location: z.string().trim().min(2).max(100),
    employmentType: z.nativeEnum(EmploymentType),
    experienceLevel: z.nativeEnum(ExperienceLevel),
    salaryMin: z.coerce.number().positive().optional().nullable(),
    salaryMax: z.coerce.number().positive().optional().nullable(),
    salaryCurrency: z.string().trim().default('USD'),
    status: z.nativeEnum(JobStatus).default(JobStatus.DRAFT),
    applicationDeadline: z.coerce.date().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.salaryMin && data.salaryMax) {
        return data.salaryMin <= data.salaryMax;
      }
      return true;
    },
    {
      message: 'salaryMin must be less than or equal to salaryMax',
      path: ['salaryMax'],
    }
  );

export const updateJobSchema = z
  .object({
    title: z.string().trim().min(3).max(150).optional(),
    description: z.string().trim().min(10).optional(),
    requirements: z.string().trim().min(10).optional(),
    responsibilities: z.string().trim().min(10).optional(),
    location: z.string().trim().min(2).max(100).optional(),
    employmentType: z.nativeEnum(EmploymentType).optional(),
    experienceLevel: z.nativeEnum(ExperienceLevel).optional(),
    salaryMin: z.coerce.number().positive().optional().nullable(),
    salaryMax: z.coerce.number().positive().optional().nullable(),
    salaryCurrency: z.string().trim().optional(),
    status: z.nativeEnum(JobStatus).optional(),
    applicationDeadline: z.coerce.date().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.salaryMin && data.salaryMax) {
        return data.salaryMin <= data.salaryMax;
      }
      return true;
    },
    {
      message: 'salaryMin must be less than or equal to salaryMax',
      path: ['salaryMax'],
    }
  );

export const listJobsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  search: z.string().trim().optional(),
  location: z.string().trim().optional(),
  employmentType: z.union([z.nativeEnum(EmploymentType), z.array(z.nativeEnum(EmploymentType))]).optional(),
  experienceLevel: z.union([z.nativeEnum(ExperienceLevel), z.array(z.nativeEnum(ExperienceLevel))]).optional(),
  minSalary: z.coerce.number().positive().optional(),
  maxSalary: z.coerce.number().positive().optional(),
  companyId: z.string().uuid().optional(),
  sortBy: z.enum(['publishedAt', 'createdAt', 'salaryMax', 'salaryMin', 'title']).default('publishedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
