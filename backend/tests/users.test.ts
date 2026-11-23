import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Users & Stats Module', () => {
  let alexSeekerCookie: string;
  let sarahEmployerCookie: string;

  beforeAll(async () => {
    // Alex Seeker
    const alexRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'alex.dev@jobify.dev', password: 'SeekerPass123!' });
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

  describe('User Profile Operations & Security', () => {
    it('GET /api/v1/users/me returns authenticated profile details', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Cookie', alexSeekerCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('alex.dev@jobify.dev');
      expect(res.body.data.user.role).toBe('JOB_SEEKER');
      expect(res.body.data.user.profile).toBeDefined();
    });

    it('PATCH /api/v1/users/me updates seeker profile and skills', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', alexSeekerCookie)
        .send({
          headline: 'Senior Principal Staff Engineer',
          bio: 'Building hyper-scale distributed systems and databases.',
          skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Prisma', 'Vitest', 'Docker'],
          location: 'San Francisco, CA',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.profile.headline).toBe('Senior Principal Staff Engineer');
      expect(res.body.data.profile.skills).toContain('Vitest');
    });

    it('prevents privilege escalation when role is supplied in profile update body', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', alexSeekerCookie)
        .send({
          role: 'ADMIN', // Privilege escalation attempt
          headline: 'Attempted Escaped Admin',
        });

      expect(res.status).toBe(200);

      // Verify the user remains JOB_SEEKER
      const meRes = await request(app)
        .get('/api/v1/users/me')
        .set('Cookie', alexSeekerCookie);

      expect(meRes.body.data.user.role).toBe('JOB_SEEKER');
      expect(meRes.body.data.user.role).not.toBe('ADMIN');
    });
  });

  describe('Role-Restricted Stats Endpoints', () => {
    it('allows job seeker to access /api/v1/stats/job-seeker', async () => {
      const res = await request(app)
        .get('/api/v1/stats/job-seeker')
        .set('Cookie', alexSeekerCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.appliedCount).toBeDefined();
      expect(res.body.data.activeApplications).toBeDefined();
      expect(res.body.data.savedJobsCount).toBeDefined();
      expect(res.body.data.applicationsByStatus).toBeDefined();
    });

    it('blocks employer from accessing /api/v1/stats/job-seeker with 403', async () => {
      const res = await request(app)
        .get('/api/v1/stats/job-seeker')
        .set('Cookie', sarahEmployerCookie);

      expect(res.status).toBe(403);
    });

    it('allows employer to access /api/v1/stats/employer', async () => {
      const res = await request(app)
        .get('/api/v1/stats/employer')
        .set('Cookie', sarahEmployerCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.totalJobsCount).toBeDefined();
      expect(res.body.data.activeJobsCount).toBeDefined();
      expect(res.body.data.pendingReviewCount).toBeDefined();
    });

    it('blocks job seeker from accessing /api/v1/stats/employer with 403', async () => {
      const res = await request(app)
        .get('/api/v1/stats/employer')
        .set('Cookie', alexSeekerCookie);

      expect(res.status).toBe(403);
    });
  });

  describe('GDPR Compliance & Data Portability', () => {
    it('GET /api/v1/users/me/export exports all user data while stripping passwordHash', async () => {
      const res = await request(app)
        .get('/api/v1/users/me/export')
        .set('Cookie', alexSeekerCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.exportData).toBeDefined();
      expect(res.body.data.exportData.email).toBe('alex.dev@jobify.dev');
      expect(res.body.data.exportData.passwordHash).toBeUndefined();
      expect(res.body.data.exportData.profile).toBeDefined();
      expect(res.body.data.exportedAt).toBeDefined();
    });

    it('blocks unauthenticated requests to /api/v1/users/me/export with 401', async () => {
      const res = await request(app).get('/api/v1/users/me/export');
      expect(res.status).toBe(401);
    });
  });
});
