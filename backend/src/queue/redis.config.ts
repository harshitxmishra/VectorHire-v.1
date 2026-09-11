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

export function getRedisOptions(): RedisOptions {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    return {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy(times: number) {
        // Linear-capped backoff: 100ms, 200ms ... up to 3s
        return Math.min(times * 100, 3000);
      },
      tls: redisUrl.startsWith('rediss://') ? {} : undefined,
    };
  }

  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD || undefined;
  const tls = process.env.REDIS_TLS === 'true';

  return {
    host,
    port,
    password,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy(times: number) {
      return Math.min(times * 100, 3000);
    },
    tls: tls ? {} : undefined,
  };
}

export function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL;
  const options = getRedisOptions();

  const client = redisUrl ? new Redis(redisUrl, options) : new Redis(options);

  client.on('error', (err) => {
    // Avoid crashing on connection failures when Redis is offline
    logger.warn(`Redis connection error: ${err.message}`);
  });

  return client;
}
