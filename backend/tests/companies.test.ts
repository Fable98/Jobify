import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Companies & Members Module', () => {
  let sarahOwnerCookie: string;
  let daveRecruiterCookie: string;
  let alexSeekerCookie: string;
  let techFlowId: string;

  it('authenticates seed users to obtain cookies', async () => {
    // Sarah (TechFlow OWNER)
    const sarahRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'sarah.owner@techflow.example.com', password: 'EmployerPass123!' });
    expect(sarahRes.status).toBe(200);
    const sarahCookies = sarahRes.headers['set-cookie'] as unknown as string[];
    sarahOwnerCookie = Array.isArray(sarahCookies) ? sarahCookies.join('; ') : String(sarahCookies);

    // Dave (TechFlow RECRUITER)
    const daveRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'dave.recruiter@techflow.example.com', password: 'EmployerPass123!' });
    expect(daveRes.status).toBe(200);
    const daveCookies = daveRes.headers['set-cookie'] as unknown as string[];
    daveRecruiterCookie = Array.isArray(daveCookies) ? daveCookies.join('; ') : String(daveCookies);

    // Alex (JOB_SEEKER)
    const alexRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'alex.dev@hirehub.dev', password: 'SeekerPass123!' });
    expect(alexRes.status).toBe(200);
    const alexCookies = alexRes.headers['set-cookie'] as unknown as string[];
    alexSeekerCookie = Array.isArray(alexCookies) ? alexCookies.join('; ') : String(alexCookies);

    // Fetch techflow company id
    const companyRes = await request(app).get('/api/v1/companies/techflow-solutions');
    expect(companyRes.status).toBe(200);
    techFlowId = companyRes.body.data.company.id;
  });

  describe('GET /api/v1/companies & visibility', () => {
    it('returns verified companies on public endpoint', async () => {
      const res = await request(app).get('/api/v1/companies');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((c: any) => c.verified === true)).toBe(true);
    });

    it('returns 404 for unverified company when requested by anonymous user', async () => {
      const res = await request(app).get('/api/v1/companies/stealthai-corp');
      expect(res.status).toBe(404);
    });

    it('allows owner of unverified company to view their company', async () => {
      const marcusRes = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ email: 'marcus.owner@stealthai.example.com', password: 'EmployerPass123!' });
      const rawCookies = marcusRes.headers['set-cookie'] as unknown as string[];
      const marcusCookie = Array.isArray(rawCookies) ? rawCookies.join('; ') : String(rawCookies);

      const res = await request(app)
        .get('/api/v1/companies/stealthai-corp')
        .set('Cookie', marcusCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.company.slug).toBe('stealthai-corp');
      expect(res.body.data.company.verified).toBe(false);
    });
  });

  describe('Company Creation & Role Restrictions', () => {
    it('allows EMPLOYER to create a company and assigns them as OWNER', async () => {
      // Register new employer
      const founderEmail = `founder-${Date.now()}@example.com`;
      const empRes = await request(app)
        .post('/api/v1/auth/register')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          email: founderEmail,
          password: 'FounderPassword123!',
          role: 'EMPLOYER',
        });
      expect(empRes.status).toBe(201);
      const raw = empRes.headers['set-cookie'];
      const cookie = Array.isArray(raw) ? raw.join('; ') : String(raw);

      const createRes = await request(app)
        .post('/api/v1/companies')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', cookie)
        .send({
          name: `HyperScale Systems ${Date.now()}`,
          industry: 'Cloud Infrastructure',
          description: 'Next-gen distributed cloud hypervisor.',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.company.verified).toBe(false);

      // Verify membership
      const membersRes = await request(app)
        .get(`/api/v1/companies/${createRes.body.data.company.id}/members`)
        .set('Cookie', cookie);

      expect(membersRes.status).toBe(200);
      expect(membersRes.body.data.members.length).toBe(1);
      expect(membersRes.body.data.members[0].role).toBe('OWNER');
    });

    it('blocks JOB_SEEKER from creating a company', async () => {
      const res = await request(app)
        .post('/api/v1/companies')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', alexSeekerCookie)
        .send({ name: 'Seeker Illegal Corp' });

      expect(res.status).toBe(403);
    });
  });

  describe('Company Updates & RBAC', () => {
    it('allows OWNER to update company settings', async () => {
      const res = await request(app)
        .patch(`/api/v1/companies/${techFlowId}`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', sarahOwnerCookie)
        .send({
          description: 'Updated description by Sarah Owner.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.company.description).toBe('Updated description by Sarah Owner.');
    });

    it('blocks RECRUITER from updating company settings', async () => {
      const res = await request(app)
        .patch(`/api/v1/companies/${techFlowId}`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', daveRecruiterCookie)
        .send({
          description: 'Unauthorized update attempt by Dave Recruiter.',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Company Member Management & Last Owner Protection', () => {
    it('blocks RECRUITER from adding members', async () => {
      const res = await request(app)
        .post(`/api/v1/companies/${techFlowId}/members`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', daveRecruiterCookie)
        .send({
          email: 'elena.owner@acmecloud.example.com',
          role: 'RECRUITER',
        });

      expect(res.status).toBe(403);
    });

    it('blocks adding a user who is not an EMPLOYER', async () => {
      const res = await request(app)
        .post(`/api/v1/companies/${techFlowId}/members`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', sarahOwnerCookie)
        .send({
          email: 'alex.dev@hirehub.dev', // Alex is a JOB_SEEKER
          role: 'RECRUITER',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Only users with EMPLOYER role');
    });

    it('enforces Last-Owner rule: cannot demote the only OWNER to RECRUITER', async () => {
      // Find members of TechFlow
      const membersRes = await request(app)
        .get(`/api/v1/companies/${techFlowId}/members`)
        .set('Cookie', sarahOwnerCookie);

      const sarahMember = membersRes.body.data.members.find(
        (m: any) => m.user.email === 'sarah.owner@techflow.example.com'
      );
      expect(sarahMember).toBeDefined();

      // Try demoting Sarah (the only owner)
      const demoteRes = await request(app)
        .patch(`/api/v1/companies/${techFlowId}/members/${sarahMember.id}`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', sarahOwnerCookie)
        .send({ role: 'RECRUITER' });

      expect(demoteRes.status).toBe(400);
      expect(demoteRes.body.error.code).toBe('LAST_OWNER_PROTECTION');
    });

    it('enforces Last-Owner rule: cannot remove the only OWNER from the company', async () => {
      const membersRes = await request(app)
        .get(`/api/v1/companies/${techFlowId}/members`)
        .set('Cookie', sarahOwnerCookie);

      const sarahMember = membersRes.body.data.members.find(
        (m: any) => m.user.email === 'sarah.owner@techflow.example.com'
      );

      const removeRes = await request(app)
        .delete(`/api/v1/companies/${techFlowId}/members/${sarahMember.id}`)
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', sarahOwnerCookie);

      expect(removeRes.status).toBe(400);
      expect(removeRes.body.error.code).toBe('LAST_OWNER_PROTECTION');
    });
  });
});
