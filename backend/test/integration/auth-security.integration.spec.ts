import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SupabaseAuthGuard } from '../../src/auth/auth.guard';
import { DestructiveConfirmationGuard } from '../../src/common/guards/destructive-confirmation.guard';
import { ExecutionContext, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('Authentication & Security RBAC Integration Boundary', () => {
  let guard: SupabaseAuthGuard;
  let destructiveGuard: DestructiveConfirmationGuard;
  let reflector: Reflector;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new SupabaseAuthGuard(reflector);
    destructiveGuard = new DestructiveConfirmationGuard();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  function createMockExecutionContext(headers: Record<string, string> = {}, isPublic = false): ExecutionContext {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic);

    const mockRequest: any = {
      headers,
      user: null,
    };

    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => ({}),
      }),
    } as unknown as ExecutionContext;
  }

  describe('Public Endpoints', () => {
    it('bypasses authentication for routes decorated with @Public()', async () => {
      const context = createMockExecutionContext({}, true);

      const canActivate = await guard.canActivate(context);
      expect(canActivate).toBe(true);
    });
  });

  describe('Protected Endpoints & Token Validation', () => {
    it('rejects unauthenticated requests in production with 401 Unauthorized', async () => {
      process.env.NODE_ENV = 'production';
      const context = createMockExecutionContext({}, false);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('STRICTLY IGNORES client role spoofing in production (x-demo-user / x-demo-role)', async () => {
      process.env.NODE_ENV = 'production';
      const context = createMockExecutionContext({
        'x-demo-user': '{"role":"SuperAdmin","email":"hacker@evil.com"}',
        'x-demo-role': 'Admin Workspace',
      }, false);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('provides safe server-controlled dev identity in local development fallback', async () => {
      process.env.NODE_ENV = 'development';
      const context = createMockExecutionContext({}, false);

      const canActivate = await guard.canActivate(context);
      expect(canActivate).toBe(true);

      const req = context.switchToHttp().getRequest<any>();
      expect(req.user).toEqual({
        id: 'dev-admin-01',
        email: 'admin@vectorhire.ai',
        role: 'Admin Workspace',
        isDemo: true,
      });
    });

    it('enforces x-confirm-destructive header on destructive operations', () => {
      const contextWithoutHeader = createMockExecutionContext({});
      expect(() => destructiveGuard.canActivate(contextWithoutHeader)).toThrow(BadRequestException);

      const contextWithHeader = createMockExecutionContext({
        'x-confirm-destructive': 'true',
      });
      expect(destructiveGuard.canActivate(contextWithHeader)).toBe(true);
    });
  });
});
