import fs from 'fs';
import path from 'path';
import { env } from '../../config/env';
import { NotFoundError } from '../../utils/errors';

export interface StorageProvider {
  save(key: string, buffer: Buffer, mimeType: string): Promise<void>;
  stream(key: string): Promise<{ stream: NodeJS.ReadableStream; sizeBytes: number; mimeType: string }>;
  delete(key: string): Promise<void>;
}

/**
 * Local disk storage implementation.
 * Stores files outside the web root (e.g. backend/uploads) to prevent direct public URL access.
 */
export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(uploadDir = env.UPLOAD_DIR) {
    this.baseDir = path.resolve(process.cwd(), uploadDir);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async save(key: string, buffer: Buffer): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    await fs.promises.writeFile(filePath, buffer);
  }

  async stream(key: string): Promise<{ stream: NodeJS.ReadableStream; sizeBytes: number; mimeType: string }> {
    const filePath = path.join(this.baseDir, key);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundError('Underlying file not found on storage device');
    }

    const stat = await fs.promises.stat(filePath);
    const readStream = fs.createReadStream(filePath);
    return {
      stream: readStream,
      sizeBytes: stat.size,
      mimeType: 'application/pdf',
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}

/**
 * S3 Storage Provider Reference Implementation:
 *
 * To enable Amazon S3 / Cloudflare R2 / MinIO:
 * 1. Install @aws-sdk/client-s3
 * 2. Implement the StorageProvider interface:
 *
 * export class S3StorageProvider implements StorageProvider {
 *   private client = new S3Client({ region: env.AWS_REGION });
 *   async save(key: string, buffer: Buffer, mimeType: string) {
 *     await this.client.send(new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, Body: buffer, ContentType: mimeType }));
 *   }
 *   async stream(key: string) {
 *     const res = await this.client.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
 *     return { stream: res.Body as NodeJS.ReadableStream, sizeBytes: res.ContentLength ?? 0, mimeType: res.ContentType ?? 'application/pdf' };
 *   }
 *   async delete(key: string) {
 *     await this.client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
 *   }
 * }
 */

export const storageProvider: StorageProvider = new LocalStorageProvider();
