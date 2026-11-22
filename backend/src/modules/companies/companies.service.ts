import { prisma } from '../../utils/prisma';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from '../../utils/errors';
import {
  CreateCompanyInput,
  UpdateCompanyInput,
  AddMemberInput,
  UpdateMemberRoleInput,
  ListCompaniesQuery,
} from './companies.types';
import { AuthenticatedUser } from '../../middleware/auth';
import { CompanyMemberRole, JobStatus, Role } from '@prisma/client';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export class CompaniesService {
  async createCompany(user: AuthenticatedUser, input: CreateCompanyInput) {
    let baseSlug = input.slug || slugify(input.name);
    if (!baseSlug) {
      baseSlug = `company-${Date.now()}`;
    }

    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.company.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const company = await prisma.$transaction(async (tx) => {
      const created = await tx.company.create({
        data: {
          name: input.name,
          slug: finalSlug,
          description: input.description ?? undefined,
          website: input.website ?? undefined,
          industry: input.industry ?? undefined,
          location: input.location ?? undefined,
          logoUrl: input.logoUrl ?? undefined,
          verified: false,
        },
      });

      await tx.companyMember.create({
        data: {
          userId: user.id,
          companyId: created.id,
          role: CompanyMemberRole.OWNER,
        },
      });

      return created;
    });

    return { company };
  }

  async listCompanies(query: ListCompaniesQuery) {
    const { page, pageSize, search, industry } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {
      // In public listing, show verified companies
      verified: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (industry) {
      where.industry = { contains: industry, mode: 'insensitive' };
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              jobs: {
                where: { status: JobStatus.PUBLISHED },
              },
            },
          },
        },
      }),
      prisma.company.count({ where }),
    ]);

    return {
      companies,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getCompany(idOrSlug: string, user?: AuthenticatedUser) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSlug);
    const company = await prisma.company.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
        _count: {
          select: {
            jobs: {
              where: { status: JobStatus.PUBLISHED },
            },
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    // Check visibility for unverified companies
    if (!company.verified) {
      const isMember = user ? company.members.some((m) => m.userId === user.id) : false;
      const isAdmin = user?.role === Role.ADMIN;
      if (!isMember && !isAdmin) {
        // Unverified company is not visible to public
        throw new NotFoundError('Company not found');
      }
    }

    return { company };
  }

  async updateCompany(id: string, user: AuthenticatedUser, input: UpdateCompanyInput) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    // Role check: Only OWNER or ADMIN can edit company details
    if (user.role !== Role.ADMIN) {
      const member = company.members.find((m) => m.userId === user.id);
      if (!member || member.role !== CompanyMemberRole.OWNER) {
        throw new ForbiddenError('Only company owners can update company details');
      }
    }

    const updated = await prisma.company.update({
      where: { id },
      data: {
        name: input.name !== undefined ? input.name : undefined,
        description: input.description !== undefined ? input.description : undefined,
        website: input.website !== undefined ? input.website : undefined,
        industry: input.industry !== undefined ? input.industry : undefined,
        location: input.location !== undefined ? input.location : undefined,
        logoUrl: input.logoUrl !== undefined ? input.logoUrl : undefined,
      },
    });

    return { company: updated };
  }

  async getCompanyJobs(companyId: string, user?: AuthenticatedUser) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { members: true },
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const isMember = user ? company.members.some((m) => m.userId === user.id) : false;
    const isAdmin = user?.role === Role.ADMIN;

    const where: any = { companyId };
    if (!isMember && !isAdmin) {
      where.status = JobStatus.PUBLISHED;
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    return { jobs };
  }

  async getMembers(companyId: string, user: AuthenticatedUser) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { members: true },
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const isMember = company.members.some((m) => m.userId === user.id);
    if (!isMember && user.role !== Role.ADMIN) {
      throw new ForbiddenError('Access denied: You must be a company member to view members');
    }

    const members = await prisma.companyMember.findMany({
      where: { companyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            createdAt: true,
            profile: {
              select: {
                headline: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return { members };
  }

  async addMember(companyId: string, user: AuthenticatedUser, input: AddMemberInput) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { members: true },
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    // Only OWNER or ADMIN can add members
    if (user.role !== Role.ADMIN) {
      const currentMember = company.members.find((m) => m.userId === user.id);
      if (!currentMember || currentMember.role !== CompanyMemberRole.OWNER) {
        throw new ForbiddenError('Only company owners can invite or add members');
      }
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!targetUser) {
      throw new NotFoundError('User with specified email not found');
    }

    if (targetUser.role !== Role.EMPLOYER) {
      throw new BadRequestError('Only users with EMPLOYER role can be added to a company');
    }

    const alreadyMember = company.members.some((m) => m.userId === targetUser.id);
    if (alreadyMember) {
      throw new ConflictError('User is already a member of this company');
    }

    const newMember = await prisma.companyMember.create({
      data: {
        userId: targetUser.id,
        companyId,
        role: input.role,
      },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    return { member: newMember };
  }

  async updateMemberRole(
    companyId: string,
    user: AuthenticatedUser,
    memberId: string,
    input: UpdateMemberRoleInput
  ) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { members: true },
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    if (user.role !== Role.ADMIN) {
      const requester = company.members.find((m) => m.userId === user.id);
      if (!requester || requester.role !== CompanyMemberRole.OWNER) {
        throw new ForbiddenError('Only company owners can update member roles');
      }
    }

    const targetMember = await prisma.companyMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.companyId !== companyId) {
      throw new NotFoundError('Member not found in this company');
    }

    // Last-owner protection rule:
    if (targetMember.role === CompanyMemberRole.OWNER && input.role !== CompanyMemberRole.OWNER) {
      const otherOwnersCount = await prisma.companyMember.count({
        where: {
          companyId,
          role: CompanyMemberRole.OWNER,
          id: { not: memberId },
        },
      });

      if (otherOwnersCount === 0) {
        throw new BadRequestError(
          'A company must always have at least one owner',
          undefined,
          'LAST_OWNER_PROTECTION'
        );
      }
    }

    const updated = await prisma.companyMember.update({
      where: { id: memberId },
      data: { role: input.role },
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    return { member: updated };
  }

  async removeMember(companyId: string, user: AuthenticatedUser, memberId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { members: true },
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const targetMember = await prisma.companyMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.companyId !== companyId) {
      throw new NotFoundError('Member not found in this company');
    }

    const isSelf = targetMember.userId === user.id;
    const isOwner = company.members.some(
      (m) => m.userId === user.id && m.role === CompanyMemberRole.OWNER
    );

    if (!isSelf && !isOwner && user.role !== Role.ADMIN) {
      throw new ForbiddenError('Only company owners or the member themselves can remove memberships');
    }

    // Last-owner protection rule:
    if (targetMember.role === CompanyMemberRole.OWNER) {
      const otherOwnersCount = await prisma.companyMember.count({
        where: {
          companyId,
          role: CompanyMemberRole.OWNER,
          id: { not: memberId },
        },
      });

      if (otherOwnersCount === 0) {
        throw new BadRequestError(
          'Cannot remove the last owner of a company',
          undefined,
          'LAST_OWNER_PROTECTION'
        );
      }
    }

    await prisma.companyMember.delete({
      where: { id: memberId },
    });

    return { message: 'Member removed successfully' };
  }
}

export const companiesService = new CompaniesService();
