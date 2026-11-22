import { z } from 'zod';
import { FilePurpose } from '@prisma/client';

export const uploadFileQuerySchema = z.object({
  purpose: z.nativeEnum(FilePurpose).default(FilePurpose.RESUME),
  setAsDefaultResume: z.coerce.boolean().default(true),
});

export type UploadFileQuery = z.infer<typeof uploadFileQuerySchema>;
