import dotenv from 'dotenv';
dotenv.config();

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5001),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  TEST_DATABASE_URL: z.string().optional(),
  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 characters'),
  CSRF_HEADER_NAME: z.string().default('X-Requested-With'),
  
  // Storage Configuration
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_BYTES: z.coerce.number().default(5242880), // 5MB
  
  // S3 / Cloudflare R2 / MinIO
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),

  // Redis Distributed Cache & Sessions
  REDIS_URL: z.string().default('redis://localhost:6379'),
  ENABLE_REDIS: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),

  // Transactional Email Service
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Jobify <notifications@jobify.dev>'),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = (() => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid environment configuration:', JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
  }
  return parsed.data;
})();
