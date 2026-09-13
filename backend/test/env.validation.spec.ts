import { describe, it, expect } from 'vitest';
import { validateEnv } from '../src/config/env.validation';

describe('Environment Validation (Phase 5.2)', () => {
  const validMinimalEnv = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://xyzcompany.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhGciOi...secret-service-role-key...',
    REDIS_URL: 'redis://127.0.0.1:6379',
  };

  it('should succeed with valid minimal required environment variables', () => {
    const validated = validateEnv(validMinimalEnv);

    expect(validated.NEXT_PUBLIC_SUPABASE_URL).toBe('https://xyzcompany.supabase.co');
    expect(validated.SUPABASE_SERVICE_ROLE_KEY).toBe('eyJhGciOi...secret-service-role-key...');
    expect(validated.REDIS_URL).toBe('redis://127.0.0.1:6379');
    expect(validated.NODE_ENV).toBe('development');
    expect(validated.AI_PROVIDER).toBe('gemini');
  });

  it('should succeed with host-based Redis configuration and apply defaults', () => {
    const envWithHost = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://xyzcompany.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'eyJhGciOi...secret-service-role-key...',
      REDIS_HOST: 'redis-internal',
      REDIS_PORT: '6380',
    };

    const validated = validateEnv(envWithHost);

    expect(validated.REDIS_HOST).toBe('redis-internal');
    expect(validated.REDIS_PORT).toBe(6380);
  });

  it('should accept TLS Redis connection string (rediss://)', () => {
    const tlsEnv = {
      ...validMinimalEnv,
      REDIS_URL: 'rediss://default:mypassword@managed-redis.com:6380',
    };

    const validated = validateEnv(tlsEnv);
    expect(validated.REDIS_URL).toBe('rediss://default:mypassword@managed-redis.com:6380');
  });

  it('should fail fast if NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    const invalidEnv = {
      SUPABASE_SERVICE_ROLE_KEY: 'secret-key',
      REDIS_URL: 'redis://127.0.0.1:6379',
    };

    expect(() => validateEnv(invalidEnv)).toThrowError(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it('should fail fast if NEXT_PUBLIC_SUPABASE_URL is not a valid URL', () => {
    const invalidEnv = {
      NEXT_PUBLIC_SUPABASE_URL: 'not-a-valid-url',
      SUPABASE_SERVICE_ROLE_KEY: 'secret-key',
      REDIS_URL: 'redis://127.0.0.1:6379',
    };

    expect(() => validateEnv(invalidEnv)).toThrowError(/must be a valid URL/);
  });

  it('should fail fast if SUPABASE_SERVICE_ROLE_KEY is missing', () => {
    const invalidEnv = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://xyzcompany.supabase.co',
      REDIS_URL: 'redis://127.0.0.1:6379',
    };

    expect(() => validateEnv(invalidEnv)).toThrowError(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('should fail fast if REDIS_URL does not use redis:// or rediss:// protocol', () => {
    const invalidEnv = {
      ...validMinimalEnv,
      REDIS_URL: 'http://localhost:6379',
    };

    expect(() => validateEnv(invalidEnv)).toThrowError(/REDIS_URL must start with redis:\/\/ \(plain\) or rediss:\/\/ \(TLS\)/);
  });


  it('should never expose secret values in validation error output', () => {
    const secretValue = 'SUPER_CONFIDENTIAL_JWT_TOKEN_12345';
    const invalidEnv = {
      NEXT_PUBLIC_SUPABASE_URL: 'invalid-url',
      SUPABASE_SERVICE_ROLE_KEY: secretValue,
    };

    try {
      validateEnv(invalidEnv);
      expect.fail('Should have thrown validation error');
    } catch (err: any) {
      expect(err.message).not.toContain(secretValue);
      expect(err.message).toContain('NEXT_PUBLIC_SUPABASE_URL');
    }
  });

  it('should allow optional AI, email, and GitHub credentials to be absent without failure', () => {
    const envWithoutOptionals = {
      ...validMinimalEnv,
    };

    const validated = validateEnv(envWithoutOptionals);

    expect(validated.GEMINI_API_KEY).toBeUndefined();
    expect(validated.OPENAI_API_KEY).toBeUndefined();
    expect(validated.GMAIL_USER).toBeUndefined();
    expect(validated.GITHUB_TOKEN).toBeUndefined();
  });
});
