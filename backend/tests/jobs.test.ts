import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/utils/prisma';

describe('Jobs Module & Search Engine', () => {
  let sarahCookie: string;
  let marcusCookie: string;
  let alexSeekerCookie: string;
  let techFlowId: string;
  let stealthAiId: string;
  let draftJobId: string;
  let jobWithAppsId: string;

  beforeAll(async () => {
    // Sarah (TechFlow OWNER - verified company)
    const sarahRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'sarah.owner@techflow.example.com', password: 'EmployerPass123!' });
    const rawSarah = sarahRes.headers['set-cookie'] as unknown as string[];
    sarahCookie = Array.isArray(rawSarah) ? rawSarah.join('; ') : String(rawSarah);

    // Marcus (StealthAI OWNER - unverified company)
    const marcusRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'marcus.owner@stealthai.example.com', password: 'EmployerPass123!' });
    const rawMarcus = marcusRes.headers['set-cookie'] as unknown as string[];
    marcusCookie = Array.isArray(rawMarcus) ? rawMarcus.join('; ') : String(rawMarcus);

    // Alex (Seeker)
    const alexRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'alex.dev@hirehub.dev', password: 'SeekerPass123!' });
    const rawAlex = alexRes.headers['set-cookie'] as unknown as string[];
    alexSeekerCookie = Array.isArray(rawAlex) ? rawAlex.join('; ') : String(rawAlex);

    const tf = await prisma.company.findUnique({ where: { slug: 'techflow-solutions' } });
    techFlowId = tf!.id;

    const sa = await prisma.company.findUnique({ where: { slug: 'stealthai-corp' } });
    stealthAiId = sa!.id;

    const draft = await prisma.job.findFirst({
      where: { companyId: techFlowId, status: 'DRAFT' },
    });
    draftJobId = draft!.id;

    const jobWithApp = await prisma.application.findFirst({
      include: { job: true },
    });
    jobWithAppsId = jobWithApp!.jobId;
  });

  describe('GET /api/v1/jobs (Public Search & Filter)', () => {
    it('returns only PUBLISHED jobs from verified companies', async () => {
      const res = await request(app).get('/api/v1/jobs');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((j: any) => j.status === 'PUBLISHED')).toBe(true);
      expect(res.body.data.every((j: any) => j.company.verified === true)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBeGreaterThan(0);
    });

    it('filters jobs by search query keyword in title', async () => {
      const res = await request(app).get('/api/v1/jobs?search=Full-Stack');
      expect(res.status).toBe(200);
      expect(res.body.data.some((j: any) => j.title.includes('Full-Stack'))).toBe(true);
    });

    it('filters jobs by experience level', async () => {
      const res = await request(app).get('/api/v1/jobs?experienceLevel=SENIOR');
      expect(res.status).toBe(200);
      expect(res.body.data.every((j: any) => j.experienceLevel === 'SENIOR')).toBe(true);
    });

    it('filters jobs by salary range overlap', async () => {
      const res = await request(app).get('/api/v1/jobs?minSalary=180000&maxSalary=220000');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const job of res.body.data) {
        if (job.salaryMin && job.salaryMax) {
          expect(Number(job.salaryMax)).toBeGreaterThanOrEqual(180000);
          expect(Number(job.salaryMin)).toBeLessThanOrEqual(220000);
        }
      }
    });

    it('paginates results accurately with page and pageSize', async () => {
      const res = await request(app).get('/api/v1/jobs?page=1&pageSize=5');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
      expect(res.body.meta.pageSize).toBe(5);
      expect(res.body.meta.page).toBe(1);
    });
  });

  describe('Unpublished Job Leak Prevention', () => {
    it('returns 404 to anonymous users when accessing a DRAFT job', async () => {
      const res = await request(app).get(`/api/v1/jobs/${draftJobId}`);
      expect(res.status).toBe(404);
    });

    it('returns 404 to non-member job seeker when accessing a DRAFT job', async () => {
      const res = await request(app)
        .get(`/api/v1/jobs/${draftJobId}`)
        .set('Cookie', alexSeekerCookie);
      expect(res.status).toBe(404);
    });

    it('allows company member to view DRAFT job', async () => {
      const res = await request(app)
        .get(`/api/v1/jobs/${draftJobId}`)
        .set('Cookie', sarahCookie);
      expect(res.status).toBe(200);
      expect(res.body.data.job.id).toBe(draftJobId);
      expect(res.body.data.job.status).toBe('DRAFT');
    });
  });

  describe('Job Creation, Publishing & Verification Rules', () => {
    it('allows verified company member to create and publish a job', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', sarahCookie)
        .send({
          companyId: techFlowId,
          title: 'Senior Distributed Storage Engineer',
          description: 'Build petabyte-scale storage engines.',
          requirements: '5+ years distributed systems and database storage engines.',
          responsibilities: 'Write low-level database primitives and optimize I/O.',
          location: 'San Francisco, CA',
          employmentType: 'FULL_TIME',
          experienceLevel: 'SENIOR',
          salaryMin: 170000,
          salaryMax: 210000,
          status: 'PUBLISHED',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.job.title).toBe('Senior Distributed Storage Engineer');
      expect(res.body.data.job.status).toBe('PUBLISHED');
      expect(res.body.data.job.publishedAt).toBeDefined();
    });

    it('blocks unverified company from publishing a job', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', marcusCookie)
        .send({
          companyId: stealthAiId,
          title: 'Stealth AI Principal Scientist',
          description: 'Top secret foundation model research.',
          requirements: 'Ph.D. in Machine Learning.',
          responsibilities: 'Lead AI architectures.',
          location: 'Austin, TX',
          employmentType: 'FULL_TIME',
          experienceLevel: 'LEAD',
          salaryMin: 220000,
          salaryMax: 300000,
          status: 'PUBLISHED', // Blocked because StealthAI is unverified
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('UNVERIFIED_COMPANY');
    });

    it('allows unverified company to create a DRAFT job', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', marcusCookie)
        .send({
          companyId: stealthAiId,
          title: 'Stealth AI Valid Draft Role',
          description: 'Draft job for unverified company.',
          requirements: 'Python, PyTorch.',
          responsibilities: 'Experimentation.',
          location: 'Austin, TX',
          employmentType: 'FULL_TIME',
          experienceLevel: 'MID',
          status: 'DRAFT',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.job.status).toBe('DRAFT');
    });

    it('rejects job creation if salaryMin > salaryMax', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', sarahCookie)
        .send({
          companyId: techFlowId,
          title: 'Invalid Salary Job',
          description: 'Testing salary validation.',
          requirements: 'Requirements here.',
          responsibilities: 'Responsibilities here.',
          location: 'San Francisco, CA',
          employmentType: 'FULL_TIME',
          experienceLevel: 'MID',
          salaryMin: 200000,
          salaryMax: 100000, // Invalid!
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Job Deletion Rules', () => {
    it('blocks deleting a job that has applications', async () => {
      const res = await request(app)
        .delete(`/api/v1/jobs/${jobWithAppsId}`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', sarahCookie);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_DELETE_JOB_WITH_APPLICATIONS');
    });

    it('allows deleting a job with zero applications', async () => {
      // Create a temporary draft job with 0 applications
      const tempJob = await prisma.job.create({
        data: {
          companyId: techFlowId,
          title: 'Temporary Deletable Job',
          description: 'This job will be cleanly deleted.',
          requirements: 'None required.',
          responsibilities: 'None required.',
          location: 'Remote',
          employmentType: 'CONTRACT',
          experienceLevel: 'ENTRY',
          status: 'DRAFT',
        },
      });

      const res = await request(app)
        .delete(`/api/v1/jobs/${tempJob.id}`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', sarahCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('deleted successfully');
    });
  });

  describe('Employer Jobs Listing', () => {
    it('GET /api/v1/employer/jobs returns all jobs including drafts and application counts', async () => {
      const res = await request(app)
        .get('/api/v1/employer/jobs')
        .set('Cookie', sarahCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.jobs).toBeDefined();
      expect(res.body.data.jobs.length).toBeGreaterThan(0);
      expect(res.body.data.jobs.some((j: any) => j.status === 'DRAFT')).toBe(true);
      expect(res.body.data.jobs[0]._count.applications).toBeDefined();
    });
  });
});
