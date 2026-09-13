import { describe, it, expect } from 'vitest';
import { requireDestructiveConfirmation, verifyServerAuth } from './server-auth';

describe('requireDestructiveConfirmation', () => {
  it('returns confirmed: true when x-confirm-destructive header is set to true', () => {
    const req = new Request('http://localhost/api/candidates', {
      method: 'DELETE',
      headers: { 'x-confirm-destructive': 'true' },
    });
    const result = requireDestructiveConfirmation(req);
    expect(result.confirmed).toBe(true);
    expect(result.response).toBeUndefined();
  });

  it('rejects with 400 when x-confirm-destructive header is missing or false', () => {
    const reqWithoutHeader = new Request('http://localhost/api/candidates', { method: 'DELETE' });
    const result1 = requireDestructiveConfirmation(reqWithoutHeader);
    expect(result1.confirmed).toBe(false);
    expect(result1.response).toBeDefined();

    const reqWithFalse = new Request('http://localhost/api/candidates', {
      method: 'DELETE',
      headers: { 'x-confirm-destructive': 'false' },
    });
    const result2 = requireDestructiveConfirmation(reqWithFalse);
    expect(result2.confirmed).toBe(false);
  });
});

describe('verifyServerAuth', () => {
  it('provides fixed server identity in dev mode and does NOT trust client x-demo-user headers', async () => {
    const req = new Request('http://localhost/api/candidates', {
      headers: { 'x-demo-user': '{"role":"FakeAdmin","email":"hacker@evil.com"}' },
    });

    const result = await verifyServerAuth(req);
    expect(result.authorized).toBe(true);
    expect(result.user?.id).toBe('dev-admin-01');
    expect(result.user?.email).toBe('admin@vectorhire.ai');
    expect(result.user?.role).toBe('Admin Workspace');
  });

  it('rejects unauthenticated requests and ignores client demo headers in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

    const req = new Request('http://localhost/api/candidates', {
      headers: { 'x-demo-user': '{"role":"FakeAdmin","email":"hacker@evil.com"}' },
    });

    const result = await verifyServerAuth(req);
    expect(result.authorized).toBe(false);
    expect(result.user).toBeNull();
    expect(result.response?.status).toBe(401);

    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  });
});
