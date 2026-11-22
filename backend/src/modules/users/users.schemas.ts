import { z } from 'zod';

export const updateProfileSchema = z.object({
  headline: z.string().trim().max(120).optional().nullable(),
  bio: z.string().trim().max(2000).optional().nullable(),
  skills: z.array(z.string().trim().min(1).max(50)).optional(),
  location: z.string().trim().max(100).optional().nullable(),
  defaultResumeFileId: z.string().uuid().optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
