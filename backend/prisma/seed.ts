import { PrismaClient, Role, UserStatus, CompanyMemberRole, EmploymentType, ExperienceLevel, JobStatus, ApplicationStatus, FilePurpose } from '@prisma/client';
import argon2 from 'argon2';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Ensure upload directory and sample PDF file exist
  const uploadDir = path.resolve(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const samplePdfContent = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 72 712 Td (HireHub Sample Resume) ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000216 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n310\n%%EOF\n'
  );

  const sampleKey = 'sample-resume-uuid-key.pdf';
  fs.writeFileSync(path.join(uploadDir, sampleKey), samplePdfContent);

  // Hash standard passwords
  const adminPasswordHash = await argon2.hash('AdminPass123!', { type: argon2.argon2id });
  const employerPasswordHash = await argon2.hash('EmployerPass123!', { type: argon2.argon2id });
  const seekerPasswordHash = await argon2.hash('SeekerPass123!', { type: argon2.argon2id });

  // 1. Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hirehub.dev' },
    update: { passwordHash: adminPasswordHash, status: UserStatus.ACTIVE, role: Role.ADMIN },
    create: {
      email: 'admin@hirehub.dev',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // 2. Employers
  const sarahOwner = await prisma.user.upsert({
    where: { email: 'sarah.owner@techflow.example.com' },
    update: { passwordHash: employerPasswordHash, status: UserStatus.ACTIVE },
    create: {
      email: 'sarah.owner@techflow.example.com',
      passwordHash: employerPasswordHash,
      role: Role.EMPLOYER,
      status: UserStatus.ACTIVE,
    },
  });

  const daveRecruiter = await prisma.user.upsert({
    where: { email: 'dave.recruiter@techflow.example.com' },
    update: { passwordHash: employerPasswordHash, status: UserStatus.ACTIVE },
    create: {
      email: 'dave.recruiter@techflow.example.com',
      passwordHash: employerPasswordHash,
      role: Role.EMPLOYER,
      status: UserStatus.ACTIVE,
    },
  });

  const elenaOwner = await prisma.user.upsert({
    where: { email: 'elena.owner@acmecloud.example.com' },
    update: { passwordHash: employerPasswordHash, status: UserStatus.ACTIVE },
    create: {
      email: 'elena.owner@acmecloud.example.com',
      passwordHash: employerPasswordHash,
      role: Role.EMPLOYER,
      status: UserStatus.ACTIVE,
    },
  });

  const marcusOwner = await prisma.user.upsert({
    where: { email: 'marcus.owner@stealthai.example.com' },
    update: { passwordHash: employerPasswordHash, status: UserStatus.ACTIVE },
    create: {
      email: 'marcus.owner@stealthai.example.com',
      passwordHash: employerPasswordHash,
      role: Role.EMPLOYER,
      status: UserStatus.ACTIVE,
    },
  });

  // 3. Job Seekers
  const alexSeeker = await prisma.user.upsert({
    where: { email: 'alex.dev@hirehub.dev' },
    update: { passwordHash: seekerPasswordHash, status: UserStatus.ACTIVE },
    create: {
      email: 'alex.dev@hirehub.dev',
      passwordHash: seekerPasswordHash,
      role: Role.JOB_SEEKER,
      status: UserStatus.ACTIVE,
    },
  });

  const mayaSeeker = await prisma.user.upsert({
    where: { email: 'maya.designer@hirehub.dev' },
    update: { passwordHash: seekerPasswordHash, status: UserStatus.ACTIVE },
    create: {
      email: 'maya.designer@hirehub.dev',
      passwordHash: seekerPasswordHash,
      role: Role.JOB_SEEKER,
      status: UserStatus.ACTIVE,
    },
  });

  const jordanSeeker = await prisma.user.upsert({
    where: { email: 'jordan.cloud@hirehub.dev' },
    update: { passwordHash: seekerPasswordHash, status: UserStatus.ACTIVE },
    create: {
      email: 'jordan.cloud@hirehub.dev',
      passwordHash: seekerPasswordHash,
      role: Role.JOB_SEEKER,
      status: UserStatus.ACTIVE,
    },
  });

  const claireSeeker = await prisma.user.upsert({
    where: { email: 'claire.junior@hirehub.dev' },
    update: { passwordHash: seekerPasswordHash, status: UserStatus.ACTIVE },
    create: {
      email: 'claire.junior@hirehub.dev',
      passwordHash: seekerPasswordHash,
      role: Role.JOB_SEEKER,
      status: UserStatus.ACTIVE,
    },
  });

  const samSuspended = await prisma.user.upsert({
    where: { email: 'sam.suspended@hirehub.dev' },
    update: { passwordHash: seekerPasswordHash, status: UserStatus.SUSPENDED },
    create: {
      email: 'sam.suspended@hirehub.dev',
      passwordHash: seekerPasswordHash,
      role: Role.JOB_SEEKER,
      status: UserStatus.SUSPENDED,
    },
  });

  // 4. Stored Resume Files
  const alexResume = await prisma.storedFile.upsert({
    where: { storageKey: 'alex-resume-key.pdf' },
    update: {},
    create: {
      ownerId: alexSeeker.id,
      storageKey: 'alex-resume-key.pdf',
      originalName: 'Alex_Rivera_Resume.pdf',
      mimeType: 'application/pdf',
      sizeBytes: samplePdfContent.length,
      purpose: FilePurpose.RESUME,
    },
  });
  fs.writeFileSync(path.join(uploadDir, 'alex-resume-key.pdf'), samplePdfContent);

  const mayaResume = await prisma.storedFile.upsert({
    where: { storageKey: 'maya-resume-key.pdf' },
    update: {},
    create: {
      ownerId: mayaSeeker.id,
      storageKey: 'maya-resume-key.pdf',
      originalName: 'Maya_Chen_Portfolio_CV.pdf',
      mimeType: 'application/pdf',
      sizeBytes: samplePdfContent.length,
      purpose: FilePurpose.RESUME,
    },
  });
  fs.writeFileSync(path.join(uploadDir, 'maya-resume-key.pdf'), samplePdfContent);

  const jordanResume = await prisma.storedFile.upsert({
    where: { storageKey: 'jordan-resume-key.pdf' },
    update: {},
    create: {
      ownerId: jordanSeeker.id,
      storageKey: 'jordan-resume-key.pdf',
      originalName: 'Jordan_Smith_DevOps_Resume.pdf',
      mimeType: 'application/pdf',
      sizeBytes: samplePdfContent.length,
      purpose: FilePurpose.RESUME,
    },
  });
  fs.writeFileSync(path.join(uploadDir, 'jordan-resume-key.pdf'), samplePdfContent);

  const claireResume = await prisma.storedFile.upsert({
    where: { storageKey: 'claire-resume-key.pdf' },
    update: {},
    create: {
      ownerId: claireSeeker.id,
      storageKey: 'claire-resume-key.pdf',
      originalName: 'Claire_Vance_Resume.pdf',
      mimeType: 'application/pdf',
      sizeBytes: samplePdfContent.length,
      purpose: FilePurpose.RESUME,
    },
  });
  fs.writeFileSync(path.join(uploadDir, 'claire-resume-key.pdf'), samplePdfContent);

  // 5. Job Seeker Profiles
  await prisma.jobSeekerProfile.upsert({
    where: { userId: alexSeeker.id },
    update: {},
    create: {
      userId: alexSeeker.id,
      headline: 'Senior Full-Stack Engineer | TypeScript, React, Node.js',
      bio: '6+ years designing scalable cloud services, modern web apps, and distributed backends.',
      skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'GraphQL', 'Tailwind CSS'],
      location: 'San Francisco, CA',
      defaultResumeFileId: alexResume.id,
    },
  });

  await prisma.jobSeekerProfile.upsert({
    where: { userId: mayaSeeker.id },
    update: {},
    create: {
      userId: mayaSeeker.id,
      headline: 'Lead Product Designer & Design Systems Architect',
      bio: 'Passionate about crafting intuitive design systems, accessible UI, and delightful user experiences.',
      skills: ['Figma', 'Design Systems', 'UX Research', 'Prototyping', 'Accessibility (WCAG)'],
      location: 'New York, NY',
      defaultResumeFileId: mayaResume.id,
    },
  });

  await prisma.jobSeekerProfile.upsert({
    where: { userId: jordanSeeker.id },
    update: {},
    create: {
      userId: jordanSeeker.id,
      headline: 'Senior DevOps & Site Reliability Engineer',
      bio: 'Specialist in Kubernetes, Terraform, zero-downtime deployments, and cloud platform security.',
      skills: ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'GCP', 'Prometheus', 'CI/CD Pipelines'],
      location: 'Austin, TX',
      defaultResumeFileId: jordanResume.id,
    },
  });

  await prisma.jobSeekerProfile.upsert({
    where: { userId: claireSeeker.id },
    update: {},
    create: {
      userId: claireSeeker.id,
      headline: 'Junior Software Engineer | CS Graduate',
      bio: 'Enthusiastic developer eager to build performant web services and learn modern cloud stacks.',
      skills: ['JavaScript', 'TypeScript', 'React', 'Python', 'Git', 'SQL'],
      location: 'Seattle, WA',
      defaultResumeFileId: claireResume.id,
    },
  });

  // 6. Companies
  const techFlow = await prisma.company.upsert({
    where: { slug: 'techflow-solutions' },
    update: {},
    create: {
      name: 'TechFlow Solutions',
      slug: 'techflow-solutions',
      description: 'TechFlow Solutions is a fast-growing enterprise SaaS company modernizing collaborative workflow automation for global tech teams.',
      website: 'https://techflow.example.com',
      industry: 'Enterprise SaaS',
      location: 'San Francisco, CA',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80',
      verified: true,
    },
  });

  const acmeCloud = await prisma.company.upsert({
    where: { slug: 'acme-cloud-labs' },
    update: {},
    create: {
      name: 'Acme Cloud Labs',
      slug: 'acme-cloud-labs',
      description: 'Pioneering next-generation developer tooling, multi-cloud networking, and distributed AI infrastructure.',
      website: 'https://acmecloud.example.com',
      industry: 'Cloud Infrastructure',
      location: 'New York, NY',
      logoUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&q=80',
      verified: true,
    },
  });

  const stealthAI = await prisma.company.upsert({
    where: { slug: 'stealthai-corp' },
    update: { verified: false },
    create: {
      name: 'StealthAI Corp',
      slug: 'stealthai-corp',
      description: 'Building autonomous agent workflows and foundation model orchestration for heavy industrial engineering.',
      website: 'https://stealthai.example.com',
      industry: 'Artificial Intelligence',
      location: 'Austin, TX',
      logoUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=128&q=80',
      verified: false, // Unverified company test case
    },
  });

  // 7. Company Memberships
  await prisma.companyMember.upsert({
    where: { userId_companyId: { userId: sarahOwner.id, companyId: techFlow.id } },
    update: {},
    create: {
      userId: sarahOwner.id,
      companyId: techFlow.id,
      role: CompanyMemberRole.OWNER,
    },
  });

  await prisma.companyMember.upsert({
    where: { userId_companyId: { userId: daveRecruiter.id, companyId: techFlow.id } },
    update: {},
    create: {
      userId: daveRecruiter.id,
      companyId: techFlow.id,
      role: CompanyMemberRole.RECRUITER,
    },
  });

  await prisma.companyMember.upsert({
    where: { userId_companyId: { userId: elenaOwner.id, companyId: acmeCloud.id } },
    update: {},
    create: {
      userId: elenaOwner.id,
      companyId: acmeCloud.id,
      role: CompanyMemberRole.OWNER,
    },
  });

  await prisma.companyMember.upsert({
    where: { userId_companyId: { userId: marcusOwner.id, companyId: stealthAI.id } },
    update: {},
    create: {
      userId: marcusOwner.id,
      companyId: stealthAI.id,
      role: CompanyMemberRole.OWNER,
    },
  });

  // 8. Jobs
  // Clean existing jobs to keep seed deterministic
  await prisma.savedJob.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.job.deleteMany({});

  const techFlowJobs = [
    {
      title: 'Senior Full-Stack Engineer',
      description: 'Join our core platform engineering team to build high-throughput collaboration workflows and real-time canvas features.',
      requirements: '5+ years of full-stack engineering with TypeScript, React, Node.js, and PostgreSQL. Solid understanding of distributed web architectures.',
      responsibilities: 'Architect performant full-stack features, lead code reviews, mentor junior engineers, and improve system observability.',
      location: 'San Francisco, CA',
      employmentType: EmploymentType.FULL_TIME,
      experienceLevel: ExperienceLevel.SENIOR,
      salaryMin: 150000,
      salaryMax: 185000,
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    {
      title: 'Lead Distributed Systems Architect',
      description: 'Lead the architecture of our distributed state synchronization engine supporting millions of concurrent web sessions.',
      requirements: '8+ years engineering distributed systems, low-latency consensus, event streams, and relational data layers.',
      responsibilities: 'Define system architecture roadmaps, conduct performance benchmarking, and guide multi-region failover strategy.',
      location: 'San Francisco, CA',
      employmentType: EmploymentType.FULL_TIME,
      experienceLevel: ExperienceLevel.LEAD,
      salaryMin: 190000,
      salaryMax: 240000,
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 2 * 86400000),
    },
    {
      title: 'Engineering Manager - Platform',
      description: 'Lead and empower a team of 8 talented backend and infrastructure engineers building the backbone of TechFlow.',
      requirements: '3+ years engineering management experience plus prior hands-on background in cloud backend systems.',
      responsibilities: 'Sprint planning, career coaching, technical roadmap delivery, and hiring diverse engineering talent.',
      location: 'San Francisco, CA',
      employmentType: EmploymentType.FULL_TIME,
      experienceLevel: ExperienceLevel.LEAD,
      salaryMin: 195000,
      salaryMax: 230000,
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 4 * 86400000),
    },
    {
      title: 'QA Automation Engineer',
      description: 'Build end-to-end testing harnesses, performance regression suites, and automated verification pipelines for web and API services.',
      requirements: '3+ years in automated QA, Playwright/Cypress, Supertest/Vitest, and CI/CD integration.',
      responsibilities: 'Expand E2E test coverage, maintain integration test environments, and enforce quality standards.',
      location: 'San Francisco, CA',
      employmentType: EmploymentType.FULL_TIME,
      experienceLevel: ExperienceLevel.MID,
      salaryMin: 110000,
      salaryMax: 135000,
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 6 * 86400000),
    },
    {
      title: 'Entry-Level Software Developer',
      description: 'Kickstart your career working directly with senior mentors on customer-facing features, API endpoints, and database migrations.',
      requirements: 'B.S. in Computer Science or equivalent practical experience. Good understanding of JavaScript/TypeScript and relational databases.',
      responsibilities: 'Implement user stories, write unit and integration tests, resolve bug reports, and participate in daily standups.',
      location: 'San Francisco, CA',
      employmentType: EmploymentType.FULL_TIME,
      experienceLevel: ExperienceLevel.ENTRY,
      salaryMin: 75000,
      salaryMax: 95000,
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 1 * 86400000),
    },
    {
      title: 'Staff DevOps / Cloud Infrastructure Engineer',
      description: 'Design and automate scalable Kubernetes clusters, multi-cloud Terraform modules, and automated continuous delivery.',
      requirements: '6+ years cloud infrastructure experience with AWS, Kubernetes, Terraform, and GitOps workflows.',
      responsibilities: 'Manage cloud infrastructure as code, establish SLIs/SLOs, and lead incident response reviews.',
      location: 'Remote',
      employmentType: EmploymentType.REMOTE,
      experienceLevel: ExperienceLevel.SENIOR,
      salaryMin: 160000,
      salaryMax: 200000,
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 5 * 86400000),
    },
    {
      title: 'Mobile Engineer (iOS & Android)',
      description: 'Develop our native mobile companion apps using modern mobile frameworks.',
      requirements: '3+ years developing native mobile apps or cross-platform applications.',
      responsibilities: 'Implement offline sync, push notification systems, and smooth touch gestures.',
      location: 'San Francisco, CA',
      employmentType: EmploymentType.FULL_TIME,
      experienceLevel: ExperienceLevel.MID,
      salaryMin: 120000,
      salaryMax: 145000,
      status: JobStatus.CLOSED,
      publishedAt: new Date(Date.now() - 30 * 86400000),
    },
    {
      title: 'Product Security Lead',
      description: 'Draft role defining future application security and compliance standards.',
      requirements: 'Extensive background in OWASP, threat modeling, and penetration testing.',
      responsibilities: 'Lead vulnerability assessments and internal security education.',
      location: 'San Francisco, CA',
      employmentType: EmploymentType.FULL_TIME,
      experienceLevel: ExperienceLevel.LEAD,
      salaryMin: 200000,
      salaryMax: 250000,
      status: JobStatus.DRAFT,
      publishedAt: null,
    },
  ];

  const acmeJobs = [
    {
      title: 'DevOps / SRE Specialist',
      description: 'Maintain 99.99% uptime for developer platforms handling hundreds of millions of daily API transactions.',
      requirements: '4+ years in Site Reliability Engineering, distributed tracing, Linux internals, and Kubernetes orchestration.',
      responsibilities: 'Automate cluster provisioning, manage monitoring with Prometheus & Grafana, and optimize query latency.',
      location: 'New York, NY',
      employmentType: EmploymentType.FULL_TIME,
      experienceLevel: ExperienceLevel.SENIOR,
      salaryMin: 145000,
      salaryMax: 175000,
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 3 * 86400000),
    },
    {
      title: 'Frontend React Engineer',
      description: 'Craft responsive, pixel-perfect user interfaces with modern React, Next.js, Tailwind CSS, and TanStack Query.',
      requirements: '1-3 years of modern React experience with strong TypeScript habits and eye for design details.',
      responsibilities: 'Build interactive dashboards, data tables, and modal pipelines with strict accessibility standards.',
      location: 'New York, NY',
      employmentType: EmploymentType.FULL_TIME,
      experienceLevel: ExperienceLevel.JUNIOR,
      salaryMin: 85000,
      salaryMax: 105000,
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 2 * 86400000),
    },
    {
      title: 'Staff Product Designer',
      description: 'Define the design vision, UX architecture, and comprehensive design system across all Acme Cloud developer products.',
      requirements: '6+ years designing B2B/developer platforms. Proven mastery of Figma, user research, and WCAG AA accessibility.',
      responsibilities: 'Conduct customer user studies, create interactive prototypes, and partner closely with frontend engineers.',
      location: 'Remote',
      employmentType: EmploymentType.REMOTE,
      experienceLevel: ExperienceLevel.SENIOR,
      salaryMin: 140000,
      salaryMax: 170000,
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 7 * 86400000),
    },
    {
      title: 'AI / ML Research Engineer',
      description: 'Train and fine-tune foundation models for code completion, log anomaly detection, and automated test synthesis.',
      requirements: 'M.S. or Ph.D. in CS/AI or equivalent experience with PyTorch, model quantization, and distributed inference.',
      responsibilities: 'Fine-tune open-weights LLMs, build evaluation harnesses, and optimize token inference latency.',
      location: 'New York, NY',
      employmentType: EmploymentType.FULL_TIME,
      experienceLevel: ExperienceLevel.SENIOR,
      salaryMin: 170000,
      salaryMax: 220000,
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 4 * 86400000),
    },
    {
      title: 'Cloud Solutions Architect',
      description: 'Consult directly with tier-1 enterprise customers to migrate legacy workloads onto Acme Cloud developer infrastructure.',
      requirements: '5+ years presenting technical cloud architectures to CTOs, VPs, and principal software architects.',
      responsibilities: 'Deliver proofs-of-concept, create whitepapers, and diagnose performance bottlenecks in customer systems.',
      location: 'New York, NY',
      employmentType: EmploymentType.FULL_TIME,
      experienceLevel: ExperienceLevel.SENIOR,
      salaryMin: 160000,
      salaryMax: 190000,
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 8 * 86400000),
    },
    {
      title: 'Intern Software Engineer - Summer',
      description: 'Exciting paid 12-week internship for computer science students to build production features alongside senior developers.',
      requirements: 'Enrolled in Computer Science degree program with foundational knowledge of algorithms and modern web development.',
      responsibilities: 'Deliver an internal developer tool project, submit code reviews, and present final project to engineering org.',
      location: 'New York, NY',
      employmentType: EmploymentType.INTERNSHIP,
      experienceLevel: ExperienceLevel.ENTRY,
      salaryMin: 45000,
      salaryMax: 60000,
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 2 * 86400000),
    },
    {
      title: 'Data Platform Engineer',
      description: 'Build robust real-time data pipelines, Kafka ingestion layers, and analytics datastores.',
      requirements: '3+ years in data platform engineering, Kafka, ClickHouse/Snowflake, and SQL.',
      responsibilities: 'Maintain real-time event pipelines and ensure low-latency query throughput for user dashboards.',
      location: 'New York, NY',
      employmentType: EmploymentType.CONTRACT,
      experienceLevel: ExperienceLevel.MID,
      salaryMin: 115000,
      salaryMax: 140000,
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 9 * 86400000),
    },
    {
      title: 'Infrastructure Security Engineer',
      description: 'Removed role for historical audit and admin moderation testing.',
      requirements: 'Experience in infrastructure security.',
      responsibilities: 'Audit security postures.',
      location: 'New York, NY',
      employmentType: EmploymentType.FULL_TIME,
      experienceLevel: ExperienceLevel.SENIOR,
      salaryMin: 155000,
      salaryMax: 185000,
      status: JobStatus.REMOVED,
      publishedAt: new Date(Date.now() - 20 * 86400000),
    },
  ];

  const stealthJobs = [
    {
      title: 'Founding LLM Research Scientist',
      description: 'Draft job for unverified company. Cannot be published until company verification is granted by admin.',
      requirements: 'Ph.D. in Computer Science with top-tier ML conference publications (NeurIPS, ICML).',
      responsibilities: 'Design novel model architectures and train proprietary foundation models.',
      location: 'Austin, TX',
      employmentType: EmploymentType.FULL_TIME,
      experienceLevel: ExperienceLevel.LEAD,
      salaryMin: 180000,
      salaryMax: 250000,
      status: JobStatus.DRAFT,
      publishedAt: null,
    },
  ];

  const createdTechFlowJobs = [];
  for (const j of techFlowJobs) {
    const job = await prisma.job.create({
      data: {
        companyId: techFlow.id,
        ...j,
      },
    });
    createdTechFlowJobs.push(job);
  }

  const createdAcmeJobs = [];
  for (const j of acmeJobs) {
    const job = await prisma.job.create({
      data: {
        companyId: acmeCloud.id,
        ...j,
      },
    });
    createdAcmeJobs.push(job);
  }

  for (const j of stealthJobs) {
    await prisma.job.create({
      data: {
        companyId: stealthAI.id,
        ...j,
      },
    });
  }

  // 9. Applications in varied statuses
  // Alex -> TechFlow Senior Full-Stack Engineer (SHORTLISTED)
  await prisma.application.create({
    data: {
      jobId: createdTechFlowJobs[0].id,
      applicantId: alexSeeker.id,
      resumeFileId: alexResume.id,
      coverLetter: 'I have extensive experience with TypeScript, React, and Node.js backend systems and would love to contribute to TechFlow.',
      status: ApplicationStatus.SHORTLISTED,
    },
  });

  // Alex -> Acme Cloud Labs Frontend React Engineer (ACCEPTED)
  await prisma.application.create({
    data: {
      jobId: createdAcmeJobs[1].id,
      applicantId: alexSeeker.id,
      resumeFileId: alexResume.id,
      coverLetter: 'Excited about modern frontend developer tools and developer experience.',
      status: ApplicationStatus.ACCEPTED,
    },
  });

  // Maya -> Acme Cloud Labs Staff Product Designer (REVIEWING)
  await prisma.application.create({
    data: {
      jobId: createdAcmeJobs[2].id,
      applicantId: mayaSeeker.id,
      resumeFileId: mayaResume.id,
      coverLetter: 'I specialize in enterprise design systems and creating accessible, scalable UI patterns.',
      status: ApplicationStatus.REVIEWING,
    },
  });

  // Jordan -> Acme Cloud Labs DevOps / SRE Specialist (PENDING)
  await prisma.application.create({
    data: {
      jobId: createdAcmeJobs[0].id,
      applicantId: jordanSeeker.id,
      resumeFileId: jordanResume.id,
      coverLetter: 'With 5 years managing Kubernetes clusters in production, I am eager to help Acme maintain high availability.',
      status: ApplicationStatus.PENDING,
    },
  });

  // Jordan -> TechFlow Staff DevOps Engineer (REJECTED)
  await prisma.application.create({
    data: {
      jobId: createdTechFlowJobs[5].id,
      applicantId: jordanSeeker.id,
      resumeFileId: jordanResume.id,
      coverLetter: 'Passionate about infrastructure automation.',
      status: ApplicationStatus.REJECTED,
    },
  });

  // Claire -> TechFlow Entry-Level Software Developer (PENDING)
  await prisma.application.create({
    data: {
      jobId: createdTechFlowJobs[4].id,
      applicantId: claireSeeker.id,
      resumeFileId: claireResume.id,
      coverLetter: 'As a recent CS graduate, I am eager to learn from senior engineers and build real-world software.',
      status: ApplicationStatus.PENDING,
    },
  });

  // Claire -> Acme Cloud Labs Intern Software Engineer (WITHDRAWN)
  await prisma.application.create({
    data: {
      jobId: createdAcmeJobs[5].id,
      applicantId: claireSeeker.id,
      resumeFileId: claireResume.id,
      coverLetter: 'Applying for the summer internship position.',
      status: ApplicationStatus.WITHDRAWN,
    },
  });

  // 10. Saved Jobs
  await prisma.savedJob.create({
    data: {
      userId: alexSeeker.id,
      jobId: createdTechFlowJobs[1].id,
    },
  });
  await prisma.savedJob.create({
    data: {
      userId: mayaSeeker.id,
      jobId: createdTechFlowJobs[0].id,
    },
  });
  await prisma.savedJob.create({
    data: {
      userId: jordanSeeker.id,
      jobId: createdTechFlowJobs[1].id,
    },
  });

  console.log('✅ Seed finished successfully!');
  console.log('--- Credentials Summary ---');
  console.log('Admin:       admin@hirehub.dev / AdminPass123!');
  console.log('Employers:   sarah.owner@techflow.example.com / EmployerPass123!');
  console.log('             dave.recruiter@techflow.example.com / EmployerPass123!');
  console.log('             elena.owner@acmecloud.example.com / EmployerPass123!');
  console.log('             marcus.owner@stealthai.example.com / EmployerPass123! (Unverified)');
  console.log('Job Seekers: alex.dev@hirehub.dev / SeekerPass123!');
  console.log('             maya.designer@hirehub.dev / SeekerPass123!');
  console.log('             jordan.cloud@hirehub.dev / SeekerPass123!');
  console.log('             claire.junior@hirehub.dev / SeekerPass123!');
  console.log('             sam.suspended@hirehub.dev / SeekerPass123! (Suspended)');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
