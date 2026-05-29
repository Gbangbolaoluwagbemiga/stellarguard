import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { config } from '../config';

@Injectable()
export class CacheService {
  private redis: Redis;
  private readonly logger = new Logger(CacheService.name);

  constructor() {
    this.redis = new Redis(config.redisUrl);
    this.redis.on('error', (err) =>
      this.logger.error('Redis client error', err),
    );
    this.redis.on('connect', () =>
      this.logger.log('Connected to Redis'),
    );
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 60): Promise<void> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Error invalidating cache pattern ${pattern}:`, error);
    }
  }

  async flush(): Promise<void> {
    try {
      await this.redis.flushdb();
      this.logger.log('Redis cache flushed');
    } catch (error) {
      this.logger.error('Error flushing Redis cache:', error);
    }
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
