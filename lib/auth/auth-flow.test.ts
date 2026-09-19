import { describe, it, expect } from 'vitest';
import { getAuthHeaders } from '@/lib/utils/api-client';

describe('Auth Helpers & Safe Redirect Validation', () => {
  it('returns explicit Bearer token header when tokenOverride is provided', async () => {
    const headers = await getAuthHeaders('test-jwt-token-xyz');
    expect(headers).toEqual({ Authorization: 'Bearer test-jwt-token-xyz' });
  });

  it('returns empty headers object when no token is present in non-browser context', async () => {
    const headers = await getAuthHeaders();
    expect(headers).toEqual({});
  });

  it('validates and sanitizes redirect paths to prevent open redirect vulnerabilities', () => {
    function getSafeRedirect(redirectParam: string | null): string {
      if (!redirectParam) return '/dashboard';
      if (redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
        return redirectParam;
      }
      return '/dashboard';
    }

    expect(getSafeRedirect('/candidates')).toBe('/candidates');
    expect(getSafeRedirect('/job-descriptions/123')).toBe('/job-descriptions/123');
    expect(getSafeRedirect(null)).toBe('/dashboard');
    expect(getSafeRedirect('')).toBe('/dashboard');
    expect(getSafeRedirect('https://evil.com')).toBe('/dashboard');
    expect(getSafeRedirect('//evil.com')).toBe('/dashboard');
    expect(getSafeRedirect('javascript:alert(1)')).toBe('/dashboard');
  });
});
