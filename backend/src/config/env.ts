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
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_BYTES: z.coerce.number().default(5242880), // 5MB
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
