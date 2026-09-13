import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Controller, Get, Post, Body, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule, ThrottlerGuard, Throttle, SkipThrottle } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import helmet from 'helmet';
import * as express from 'express';

@Controller('test-security')
class TestSecurityController {
  @Post('standard')
  testStandard(@Body() body: any) {
    return { received: true, size: JSON.stringify(body).length };
  }

  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @Post('throttled-tight')
  testTight() {
    return { ok: true };
  }

  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @Get('polling')
  testPolling() {
    return { ok: true };
  }

  @SkipThrottle()
  @Get('health-exempt')
  testExempt() {
    return { status: 'ok' };
  }
}

describe('Phase 5.1 Security Hardening & Throttling', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: 60000,
            limit: 10,
          },
        ]),
      ],
      controllers: [TestSecurityController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication({
      bodyParser: false,
    });

    // Helmet security headers
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      })
    );

    // Body size parser limits: 1MB
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ limit: '1mb', extended: true }));

    // CORS configuration with x-correlation-id
    app.enableCors({
      origin: ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'x-confirm-destructive',
        'x-demo-user',
        'x-correlation-id',
      ],
      exposedHeaders: ['x-correlation-id'],
      credentials: true,
    });

    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('5.1.1 Helmet Security Headers', () => {
    it('should include standard security headers in HTTP responses', async () => {
      const res = await request(app.getHttpServer()).get('/test-security/health-exempt');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['x-dns-prefetch-control']).toBe('off');
      expect(res.headers['x-download-options']).toBe('noopen');
      expect(res.headers['x-permitted-cross-domain-policies']).toBe('none');
    });
  });

  describe('5.1.2 Request Body Limits', () => {
    it('should accept JSON request body <= 1MB', async () => {
      const smallPayload = { data: 'a'.repeat(5000) }; // ~5KB
      const res = await request(app.getHttpServer())
        .post('/test-security/standard')
        .send(smallPayload)
        .expect(201);

      expect(res.body.received).toBe(true);
    });

    it('should reject JSON request body > 1MB with 413 Payload Too Large', async () => {
      const largePayload = { data: 'x'.repeat(1.2 * 1024 * 1024) }; // ~1.2MB
      const res = await request(app.getHttpServer())
        .post('/test-security/standard')
        .send(largePayload);

      expect(res.status).toBe(413);
    });
  });

  describe('5.1.3 Granular API Throttling', () => {
    it('should block repeated requests to tight endpoint with 429 after exceeding limit', async () => {
      // Limit is 2 req/min
      const res1 = await request(app.getHttpServer()).post('/test-security/throttled-tight');
      expect(res1.status).toBe(201);

      const res2 = await request(app.getHttpServer()).post('/test-security/throttled-tight');
      expect(res2.status).toBe(201);

      const res3 = await request(app.getHttpServer()).post('/test-security/throttled-tight');
      expect(res3.status).toBe(429);
      expect(res3.body.message).toContain('ThrottlerException');
    });

    it('should allow polling endpoint with generous headroom', async () => {
      for (let i = 0; i < 5; i++) {
        const res = await request(app.getHttpServer()).get('/test-security/polling');
        expect(res.status).toBe(200);
      }
    });

    it('should never throttle @SkipThrottle() health endpoint', async () => {
      for (let i = 0; i < 15; i++) {
        const res = await request(app.getHttpServer()).get('/test-security/health-exempt');
        expect(res.status).toBe(200);
      }
    });
  });

  describe('5.1.4 CORS Configuration', () => {
    it('should permit x-correlation-id in preflight OPTIONS request', async () => {
      const res = await request(app.getHttpServer())
        .options('/test-security/standard')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'x-correlation-id, content-type');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(res.headers['access-control-allow-headers']).toContain('x-correlation-id');
    });
  });
});
