import { z } from 'zod';
import { createJobSchema, updateJobSchema, listJobsQuerySchema } from './jobs.schemas';

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;
