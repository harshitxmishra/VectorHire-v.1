import { Redis, RedisOptions } from 'ioredis';
import { Logger } from '@nestjs/common';

const logger = new Logger('RedisConfig');

export interface RedisConnectionConfig {
  url?: string;
  host: string;
  port: number;
  password?: string;
  tls?: boolean;
}

/**
 * Bounded reconnect strategy for ioredis connection level.
 * Caps backoff at 3s and terminates reconnect storm after 20 attempts.
 * (Note: BullMQ job retries operate independently at queue level).
 */
export function calculateRedisReconnectDelay(times: number): number | null {
  if (times > 20) {
    logger.warn(`Redis connection retry limit reached (${times} attempts). Reconnect halted.`);
    return null;
  }
  // Linear-capped backoff: 100ms, 200ms ... up to 3000ms
  return Math.min(times * 100, 3000);
}

/**
 * Sanitizes Redis connection error strings to prevent leaking credentials or connection URLs.
 */
export function sanitizeRedisErrorMessage(message?: string): string {
  if (!message) return 'Unknown Redis connection error';
  return message
    .replace(/:\/\/[^:]+:[^@]+@/g, '://***:***@')
    .replace(/:\/\/[^@]+@/g, '://***@');
}

export function getRedisOptions(): RedisOptions {
  const redisUrl = process.env.REDIS_URL;

  const baseOptions: RedisOptions = {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: 10000, // 10s connection timeout
    keepAlive: 30000, // 30s TCP keepalive
    retryStrategy: calculateRedisReconnectDelay,
  };

  if (redisUrl) {
    const isTls = redisUrl.startsWith('rediss://') || process.env.REDIS_TLS === 'true';
    return {
      ...baseOptions,
      tls: isTls ? {} : undefined,
    };
  }

  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD || undefined;
  const isTls = process.env.REDIS_TLS === 'true';

  return {
    ...baseOptions,
    host,
    port,
    password,
    tls: isTls ? {} : undefined,
  };
}

export function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL;
  const options = getRedisOptions();

  const client = redisUrl ? new Redis(redisUrl, options) : new Redis(options);

  client.on('error', (err) => {
    // Avoid crashing on connection failures and sanitize logged error message
    const sanitized = sanitizeRedisErrorMessage(err.message);
    logger.warn(`Redis connection error: ${sanitized}`);
  });

  return client;
}
