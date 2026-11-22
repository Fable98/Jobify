import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/utils/prisma';

describe('Applications & Saved Jobs Module', () => {
  let mayaSeekerCookie: string;
  let sarahEmployerCookie: string;
  let publishedJobId: string;
  let closedJobId: string;
  let alexResumeId: string;
  let mayaResumeId: string;

  beforeAll(async () => {
    // Maya Seeker
    const mayaRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'maya.designer@hirehub.dev', password: 'SeekerPass123!' });
    const rawMaya = mayaRes.headers['set-cookie'] as unknown as string[];
    mayaSeekerCookie = Array.isArray(rawMaya) ? rawMaya.join('; ') : String(rawMaya);

    // Sarah Employer (TechFlow)
    const sarahRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'sarah.owner@techflow.example.com', password: 'EmployerPass123!' });
    const rawSarah = sarahRes.headers['set-cookie'] as unknown as string[];
    sarahEmployerCookie = Array.isArray(rawSarah) ? rawSarah.join('; ') : String(rawSarah);

    const alexFile = await prisma.storedFile.findFirst({
      where: { owner: { email: 'alex.dev@hirehub.dev' } },
    });
    alexResumeId = alexFile!.id;

    const mayaFile = await prisma.storedFile.findFirst({
      where: { owner: { email: 'maya.designer@hirehub.dev' } },
    });
    mayaResumeId = mayaFile!.id;

    // Find a published job from TechFlow that Alex hasn't applied to yet
    const tfJobs = await prisma.job.findMany({
      where: {
        company: { slug: 'techflow-solutions' },
        status: 'PUBLISHED',
      },
    });
    publishedJobId = tfJobs[1].id;

    const closed = await prisma.job.findFirst({
      where: { status: 'CLOSED' },
    });
    closedJobId = closed!.id;
  });

  describe('Applying to Jobs & Validations', () => {
    it('submits a valid application to a published job', async () => {
      // Ensure clean state for this test
      await prisma.application.deleteMany({
        where: { jobId: publishedJobId, applicant: { email: 'maya.designer@hirehub.dev' } },
      });

      const res = await request(app)
        .post(`/api/v1/jobs/${publishedJobId}/apply`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', mayaSeekerCookie)
        .send({
          resumeFileId: mayaResumeId,
          coverLetter: 'Excited about design systems at TechFlow.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.application.status).toBe('PENDING');
      expect(res.body.data.application.jobId).toBe(publishedJobId);
      createdApplicationId = res.body.data.application.id;
    });

    it('rejects duplicate application to the same job with 409 Conflict', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${publishedJobId}/apply`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', mayaSeekerCookie)
        .send({
          resumeFileId: mayaResumeId,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ALREADY_APPLIED');
    });

    it('rejects application to a CLOSED job', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${closedJobId}/apply`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', mayaSeekerCookie)
        .send({
          resumeFileId: mayaResumeId,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('JOB_NOT_PUBLISHED');
    });

    it('rejects application with resume file not owned by applicant', async () => {
      const anotherJob = await prisma.job.findFirst({
        where: { status: 'PUBLISHED', id: { not: publishedJobId } },
      });

      const res = await request(app)
        .post(`/api/v1/jobs/${anotherJob!.id}/apply`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', mayaSeekerCookie)
        .send({
          resumeFileId: alexResumeId, // Not Maya's resume!
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Invalid resume file');
    });

    it('blocks employer from applying to a job at their own company', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${publishedJobId}/apply`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', sarahEmployerCookie)
        .send({
          resumeFileId: alexResumeId,
        });

      expect(res.status).toBe(403); // Sarah has EMPLOYER role
    });
  });

  describe('Application Lifecycle State Machine', () => {
    let testAppId: string;

    beforeAll(async () => {
      // Find or create a fresh pending application for Maya
      const testJob = await prisma.job.findFirst({
        where: {
          company: { slug: 'techflow-solutions' },
          status: 'PUBLISHED',
          applications: { none: { applicant: { email: 'claire.junior@hirehub.dev' } } },
        },
      });

      const claire = await prisma.user.findUnique({
        where: { email: 'claire.junior@hirehub.dev' },
        include: { files: true },
      });

      const appRecord = await prisma.application.create({
        data: {
          jobId: testJob!.id,
          applicantId: claire!.id,
          resumeFileId: claire!.files[0].id,
          status: 'PENDING',
        },
      });
      testAppId = appRecord.id;
    });

    it('rejects invalid skip transition (PENDING directly to ACCEPTED)', async () => {
      const res = await request(app)
        .patch(`/api/v1/employer/applications/${testAppId}/status`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', sarahEmployerCookie)
        .send({ status: 'ACCEPTED' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('rejects employer attempt to mark application as WITHDRAWN', async () => {
      const res = await request(app)
        .patch(`/api/v1/employer/applications/${testAppId}/status`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', sarahEmployerCookie)
        .send({ status: 'WITHDRAWN' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_TRANSITION');
    });

    it('executes valid transition PENDING -> REVIEWING', async () => {
      const res = await request(app)
        .patch(`/api/v1/employer/applications/${testAppId}/status`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', sarahEmployerCookie)
        .send({ status: 'REVIEWING' });

      expect(res.status).toBe(200);
      expect(res.body.data.application.status).toBe('REVIEWING');
    });

    it('executes valid transition REVIEWING -> SHORTLISTED', async () => {
      const res = await request(app)
        .patch(`/api/v1/employer/applications/${testAppId}/status`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', sarahEmployerCookie)
        .send({ status: 'SHORTLISTED' });

      expect(res.status).toBe(200);
      expect(res.body.data.application.status).toBe('SHORTLISTED');
    });

    it('executes valid transition SHORTLISTED -> ACCEPTED', async () => {
      const res = await request(app)
        .patch(`/api/v1/employer/applications/${testAppId}/status`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', sarahEmployerCookie)
        .send({ status: 'ACCEPTED' });

      expect(res.status).toBe(200);
      expect(res.body.data.application.status).toBe('ACCEPTED');
    });

    it('blocks transition out of terminal status ACCEPTED', async () => {
      const res = await request(app)
        .patch(`/api/v1/employer/applications/${testAppId}/status`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', sarahEmployerCookie)
        .send({ status: 'REJECTED' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  describe('Applicant Withdrawal', () => {
    it('allows seeker to withdraw their application from REVIEWING status', async () => {
      // Find Maya's application
      const mayaApp = await prisma.application.findFirst({
        where: {
          applicant: { email: 'maya.designer@hirehub.dev' },
          status: 'REVIEWING',
        },
      });

      const res = await request(app)
        .patch(`/api/v1/applications/${mayaApp!.id}/withdraw`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', mayaSeekerCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.application.status).toBe('WITHDRAWN');
    });

    it('blocks withdrawing an already WITHDRAWN application', async () => {
      const withdrawnApp = await prisma.application.findFirst({
        where: {
          applicant: { email: 'claire.junior@hirehub.dev' },
          status: 'WITHDRAWN',
        },
      });

      // Login as Claire
      const claireRes = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ email: 'claire.junior@hirehub.dev', password: 'SeekerPass123!' });
      const rawClaire = claireRes.headers['set-cookie'] as unknown as string[];
      const claireCookie = Array.isArray(rawClaire) ? rawClaire.join('; ') : String(rawClaire);

      const res = await request(app)
        .patch(`/api/v1/applications/${withdrawnApp!.id}/withdraw`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', claireCookie);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_WITHDRAWAL_STATUS');
    });
  });

  describe('Saved Jobs Operations', () => {
    it('allows seeker to save a job and lists it', async () => {
      // Clean up before test
      await prisma.savedJob.deleteMany({
        where: {
          jobId: publishedJobId,
          user: { email: 'maya.designer@hirehub.dev' },
        },
      });

      // Save job
      const saveRes = await request(app)
        .post('/api/v1/saved-jobs')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', mayaSeekerCookie)
        .send({ jobId: publishedJobId });

      expect(saveRes.status).toBe(201);
      expect(saveRes.body.data.savedJob.jobId).toBe(publishedJobId);

      // List saved jobs
      const listRes = await request(app)
        .get('/api/v1/saved-jobs')
        .set('Cookie', mayaSeekerCookie);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.savedJobs.some((s: any) => s.jobId === publishedJobId)).toBe(true);
    });

    it('rejects saving the same job twice with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/saved-jobs')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', mayaSeekerCookie)
        .send({ jobId: publishedJobId });

      expect(res.status).toBe(409);
    });

    it('removes a job from saved jobs (unsave)', async () => {
      const res = await request(app)
        .delete(`/api/v1/saved-jobs/${publishedJobId}`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', mayaSeekerCookie);

      expect(res.status).toBe(200);

      // Check it is gone
      const listRes = await request(app)
        .get('/api/v1/saved-jobs')
        .set('Cookie', mayaSeekerCookie);

      expect(listRes.body.data.savedJobs.some((s: any) => s.jobId === publishedJobId)).toBe(false);
    });
  });
});
