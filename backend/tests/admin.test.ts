import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/utils/prisma';

describe('Admin & Stats Module', () => {
  let adminCookie: string;
  let alexSeekerCookie: string;
  let sarahEmployerCookie: string;

  beforeAll(async () => {
    // Admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'admin@hirehub.dev', password: 'AdminPass123!' });
    const rawAdmin = adminRes.headers['set-cookie'] as unknown as string[];
    adminCookie = Array.isArray(rawAdmin) ? rawAdmin.join('; ') : String(rawAdmin);

    // Alex Seeker
    const alexRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'alex.dev@hirehub.dev', password: 'SeekerPass123!' });
    const rawAlex = alexRes.headers['set-cookie'] as unknown as string[];
    alexSeekerCookie = Array.isArray(rawAlex) ? rawAlex.join('; ') : String(rawAlex);

    // Sarah Employer
    const sarahRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'sarah.owner@techflow.example.com', password: 'EmployerPass123!' });
    const rawSarah = sarahRes.headers['set-cookie'] as unknown as string[];
    sarahEmployerCookie = Array.isArray(rawSarah) ? rawSarah.join('; ') : String(rawSarah);
  });

  describe('Admin RBAC Gating', () => {
    it('blocks non-admin users from accessing /api/v1/admin/users with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Cookie', alexSeekerCookie);

      expect(res.status).toBe(403);
    });

    it('allows admin to list all users', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.meta.total).toBeGreaterThan(0);
    });
  });

  describe('Company Verification Moderation', () => {
    it('allows admin to verify an unverified company', async () => {
      // Create a dedicated test company
      const testCompany = await prisma.company.create({
        data: {
          name: `Unverified Test Corp ${Date.now()}`,
          slug: `unverified-corp-${Date.now()}`,
          verified: false,
        },
      });

      const res = await request(app)
        .patch(`/api/v1/admin/companies/${testCompany.id}/verify`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', adminCookie)
        .send({ verified: true });

      expect(res.status).toBe(200);
      expect(res.body.data.company.verified).toBe(true);

      // Verify in DB
      const updated = await prisma.company.findUnique({ where: { id: testCompany.id } });
      expect(updated!.verified).toBe(true);
    });
  });

  describe('Job Moderation', () => {
    it('allows admin to set a job status to REMOVED and hides it publicly', async () => {
      // Create a test published job to moderate
      const tf = await prisma.company.findUnique({ where: { slug: 'techflow-solutions' } });
      const testJob = await prisma.job.create({
        data: {
          companyId: tf!.id,
          title: `Job To Be Moderated ${Date.now()}`,
          description: 'Testing admin moderation endpoint.',
          requirements: 'Test requirements.',
          responsibilities: 'Test responsibilities.',
          location: 'San Francisco, CA',
          employmentType: 'FULL_TIME',
          experienceLevel: 'MID',
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });

      const res = await request(app)
        .patch(`/api/v1/admin/jobs/${testJob.id}/moderate`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', adminCookie)
        .send({ status: 'REMOVED' });

      expect(res.status).toBe(200);
      expect(res.body.data.job.status).toBe('REMOVED');

      // Check that public job detail now returns 404
      const publicRes = await request(app).get(`/api/v1/jobs/${testJob.id}`);
      expect(publicRes.status).toBe(404);
    });
  });

  describe('User Suspension & Session Invalidation', () => {
    it('allows admin to suspend a user, which invalidates all their sessions', async () => {
      const email = `suspend.test-${Date.now()}@example.com`;
      // Register a new seeker
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ email, password: 'SecurePassword123!', role: 'JOB_SEEKER' });
      expect(regRes.status).toBe(201);
      const userCookie = regRes.headers['set-cookie'];
      const userId = regRes.body.data.user.id;

      // Suspend user as Admin
      const suspendRes = await request(app)
        .patch(`/api/v1/admin/users/${userId}/status`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', adminCookie)
        .send({ status: 'SUSPENDED' });

      expect(suspendRes.status).toBe(200);
      expect(suspendRes.body.data.user.status).toBe('SUSPENDED');

      // Verify user's existing session is immediately rejected with 403
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', userCookie);

      expect(meRes.status).toBe(403);
      expect(meRes.body.error.code).toBe('USER_SUSPENDED');

      // Verify user cannot log in again
      const loginAttempt = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ email, password: 'SecurePassword123!' });

      expect(loginAttempt.status).toBe(403);
    });
  });

  describe('Stats Endpoints', () => {
    it('GET /api/v1/stats/job-seeker returns candidate analytics', async () => {
      const res = await request(app)
        .get('/api/v1/stats/job-seeker')
        .set('Cookie', alexSeekerCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.appliedCount).toBeDefined();
      expect(res.body.data.activeApplications).toBeDefined();
      expect(res.body.data.applicationsByStatus).toBeDefined();
    });

    it('GET /api/v1/stats/employer returns employer pipeline metrics', async () => {
      const res = await request(app)
        .get('/api/v1/stats/employer')
        .set('Cookie', sarahEmployerCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.activeJobsCount).toBeDefined();
      expect(res.body.data.totalApplicantsCount).toBeDefined();
      expect(res.body.data.applicantsByJob).toBeDefined();
    });

    it('GET /api/v1/admin/stats returns platform overview & database latency', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.totalUsers).toBeGreaterThan(0);
      expect(res.body.data.totalCompanies).toBeGreaterThan(0);
      expect(res.body.data.systemHealth.status).toBe('HEALTHY');
      expect(typeof res.body.data.systemHealth.dbLatencyMs).toBe('number');
    });
  });
});
