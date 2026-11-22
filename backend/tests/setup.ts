import dotenv from 'dotenv';
import path from 'path';

// Load .env if present
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Enforce test database requirement
process.env.NODE_ENV = 'test';
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
} else if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://hirehub:hirehub_secret@localhost:5435/hirehub_test?schema=public';
}

if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'test_session_secret_min32chars_secure_test_12345';
}

// Safety check: tests refuse to run if DATABASE_URL isn't a test DB
if (!process.env.DATABASE_URL.includes('test')) {
  throw new Error(
    `[SECURITY GUARD] Tests refused to run: DATABASE_URL must point to a test database (must contain 'test'). Got: ${process.env.DATABASE_URL}`
  );
}
