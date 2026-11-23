import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

class RedisService {
  private client: Redis | null = null;
  private isConnected = false;

  constructor() {
    if (env.ENABLE_REDIS && env.NODE_ENV !== 'test') {
      try {
        this.client = new Redis(env.REDIS_URL, {
          maxRetriesPerRequest: 2,
          retryStrategy(times) {
            if (times > 5) {
              logger.warn({ times }, '[Redis] Connection retry limit reached. Disabling Redis cache.');
              return null; // Stop retrying
            }
            return Math.min(times * 200, 2000);
          },
          lazyConnect: true,
        });

        this.client.on('connect', () => {
          this.isConnected = true;
          logger.info('[Redis] Successfully connected to Redis server');
        });

        this.client.on('error', (err) => {
          this.isConnected = false;
          logger.warn({ err: err.message }, '[Redis] Error occurred in Redis client');
        });

        this.client.on('close', () => {
          this.isConnected = false;
        });

        this.client.connect().catch((err) => {
          logger.warn({ err: err.message }, '[Redis] Initial connection to Redis failed. Falling back to DB queries.');
        });
      } catch (err: any) {
        logger.warn({ err: err.message }, '[Redis] Failed to initialize Redis client');
      }
    }
  }

  public isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) return null;
    try {
      return await this.client!.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client!.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client!.set(key, value);
      }
    } catch {
      // Non-blocking fallback
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await this.client!.del(key);
    } catch {
      // Non-blocking fallback
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length > 0) {
        await this.client!.del(...keys);
      }
    } catch {
      // Non-blocking fallback
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => {});
      this.client = null;
      this.isConnected = false;
    }
  }
}

export const redisService = new RedisService();
