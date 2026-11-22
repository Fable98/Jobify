import { FilePurpose } from '@prisma/client';

export interface StoredFileResponse {
  id: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  purpose: FilePurpose;
  createdAt: Date;
}
