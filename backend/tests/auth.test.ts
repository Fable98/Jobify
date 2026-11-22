import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/utils/prisma';
import { SESSION_COOKIE_NAME } from '../src/middleware/auth';

describe('Auth & Session System', () => {
  beforeEach(async () => {
    // Clean up test-specific users
    await prisma.session.deleteMany({
      where: { user: { email: { contains: 'test.auth' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'test.auth' } },
    });
  });

  describe('CSRF Protection', () => {
    it('rejects state-changing POST request without X-Requested-With header', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@jobify.dev', password: 'AdminPass123!' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_DETECTED');
    });

    it('allows POST request when X-Requested-With header is present', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ email: 'admin@jobify.dev', password: 'AdminPass123!' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('admin@jobify.dev');
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('registers a new JOB_SEEKER and sets session cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          email: 'test.auth.seeker@example.com',
          password: 'SecurePassword123!',
          role: 'JOB_SEEKER',
          name: 'Test Seeker',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe('test.auth.seeker@example.com');
      expect(res.body.data.user.role).toBe('JOB_SEEKER');
      expect(res.body.data.user.passwordHash).toBeUndefined();

      // Check cookie
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes(SESSION_COOKIE_NAME))).toBe(true);
      expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
      expect(cookies.some((c) => c.includes('SameSite=Lax'))).toBe(true);
    });

    it('registers a new EMPLOYER', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          email: 'test.auth.employer@example.com',
          password: 'SecurePassword123!',
          role: 'EMPLOYER',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('EMPLOYER');
    });

    it('rejects attempt to register with ADMIN role', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          email: 'test.auth.admin@example.com',
          password: 'SecurePassword123!',
          role: 'ADMIN',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects registration with duplicate email', async () => {
      const email = `test.auth.dup-${Date.now()}@example.com`;
      // First registration
      const firstRes = await request(app)
        .post('/api/v1/auth/register')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          email,
          password: 'SecurePassword123!',
          role: 'JOB_SEEKER',
        });
      expect(firstRes.status).toBe(201);

      // Duplicate registration
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          email,
          password: 'SecurePassword123!',
          role: 'JOB_SEEKER',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('USER_ALREADY_EXISTS');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('authenticates valid credentials and issues session cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          email: 'alex.dev@jobify.dev',
          password: 'SeekerPass123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('alex.dev@jobify.dev');
      expect(res.body.data.user.passwordHash).toBeUndefined();

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.includes(SESSION_COOKIE_NAME))).toBe(true);
    });

    it('returns 401 for unknown email with generic message', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          email: 'nonexistent@jobify.dev',
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('returns identical 401 message for existing email with wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          email: 'alex.dev@jobify.dev',
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('blocks login for SUSPENDED user with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          email: 'sam.suspended@jobify.dev',
          password: 'SeekerPass123!',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('USER_SUSPENDED');
    });
  });

  describe('GET /api/v1/auth/me & Logout', () => {
    it('returns authenticated user details for valid session', async () => {
      // Login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          email: 'alex.dev@jobify.dev',
          password: 'SeekerPass123!',
        });

      expect(loginRes.status).toBe(200);
      const rawCookies = loginRes.headers['set-cookie'];
      expect(rawCookies).toBeDefined();
      const cookieStr = Array.isArray(rawCookies) ? rawCookies.join('; ') : String(rawCookies);

      // Fetch me
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', cookieStr);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.user.email).toBe('alex.dev@jobify.dev');
      expect(meRes.body.data.user.profile).toBeDefined();
      expect(meRes.body.data.user.passwordHash).toBeUndefined();
    });

    it('rejects /me when no session cookie is provided', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('logs out and invalidates the session', async () => {
      // Login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          email: 'alex.dev@jobify.dev',
          password: 'SeekerPass123!',
        });

      expect(loginRes.status).toBe(200);
      const rawCookies = loginRes.headers['set-cookie'];
      expect(rawCookies).toBeDefined();
      const cookieStr = Array.isArray(rawCookies) ? rawCookies.join('; ') : String(rawCookies);

      // Logout
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', cookieStr);

      expect(logoutRes.status).toBe(200);

      // Subsequent /me request should fail
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', cookieStr);

      expect(meRes.status).toBe(401);
    });
  });
});
