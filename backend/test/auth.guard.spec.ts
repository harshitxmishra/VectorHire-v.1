import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ExecutionContext, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseAuthGuard } from '../src/auth/auth.guard';
import { DestructiveConfirmationGuard } from '../src/common/guards/destructive-confirmation.guard';

describe('SupabaseAuthGuard & DestructiveConfirmationGuard', () => {
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
    const req: any = {
      headers,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  it('should allow public endpoints without authentication', async () => {
    const context = createMockExecutionContext({}, true);
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should reject unauthenticated requests in production with 401 Unauthorized', async () => {
    process.env.NODE_ENV = 'production';
    const context = createMockExecutionContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should NOT trust client-supplied role or workspace headers in production', async () => {
    process.env.NODE_ENV = 'production';
    const context = createMockExecutionContext({
      'x-demo-user': '{"role":"SuperAdmin","id":"fake"}',
      'x-demo-role': 'Admin Workspace',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should provide safe server-controlled dev identity in local development fallback', async () => {
    process.env.NODE_ENV = 'development';
    const context = createMockExecutionContext({});

    const result = await guard.canActivate(context);
    expect(result).toBe(true);

    const req = context.switchToHttp().getRequest<any>();
    expect(req.user).toEqual({
      id: 'dev-admin-01',
      email: 'admin@vectorhire.ai',
      role: 'Admin Workspace',
      isDemo: true,
    });
  });

  it('should enforce x-confirm-destructive header on destructive operations', () => {
    const contextWithoutHeader = createMockExecutionContext({});
    expect(() => destructiveGuard.canActivate(contextWithoutHeader)).toThrow(BadRequestException);

    const contextWithHeader = createMockExecutionContext({
      'x-confirm-destructive': 'true',
    });
    expect(destructiveGuard.canActivate(contextWithHeader)).toBe(true);
  });
});
