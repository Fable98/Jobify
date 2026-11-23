import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/utils/prisma';

describe('Files Module & Storage Security', () => {
  let alexSeekerCookie: string;
  let mayaSeekerCookie: string;
  let sarahOwnerCookie: string;
  let adminCookie: string;
  let alexResumeId: string;

  beforeAll(async () => {
    // Alex Seeker
    const alexRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'alex.dev@jobify.dev', password: 'SeekerPass123!' });
    const rawAlex = alexRes.headers['set-cookie'] as unknown as string[];
    alexSeekerCookie = Array.isArray(rawAlex) ? rawAlex.join('; ') : String(rawAlex);

    // Maya Seeker (unrelated seeker)
    const mayaRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'maya.designer@jobify.dev', password: 'SeekerPass123!' });
    const rawMaya = mayaRes.headers['set-cookie'] as unknown as string[];
    mayaSeekerCookie = Array.isArray(rawMaya) ? rawMaya.join('; ') : String(rawMaya);

    // Sarah Owner (TechFlow Employer - Alex applied to TechFlow with his resume!)
    const sarahRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'sarah.owner@techflow.example.com', password: 'EmployerPass123!' });
    const rawSarah = sarahRes.headers['set-cookie'] as unknown as string[];
    sarahOwnerCookie = Array.isArray(rawSarah) ? rawSarah.join('; ') : String(rawSarah);

    // Admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'admin@jobify.dev', password: 'AdminPass123!' });
    const rawAdmin = adminRes.headers['set-cookie'] as unknown as string[];
    adminCookie = Array.isArray(rawAdmin) ? rawAdmin.join('; ') : String(rawAdmin);

    const alexFile = await prisma.storedFile.findFirst({
      where: { owner: { email: 'alex.dev@jobify.dev' } },
    });
    alexResumeId = alexFile!.id;
  });

  describe('POST /api/v1/files/resume (Upload & Validation)', () => {
    it('successfully uploads valid PDF with authentic magic bytes', async () => {
      const validPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

      const res = await request(app)
        .post('/api/v1/files/resume')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', alexSeekerCookie)
        .attach('file', validPdfBuffer, 'My_Updated_Resume.pdf');

      expect(res.status).toBe(201);
      expect(res.body.data.file.originalName).toBe('My_Updated_Resume.pdf');
      expect(res.body.data.file.mimeType).toBe('application/pdf');
      expect(res.body.data.file.storageKey).toMatch(/\.pdf$/);
    });

    it('rejects upload with non-PDF extension', async () => {
      const textBuffer = Buffer.from('Just some text');

      const res = await request(app)
        .post('/api/v1/files/resume')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', alexSeekerCookie)
        .attach('file', textBuffer, 'malicious.exe');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
    });

    it('rejects file named .pdf but containing spoofed / invalid magic bytes', async () => {
      const fakePdfBuffer = Buffer.from('NOT_A_REAL_PDF_HEADER');

      const res = await request(app)
        .post('/api/v1/files/resume')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', alexSeekerCookie)
        .attach('file', fakePdfBuffer, 'fake.pdf');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_FILE_SIGNATURE');
    });

    it('rejects upload exceeding 5MB file limit', async () => {
      // 5.5 MB buffer with valid PDF header
      const oversizedBuffer = Buffer.alloc(5.5 * 1024 * 1024);
      oversizedBuffer.write('%PDF-1.4\n');

      const res = await request(app)
        .post('/api/v1/files/resume')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', alexSeekerCookie)
        .attach('file', oversizedBuffer, 'oversized.pdf');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('FILE_TOO_LARGE');
    });
  });

  describe('GET /api/v1/files/:id (Authorized Streaming)', () => {
    it('allows owner to download their own resume', async () => {
      const res = await request(app)
        .get(`/api/v1/files/${alexResumeId}`)
        .set('Cookie', alexSeekerCookie);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['content-disposition']).toContain('Alex_Rivera_Resume.pdf');
    });

    it('allows employer who received the application to download candidate resume', async () => {
      const res = await request(app)
        .get(`/api/v1/files/${alexResumeId}`)
        .set('Cookie', sarahOwnerCookie);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    it('allows admin to download any resume', async () => {
      const res = await request(app)
        .get(`/api/v1/files/${alexResumeId}`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
    });

    it('blocks unauthorized seeker from downloading another candidate resume', async () => {
      const res = await request(app)
        .get(`/api/v1/files/${alexResumeId}`)
        .set('Cookie', mayaSeekerCookie);

      expect(res.status).toBe(403);
    });

    it('returns authorized presigned / access URL for resume', async () => {
      const res = await request(app)
        .get(`/api/v1/files/${alexResumeId}/url`)
        .set('Cookie', alexSeekerCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.url).toBeDefined();
      expect(res.body.data.expiresInSeconds).toBe(900);
    });

    it('blocks unauthorized seeker from getting presigned URL for another resume', async () => {
      const res = await request(app)
        .get(`/api/v1/files/${alexResumeId}/url`)
        .set('Cookie', mayaSeekerCookie);

      expect(res.status).toBe(403);
    });
  });
});
