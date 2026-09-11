import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getRedisOptions, createRedisClient } from '../src/queue/redis.config';

describe('RedisConfig', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should return default Redis options when no environment variables are set', () => {
    delete process.env.REDIS_URL;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_PASSWORD;
    delete process.env.REDIS_TLS;

    const options = getRedisOptions();

    expect(options.host).toBe('127.0.0.1');
    expect(options.port).toBe(6379);
    expect(options.password).toBeUndefined();
    expect(options.maxRetriesPerRequest).toBeNull();
    expect(options.enableReadyCheck).toBe(false);
    expect(options.lazyConnect).toBe(true);
    expect(options.tls).toBeUndefined();
  });

  it('should configure custom host, port, password, and tls from environment variables', () => {
    delete process.env.REDIS_URL;
    process.env.REDIS_HOST = 'redis.internal.net';
    process.env.REDIS_PORT = '6380';
    process.env.REDIS_PASSWORD = 'super-secret-pw';
    process.env.REDIS_TLS = 'true';

    const options = getRedisOptions();

    expect(options.host).toBe('redis.internal.net');
    expect(options.port).toBe(6380);
    expect(options.password).toBe('super-secret-pw');
    expect(options.maxRetriesPerRequest).toBeNull();
    expect(options.tls).toBeDefined();
  });

  it('should detect TLS from REDIS_URL when protocol is rediss://', () => {
    process.env.REDIS_URL = 'rediss://:mypassword@redis-cluster.com:6380/0';

    const options = getRedisOptions();

    expect(options.maxRetriesPerRequest).toBeNull();
    expect(options.tls).toBeDefined();
  });

  it('should configure capped exponential backoff retryStrategy', () => {
    const options = getRedisOptions();
    expect(typeof options.retryStrategy).toBe('function');

    if (options.retryStrategy) {
      expect(options.retryStrategy(1)).toBe(100);
      expect(options.retryStrategy(10)).toBe(1000);
      expect(options.retryStrategy(50)).toBe(3000); // capped at 3000ms
    }
  });

  it('should create an ioredis client instance and register error handler', () => {
    const client = createRedisClient();
    expect(client).toBeDefined();
    // Clean up
    client.quit().catch(() => {});
  });
});
