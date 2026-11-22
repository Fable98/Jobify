import { prisma } from '../../utils/prisma';
import { AuthenticatedUser } from '../../middleware/auth';
import { ApplicationStatus, JobStatus } from '@prisma/client';

export class StatsService {
  async getJobSeekerStats(user: AuthenticatedUser) {
    const [applications, savedJobsCount] = await Promise.all([
      prisma.application.findMany({
        where: { applicantId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          job: {
            select: { id: true, title: true, company: { select: { name: true } } },
          },
        },
      }),
      prisma.savedJob.count({
        where: { userId: user.id },
      }),
    ]);

    const applicationsByStatus: Record<ApplicationStatus, number> = {
      [ApplicationStatus.PENDING]: 0,
      [ApplicationStatus.REVIEWING]: 0,
      [ApplicationStatus.SHORTLISTED]: 0,
      [ApplicationStatus.REJECTED]: 0,
      [ApplicationStatus.ACCEPTED]: 0,
      [ApplicationStatus.WITHDRAWN]: 0,
    };

    applications.forEach((app) => {
      applicationsByStatus[app.status] = (applicationsByStatus[app.status] || 0) + 1;
    });

    const activeApplications =
      applicationsByStatus[ApplicationStatus.PENDING] +
      applicationsByStatus[ApplicationStatus.REVIEWING] +
      applicationsByStatus[ApplicationStatus.SHORTLISTED];

    return {
      appliedCount: applications.length,
      activeApplications,
      shortlistedCount: applicationsByStatus[ApplicationStatus.SHORTLISTED],
      acceptedCount: applicationsByStatus[ApplicationStatus.ACCEPTED],
      savedJobsCount,
      applicationsByStatus,
      recentApplications: applications.slice(0, 5),
    };
  }

  async getEmployerStats(user: AuthenticatedUser) {
    // Find all companies where user is member
    const memberships = await prisma.companyMember.findMany({
      where: { userId: user.id },
      select: { companyId: true },
    });

    const companyIds = memberships.map((m) => m.companyId);

    const [jobs, applications] = await Promise.all([
      prisma.job.findMany({
        where: { companyId: { in: companyIds } },
        include: {
          _count: { select: { applications: true } },
        },
      }),
      prisma.application.findMany({
        where: { job: { companyId: { in: companyIds } } },
        orderBy: { createdAt: 'desc' },
        include: {
          job: { select: { id: true, title: true } },
          applicant: { select: { id: true, email: true } },
        },
      }),
    ]);

    const activeJobsCount = jobs.filter((j) => j.status === JobStatus.PUBLISHED).length;
    const draftJobsCount = jobs.filter((j) => j.status === JobStatus.DRAFT).length;
    const totalJobsCount = jobs.length;

    let pendingReviewCount = 0;
    let shortlistedCount = 0;
    let hiresCount = 0;

    applications.forEach((app) => {
      if (app.status === ApplicationStatus.PENDING) pendingReviewCount++;
      if (app.status === ApplicationStatus.SHORTLISTED) shortlistedCount++;
      if (app.status === ApplicationStatus.ACCEPTED) hiresCount++;
    });

    const applicantsByJob = jobs.map((j) => ({
      jobId: j.id,
      title: j.title,
      status: j.status,
      applicantsCount: j._count.applications,
    }));

    return {
      activeJobsCount,
      draftJobsCount,
      totalJobsCount,
      totalApplicantsCount: applications.length,
      pendingReviewCount,
      shortlistedCount,
      hiresCount,
      applicantsByJob,
      recentApplications: applications.slice(0, 5),
    };
  }
}

export const statsService = new StatsService();
