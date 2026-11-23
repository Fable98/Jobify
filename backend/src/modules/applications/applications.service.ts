import { prisma } from '../../utils/prisma';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from '../../utils/errors';
import { emailService } from '../email/email.service';
import {
  ApplyJobInput,
  UpdateApplicationStatusInput,
  ListEmployerApplicationsQuery,
} from './applications.types';
import { AuthenticatedUser } from '../../middleware/auth';
import { ApplicationStatus, JobStatus, Role } from '@prisma/client';

const ALLOWED_EMPLOYER_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.PENDING]: [ApplicationStatus.REVIEWING, ApplicationStatus.REJECTED],
  [ApplicationStatus.REVIEWING]: [ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED],
  [ApplicationStatus.SHORTLISTED]: [ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED],
  [ApplicationStatus.ACCEPTED]: [],
  [ApplicationStatus.REJECTED]: [],
  [ApplicationStatus.WITHDRAWN]: [],
};

export class ApplicationsService {
  async applyToJob(jobId: string, user: AuthenticatedUser, input: ApplyJobInput) {
    if (user.role !== Role.JOB_SEEKER) {
      throw new ForbiddenError('Only job seekers can apply for jobs');
    }

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

    // 1. Only apply to PUBLISHED jobs
    if (job.status !== JobStatus.PUBLISHED) {
      throw new BadRequestError('Applications are only accepted for PUBLISHED jobs', undefined, 'JOB_NOT_PUBLISHED');
    }

    // 2. Application deadline check
    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
      throw new BadRequestError('The application deadline for this job has passed', undefined, 'DEADLINE_PASSED');
    }

    // 3. Cannot apply to a job of a company you belong to
    const isMemberOfCompany = job.company.members.some((m) => m.userId === user.id);
    if (isMemberOfCompany) {
      throw new BadRequestError('You cannot apply to a job posted by your own company', undefined, 'CANNOT_APPLY_TO_OWN_COMPANY');
    }

    // 4. Validate resume file ownership
    const resumeFile = await prisma.storedFile.findUnique({
      where: { id: input.resumeFileId },
    });

    if (!resumeFile || resumeFile.ownerId !== user.id) {
      throw new BadRequestError('Invalid resume file: you may only submit your own uploaded resume');
    }

    // 5. Duplicate application check
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_applicantId: {
          jobId,
          applicantId: user.id,
        },
      },
    });

    if (existingApplication) {
      throw new ConflictError('You have already applied for this job', undefined, 'ALREADY_APPLIED');
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        applicantId: user.id,
        resumeFileId: input.resumeFileId,
        coverLetter: input.coverLetter ?? undefined,
        status: ApplicationStatus.PENDING,
      },
      include: {
        job: {
          include: {
            company: {
              select: { id: true, name: true, slug: true, logoUrl: true },
            },
          },
        },
        resumeFile: true,
      },
    });

    // Dispatch confirmation email to applicant asynchronously
    emailService
      .sendApplicationSubmittedEmail(
        user.email,
        user.email.split('@')[0],
        job.title,
        job.company.name
      )
      .catch(() => {});

    // Dispatch alert to employer members asynchronously
    if (job.company.members && job.company.members.length > 0) {
      const ownerMember = job.company.members[0];
      prisma.user
        .findUnique({ where: { id: ownerMember.userId }, select: { email: true } })
        .then((recruiterUser) => {
          if (recruiterUser) {
            emailService.sendEmployerNewApplicationAlert(
              recruiterUser.email,
              recruiterUser.email.split('@')[0],
              user.email.split('@')[0],
              job.title
            );
          }
        })
        .catch(() => {});
    }

    return { application };
  }

  async getMyApplications(user: AuthenticatedUser) {
    const applications = await prisma.application.findMany({
      where: { applicantId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          include: {
            company: {
              select: { id: true, name: true, slug: true, logoUrl: true, location: true },
            },
          },
        },
        resumeFile: {
          select: { id: true, originalName: true, sizeBytes: true, createdAt: true },
        },
      },
    });

    return { applications };
  }

  async getApplicationById(id: string, user: AuthenticatedUser) {
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            company: {
              include: { members: true },
            },
          },
        },
        applicant: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        resumeFile: true,
      },
    });

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    const isApplicant = application.applicantId === user.id;
    const isCompanyMember = application.job.company.members.some((m) => m.userId === user.id);
    const isAdmin = user.role === Role.ADMIN;

    if (!isApplicant && !isCompanyMember && !isAdmin) {
      throw new ForbiddenError('Access denied: You do not have permission to view this application');
    }

    return { application };
  }

  async withdrawApplication(id: string, user: AuthenticatedUser) {
    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    if (application.applicantId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenError('You can only withdraw your own applications');
    }

    // Applicant may withdraw only from PENDING, REVIEWING, or SHORTLISTED
    const allowableStatuses: ApplicationStatus[] = [
      ApplicationStatus.PENDING,
      ApplicationStatus.REVIEWING,
      ApplicationStatus.SHORTLISTED,
    ];

    if (!allowableStatuses.includes(application.status)) {
      throw new BadRequestError(
        `Cannot withdraw application with status '${application.status}'`,
        undefined,
        'INVALID_WITHDRAWAL_STATUS'
      );
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { status: ApplicationStatus.WITHDRAWN },
    });

    return { application: updated };
  }

  async getEmployerApplications(user: AuthenticatedUser, query: ListEmployerApplicationsQuery) {
    const { page, pageSize, jobId, status } = query;
    const skip = (page - 1) * pageSize;

    // Find companies where user is member
    const memberships = await prisma.companyMember.findMany({
      where: { userId: user.id },
      select: { companyId: true },
    });

    const companyIds = memberships.map((m) => m.companyId);

    const where: any = {
      job: {
        companyId: { in: companyIds },
      },
    };

    if (jobId) {
      where.jobId = jobId;
    }

    if (status) {
      where.status = status;
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              location: true,
              employmentType: true,
              companyId: true,
            },
          },
          applicant: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  headline: true,
                  skills: true,
                  location: true,
                },
              },
            },
          },
          resumeFile: {
            select: {
              id: true,
              originalName: true,
              sizeBytes: true,
            },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    return {
      applications,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async updateApplicationStatus(
    id: string,
    user: AuthenticatedUser,
    input: UpdateApplicationStatusInput
  ) {
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            company: {
              include: { members: true },
            },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    if (user.role !== Role.ADMIN) {
      const isMember = application.job.company.members.some((m) => m.userId === user.id);
      if (!isMember) {
        throw new ForbiddenError('You do not have permission to review applications for this company');
      }
    }

    // Employers cannot set status to WITHDRAWN
    if (input.status === ApplicationStatus.WITHDRAWN) {
      throw new BadRequestError('Employers cannot mark an application as WITHDRAWN', undefined, 'INVALID_TRANSITION');
    }

    // State machine check
    const current = application.status;
    const target = input.status;

    if (current === target) {
      return { application };
    }

    const validNextStates = ALLOWED_EMPLOYER_TRANSITIONS[current] || [];
    if (!validNextStates.includes(target)) {
      throw new BadRequestError(
        `Invalid status transition from '${current}' to '${target}'. Allowed transitions: [${validNextStates.join(', ')}]`,
        undefined,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { status: target },
      include: {
        job: {
          select: { id: true, title: true },
        },
        applicant: {
          select: { id: true, email: true },
        },
      },
    });

    // Dispatch status update email to applicant asynchronously
    emailService
      .sendApplicationStatusUpdateEmail(
        updated.applicant.email,
        updated.applicant.email.split('@')[0],
        updated.job.title,
        application.job.company.name,
        target
      )
      .catch(() => {});

    return { application: updated };
  }
}

export const applicationsService = new ApplicationsService();
