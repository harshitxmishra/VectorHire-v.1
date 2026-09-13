import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getRedisOptions,
  createRedisClient,
  calculateRedisReconnectDelay,
  sanitizeRedisErrorMessage,
} from '../src/queue/redis.config';

describe('RedisConfig Hardening (Phase 5.2)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should return default plain Redis options when no environment variables are set', () => {
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
    expect(options.connectTimeout).toBe(10000);
    expect(options.keepAlive).toBe(30000);
    expect(options.tls).toBeUndefined();
  });

  it('should configure plain TCP connection from redis:// URL without TLS', () => {
    process.env.REDIS_URL = 'redis://localhost:6379';

    const options = getRedisOptions();

    expect(options.tls).toBeUndefined();
    expect(options.maxRetriesPerRequest).toBeNull();
    expect(options.connectTimeout).toBe(10000);
    expect(options.keepAlive).toBe(30000);
  });

  it('should configure TLS connection from rediss:// URL', () => {
    process.env.REDIS_URL = 'rediss://default:mypassword@managed-redis.com:6380/0';

    const options = getRedisOptions();

    expect(options.tls).toBeDefined();
    expect(options.tls).toEqual({});
    expect(options.maxRetriesPerRequest).toBeNull();
  });

  it('should configure TLS when REDIS_TLS=true is set on host-based config', () => {
    delete process.env.REDIS_URL;
    process.env.REDIS_HOST = 'redis.internal.net';
    process.env.REDIS_PORT = '6380';
    process.env.REDIS_PASSWORD = 'super-secret-pw';
    process.env.REDIS_TLS = 'true';

    const options = getRedisOptions();

    expect(options.host).toBe('redis.internal.net');
    expect(options.port).toBe(6380);
    expect(options.password).toBe('super-secret-pw');
    expect(options.tls).toBeDefined();
    expect(options.tls).toEqual({});
  });

  it('should apply linear-capped backoff for reconnects and stop after 20 attempts', () => {
    expect(calculateRedisReconnectDelay(1)).toBe(100);
    expect(calculateRedisReconnectDelay(10)).toBe(1000);
    expect(calculateRedisReconnectDelay(20)).toBe(2000);
    expect(calculateRedisReconnectDelay(21)).toBeNull(); // Reconnect storm bounded
    expect(calculateRedisReconnectDelay(50)).toBeNull();
  });

  it('should sanitize credentials from Redis error messages', () => {
    const errorWithAuth = 'Connection to rediss://user:secretpassword123@redis-host.com:6380 failed: ECONNREFUSED';
    const sanitized = sanitizeRedisErrorMessage(errorWithAuth);

    expect(sanitized).not.toContain('secretpassword123');
    expect(sanitized).not.toContain('user');
    expect(sanitized).toContain('rediss://***@redis-host.com:6380');

    const simpleError = 'Connection failed: ECONNRESET';
    expect(sanitizeRedisErrorMessage(simpleError)).toBe('Connection failed: ECONNRESET');
    expect(sanitizeRedisErrorMessage(undefined)).toBe('Unknown Redis connection error');
  });

  it('should create an ioredis client instance and register error handler', () => {
    const client = createRedisClient();
    expect(client).toBeDefined();
    client.quit().catch(() => {});
  });
});
