import { prisma } from '../../utils/prisma';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { AuthenticatedUser } from '../../middleware/auth';
import { JobStatus } from '@prisma/client';

export class SavedJobsService {
  async saveJob(jobId: string, user: AuthenticatedUser) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job || job.status !== JobStatus.PUBLISHED) {
      throw new NotFoundError('Job not found or not currently active');
    }

    const existing = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: user.id,
          jobId,
        },
      },
    });

    if (existing) {
      throw new ConflictError('Job is already saved in your favorites');
    }

    const saved = await prisma.savedJob.create({
      data: {
        userId: user.id,
        jobId,
      },
      include: {
        job: {
          include: {
            company: {
              select: { id: true, name: true, slug: true, logoUrl: true, location: true },
            },
          },
        },
      },
    });

    return { savedJob: saved };
  }

  async getSavedJobs(user: AuthenticatedUser) {
    const savedJobs = await prisma.savedJob.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          include: {
            company: {
              select: { id: true, name: true, slug: true, logoUrl: true, location: true, verified: true },
            },
            _count: {
              select: { applications: true },
            },
          },
        },
      },
    });

    return { savedJobs };
  }

  async unsaveJob(jobId: string, user: AuthenticatedUser) {
    const existing = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: user.id,
          jobId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('Saved job record not found');
    }

    await prisma.savedJob.delete({
      where: {
        userId_jobId: {
          userId: user.id,
          jobId,
        },
      },
    });

    return { message: 'Job removed from saved list' };
  }
}

export const savedJobsService = new SavedJobsService();
