import { prisma } from '../../utils/prisma';
import { NotFoundError } from '../../utils/errors';
import { UpdateProfileInput } from './users.schemas';

export class UsersService {
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          include: {
            defaultResume: true,
          },
        },
        companyMemberships: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return { user };
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updatedProfile = await prisma.jobSeekerProfile.upsert({
      where: { userId },
      update: {
        headline: input.headline !== undefined ? input.headline : undefined,
        bio: input.bio !== undefined ? input.bio : undefined,
        skills: input.skills !== undefined ? input.skills : undefined,
        location: input.location !== undefined ? input.location : undefined,
        defaultResumeFileId: input.defaultResumeFileId !== undefined ? input.defaultResumeFileId : undefined,
      },
      create: {
        userId,
        headline: input.headline ?? undefined,
        bio: input.bio ?? undefined,
        skills: input.skills ?? [],
        location: input.location ?? undefined,
        defaultResumeFileId: input.defaultResumeFileId ?? undefined,
      },
      include: {
        defaultResume: true,
      },
    });

    return { profile: updatedProfile };
  }

  async exportUserData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: { defaultResume: true },
        },
        applications: {
          include: {
            job: {
              select: {
                title: true,
                company: { select: { name: true } },
              },
            },
          },
        },
        savedJobs: {
          include: {
            job: {
              select: {
                title: true,
                company: { select: { name: true } },
              },
            },
          },
        },
        files: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Exclude passwordHash from export (GDPR data export compliance)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUserData } = user;
    return { exportData: safeUserData, exportedAt: new Date().toISOString() };
  }
}

export const usersService = new UsersService();
