import { z } from 'zod';

export const saveJobSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
});

export type SaveJobInput = z.infer<typeof saveJobSchema>;
