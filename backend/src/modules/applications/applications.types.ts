import { z } from 'zod';
import {
  applyJobSchema,
  updateApplicationStatusSchema,
  listEmployerApplicationsQuerySchema,
} from './applications.schemas';

export type ApplyJobInput = z.infer<typeof applyJobSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
export type ListEmployerApplicationsQuery = z.infer<typeof listEmployerApplicationsQuerySchema>;
