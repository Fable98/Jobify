import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/env';
import { NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export interface StorageProvider {
  save(key: string, buffer: Buffer, mimeType: string): Promise<void>;
  stream(key: string): Promise<{ stream: NodeJS.ReadableStream; sizeBytes: number; mimeType: string }>;
  delete(key: string): Promise<void>;
  getSignedUrl?(key: string, expiresInSeconds?: number): Promise<string>;
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
 * AWS S3 / Cloudflare R2 / MinIO Storage Provider.
 * Allows horizontal scaling across ephemeral compute instances.
 */
export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = env.S3_BUCKET || 'jobify-resumes';
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials:
        env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
          ? {
              accessKeyId: env.S3_ACCESS_KEY_ID,
              secretAccessKey: env.S3_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
    logger.info({ bucket: this.bucket, region: env.S3_REGION }, '[Storage] Initialized S3 storage provider');
  }

  async save(key: string, buffer: Buffer, mimeType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );
  }

  async stream(key: string): Promise<{ stream: NodeJS.ReadableStream; sizeBytes: number; mimeType: string }> {
    try {
      const res = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );

      if (!res.Body) {
        throw new NotFoundError('Underlying file object not found in S3 bucket');
      }

      return {
        stream: res.Body as unknown as NodeJS.ReadableStream,
        sizeBytes: res.ContentLength ?? 0,
        mimeType: res.ContentType ?? 'application/pdf',
      };
    } catch (err: any) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        throw new NotFoundError('File not found in S3 bucket');
      }
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  async getSignedUrl(key: string, expiresInSeconds = 900): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}

export function createStorageProvider(): StorageProvider {
  if (env.STORAGE_DRIVER === 's3' && env.S3_BUCKET) {
    return new S3StorageProvider();
  }
  return new LocalStorageProvider();
}

export const storageProvider: StorageProvider = createStorageProvider();
