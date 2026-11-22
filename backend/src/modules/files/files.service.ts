import crypto from 'crypto';
import path from 'path';
import { prisma } from '../../utils/prisma';
import { storageProvider } from './storage';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../utils/errors';
import { AuthenticatedUser } from '../../middleware/auth';
import { FilePurpose, Role } from '@prisma/client';

export function validatePdfBytes(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 4) return false;
  // %PDF in ASCII: 0x25, 0x50, 0x44, 0x46
  return (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  );
}

export class FilesService {
  async uploadResume(
    user: AuthenticatedUser,
    file: Express.Multer.File | undefined,
    setAsDefault = true
  ) {
    if (!file) {
      throw new BadRequestError('No file provided for upload');
    }

    // 1. Validate file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf') {
      throw new BadRequestError('Only PDF files (.pdf) are accepted', undefined, 'INVALID_FILE_TYPE');
    }

    // 2. Validate magic bytes (never trust client MIME)
    if (!validatePdfBytes(file.buffer)) {
      throw new BadRequestError('File content is not a valid PDF document', undefined, 'INVALID_FILE_SIGNATURE');
    }

    // 3. Generate random storage key
    const storageKey = `${crypto.randomUUID()}.pdf`;

    // 4. Save to storage provider
    await storageProvider.save(storageKey, file.buffer, 'application/pdf');

    // 5. Save metadata in DB
    const storedFile = await prisma.storedFile.create({
      data: {
        ownerId: user.id,
        storageKey,
        originalName: file.originalname,
        mimeType: 'application/pdf',
        sizeBytes: file.size,
        purpose: FilePurpose.RESUME,
      },
    });

    // 6. Update user's default resume if requested
    if (setAsDefault) {
      await prisma.jobSeekerProfile.upsert({
        where: { userId: user.id },
        update: { defaultResumeFileId: storedFile.id },
        create: {
          userId: user.id,
          defaultResumeFileId: storedFile.id,
        },
      });
    }

    return { file: storedFile };
  }

  async getFileForStreaming(fileId: string, user: AuthenticatedUser) {
    const file = await prisma.storedFile.findUnique({
      where: { id: fileId },
      include: {
        applicationsAsResume: {
          include: {
            job: {
              include: {
                company: {
                  include: { members: true },
                },
              },
            },
          },
        },
      },
    });

    if (!file) {
      throw new NotFoundError('File not found');
    }

    // Authorization check:
    // 1. Owner
    const isOwner = file.ownerId === user.id;

    // 2. Admin
    const isAdmin = user.role === Role.ADMIN;

    // 3. Employer/Recruiter of a company where an application used this resume
    const isAuthorizedEmployer = file.applicationsAsResume.some((app) =>
      app.job.company.members.some((m) => m.userId === user.id)
    );

    if (!isOwner && !isAdmin && !isAuthorizedEmployer) {
      throw new ForbiddenError('Access denied: You do not have permission to view or download this file');
    }

    const { stream, sizeBytes } = await storageProvider.stream(file.storageKey);

    return {
      stream,
      originalName: file.originalName,
      sizeBytes,
      mimeType: file.mimeType,
    };
  }

  async deleteFile(fileId: string, user: AuthenticatedUser) {
    const file = await prisma.storedFile.findUnique({
      where: { id: fileId },
      include: {
        applicationsAsResume: true,
      },
    });

    if (!file) {
      throw new NotFoundError('File not found');
    }

    if (file.ownerId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenError('Only the file owner or admin can delete this file');
    }

    if (file.applicationsAsResume.length > 0) {
      throw new BadRequestError('Cannot delete a resume that has active applications submitted with it');
    }

    await storageProvider.delete(file.storageKey);
    await prisma.storedFile.delete({ where: { id: fileId } });

    return { message: 'File deleted successfully' };
  }
}

export const filesService = new FilesService();
