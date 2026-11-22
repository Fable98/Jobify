import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';

export const applyJobSchema = z.object({
  resumeFileId: z.string().uuid('Invalid resume file ID'),
  coverLetter: z.string().trim().max(5000).optional().nullable(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
});

export const listEmployerApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  jobId: z.string().uuid().optional(),
  status: z.nativeEnum(ApplicationStatus).optional(),
});
