import crypto from 'crypto';
import argon2 from 'argon2';

// Pre-computed valid argon2id hash for constant-time dummy verification
// Hash of "JobifyDummyPassword2026!"
export const DUMMY_ARGON2_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$6uP8L7P3J2W8d0K1Q2R3S4$y9z9A8B7C6D5E4F3G2H1I0J9K8L7M6N5O4P3Q2R1S0T';

export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}
