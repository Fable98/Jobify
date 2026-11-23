import { prisma } from '../../utils/prisma';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../utils/errors';
import { CreateJobInput, UpdateJobInput, ListJobsQuery } from './jobs.types';
import { AuthenticatedUser } from '../../middleware/auth';
import { JobStatus, Role } from '@prisma/client';

export class JobsService {
  async createJob(user: AuthenticatedUser, input: CreateJobInput) {
    const company = await prisma.company.findUnique({
      where: { id: input.companyId },
      include: { members: true },
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    // RBAC: Must be OWNER, RECRUITER, or ADMIN
    if (user.role !== Role.ADMIN) {
      const isMember = company.members.some((m) => m.userId === user.id);
      if (!isMember) {
        throw new ForbiddenError('You do not have permission to post jobs for this company');
      }
    }

    // Verification check: Only verified companies can publish jobs
    if (input.status === JobStatus.PUBLISHED && !company.verified) {
      throw new ForbiddenError(
        'Only verified companies can publish jobs. Save as DRAFT until verification is granted.',
        undefined,
        'UNVERIFIED_COMPANY'
      );
    }

    const job = await prisma.job.create({
      data: {
        companyId: input.companyId,
        title: input.title,
        description: input.description,
        requirements: input.requirements,
        responsibilities: input.responsibilities,
        location: input.location,
        employmentType: input.employmentType,
        experienceLevel: input.experienceLevel,
        salaryMin: input.salaryMin ?? undefined,
        salaryMax: input.salaryMax ?? undefined,
        salaryCurrency: input.salaryCurrency || 'USD',
        status: input.status,
        publishedAt: input.status === JobStatus.PUBLISHED ? new Date() : null,
        applicationDeadline: input.applicationDeadline ?? undefined,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            verified: true,
          },
        },
      },
    });

    return { job };
  }

  async listPublicJobs(query: ListJobsQuery) {
    const {
      page,
      pageSize,
      search,
      location,
      employmentType,
      experienceLevel,
      minSalary,
      maxSalary,
      companyId,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * pageSize;

    const andConditions: any[] = [
      { status: JobStatus.PUBLISHED },
      { company: { verified: true } },
    ];

    if (search) {
      const terms = search.trim().split(/\s+/).filter(Boolean);
      for (const term of terms) {
        andConditions.push({
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { location: { contains: term, mode: 'insensitive' } },
            { company: { name: { contains: term, mode: 'insensitive' } } },
            { description: { contains: term, mode: 'insensitive' } },
            { requirements: { contains: term, mode: 'insensitive' } },
            { responsibilities: { contains: term, mode: 'insensitive' } },
          ],
        });
      }
    }

    if (location) {
      andConditions.push({ location: { contains: location, mode: 'insensitive' } });
    }

    if (employmentType) {
      andConditions.push({
        employmentType: Array.isArray(employmentType) ? { in: employmentType } : employmentType,
      });
    }

    if (experienceLevel) {
      andConditions.push({
        experienceLevel: Array.isArray(experienceLevel) ? { in: experienceLevel } : experienceLevel,
      });
    }

    if (companyId) {
      andConditions.push({ companyId });
    }

    // Salary range overlap:
    if (minSalary !== undefined) {
      andConditions.push({
        OR: [{ salaryMax: { gte: minSalary } }, { salaryMax: null }],
      });
    }
    if (maxSalary !== undefined) {
      andConditions.push({
        OR: [{ salaryMin: { lte: maxSalary } }, { salaryMin: null }],
      });
    }

    const where = { AND: andConditions };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              verified: true,
              location: true,
            },
          },
          _count: {
            select: { applications: true },
          },
        },
      }),
      prisma.job.count({ where }),
    ]);

    return {
      jobs,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getJobById(jobId: string, user?: AuthenticatedUser) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: {
          include: {
            members: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // If job is not PUBLISHED, only company members or ADMIN can view it (no existence leak!)
    if (job.status !== JobStatus.PUBLISHED) {
      const isMember = user ? job.company.members.some((m) => m.userId === user.id) : false;
      const isAdmin = user?.role === Role.ADMIN;
      if (!isMember && !isAdmin) {
        throw new NotFoundError('Job not found');
      }
    }

    const publicCompany = {
      id: job.company.id,
      name: job.company.name,
      slug: job.company.slug,
      logoUrl: job.company.logoUrl,
      verified: job.company.verified,
      location: job.company.location,
      website: job.company.website,
      industry: job.company.industry,
      description: job.company.description,
    };

    return {
      job: {
        ...job,
        company: publicCompany,
      },
    };
  }

  async updateJob(jobId: string, user: AuthenticatedUser, input: UpdateJobInput) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: {
          include: { members: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (user.role !== Role.ADMIN) {
      const isMember = job.company.members.some((m) => m.userId === user.id);
      if (!isMember) {
        throw new ForbiddenError('You do not have permission to edit this job');
      }
    }

    // If transitioning to PUBLISHED, verify company is verified
    if (input.status === JobStatus.PUBLISHED && !job.company.verified) {
      throw new ForbiddenError(
        'Only verified companies can publish jobs',
        undefined,
        'UNVERIFIED_COMPANY'
      );
    }

    const data: any = { ...input };
    if (input.status === JobStatus.PUBLISHED && !job.publishedAt) {
      data.publishedAt = new Date();
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            verified: true,
          },
        },
      },
    });

    return { job: updated };
  }

  async deleteJob(jobId: string, user: AuthenticatedUser) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: {
          include: { members: true },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (user.role !== Role.ADMIN) {
      const isMember = job.company.members.some((m) => m.userId === user.id);
      if (!isMember) {
        throw new ForbiddenError('You do not have permission to delete this job');
      }
    }

    // Rule: Deleting a job with applications is blocked (close it instead)
    if (job._count.applications > 0) {
      throw new BadRequestError(
        'Jobs with applications cannot be deleted. Please close the job instead.',
        undefined,
        'CANNOT_DELETE_JOB_WITH_APPLICATIONS'
      );
    }

    await prisma.job.delete({
      where: { id: jobId },
    });

    return { message: 'Job deleted successfully' };
  }

  async getEmployerJobs(user: AuthenticatedUser) {
    // Find all companies where user is OWNER or RECRUITER
    const memberships = await prisma.companyMember.findMany({
      where: { userId: user.id },
      select: { companyId: true },
    });

    const companyIds = memberships.map((m) => m.companyId);

    const jobs = await prisma.job.findMany({
      where: {
        companyId: { in: companyIds },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            verified: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    return { jobs };
  }
}

export const jobsService = new JobsService();
