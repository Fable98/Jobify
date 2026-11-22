import { prisma } from '../../utils/prisma';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import {
  listAdminUsersQuerySchema,
  updateUserStatusSchema,
  listAdminCompaniesQuerySchema,
  verifyCompanySchema,
  listAdminJobsQuerySchema,
  moderateJobSchema,
} from './admin.schemas';
import { z } from 'zod';
import { UserStatus } from '@prisma/client';

export class AdminService {
  async listUsers(query: z.infer<typeof listAdminUsersQuerySchema>) {
    const { page, pageSize, role, status, search } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          profile: { select: { headline: true } },
          companyMemberships: {
            include: { company: { select: { id: true, name: true, slug: true } } },
          },
          _count: { select: { applications: true, sessions: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async updateUserStatus(userId: string, input: z.infer<typeof updateUserStatusSchema>) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Protect self / system admin from being suspended accidentally
    if (user.email === 'admin@hirehub.dev' && input.status === UserStatus.SUSPENDED) {
      throw new BadRequestError('Cannot suspend the primary system administrator account');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: input.status },
      select: { id: true, email: true, role: true, status: true, updatedAt: true },
    });

    return { user: updated };
  }

  async listCompanies(query: z.infer<typeof listAdminCompaniesQuerySchema>) {
    const { page, pageSize, verified, search } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (verified !== undefined) where.verified = verified;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          members: {
            include: { user: { select: { id: true, email: true } } },
          },
          _count: {
            select: { jobs: true },
          },
        },
      }),
      prisma.company.count({ where }),
    ]);

    return {
      companies,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async verifyCompany(companyId: string, input: z.infer<typeof verifyCompanySchema>) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { verified: input.verified },
    });

    return { company: updated };
  }

  async listJobs(query: z.infer<typeof listAdminJobsQuerySchema>) {
    const { page, pageSize, status, search } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: { id: true, name: true, slug: true, verified: true },
          },
          _count: { select: { applications: true } },
        },
      }),
      prisma.job.count({ where }),
    ]);

    return {
      jobs,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async moderateJob(jobId: string, input: z.infer<typeof moderateJobSchema>) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: { status: input.status },
      include: {
        company: { select: { id: true, name: true, slug: true } },
      },
    });

    return { job: updated };
  }

  async listApplicationsMonitor(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          job: {
            select: { id: true, title: true, company: { select: { id: true, name: true } } },
          },
          applicant: {
            select: { id: true, email: true },
          },
        },
      }),
      prisma.application.count(),
    ]);

    return {
      applications,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async getAdminStats() {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - start;

    const [
      totalUsers,
      seekersCount,
      employersCount,
      adminsCount,
      suspendedUsersCount,
      totalCompanies,
      verifiedCompaniesCount,
      pendingVerificationCount,
      totalJobs,
      activeJobs,
      totalApplications,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'JOB_SEEKER' } }),
      prisma.user.count({ where: { role: 'EMPLOYER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.company.count(),
      prisma.company.count({ where: { verified: true } }),
      prisma.company.count({ where: { verified: false } }),
      prisma.job.count(),
      prisma.job.count({ where: { status: 'PUBLISHED' } }),
      prisma.application.count(),
    ]);

    return {
      stats: {
        totalUsers,
        usersByRole: {
          JOB_SEEKER: seekersCount,
          EMPLOYER: employersCount,
          ADMIN: adminsCount,
        },
        suspendedUsersCount,
        totalCompanies,
        verifiedCompaniesCount,
        pendingVerificationCount,
        totalJobs,
        activeJobs,
        totalApplications,
        systemHealth: {
          status: 'HEALTHY',
          dbLatencyMs,
          uptimeSeconds: Math.floor(process.uptime()),
        },
      },
    };
  }
}

export const adminService = new AdminService();
