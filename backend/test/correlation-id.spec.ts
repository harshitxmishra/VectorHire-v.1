import { describe, it, expect } from 'vitest';
import { resolveCorrelationId } from '../src/common/utils/correlation-id.util';

describe('resolveCorrelationId', () => {
  it('should accept valid correlation IDs with alphanumeric characters, hyphens, and underscores', () => {
    const valid1 = 'corr-123_abc';
    const valid2 = 'abc-DEF-123_456';
    const valid3 = 'a'.repeat(64);

    expect(resolveCorrelationId(valid1)).toBe(valid1);
    expect(resolveCorrelationId(valid2)).toBe(valid2);
    expect(resolveCorrelationId(valid3)).toBe(valid3);
  });

  it('should generate a fresh UUID v4 when header is missing, undefined, or null', () => {
    const res1 = resolveCorrelationId(undefined);
    const res2 = resolveCorrelationId(null);
    const res3 = resolveCorrelationId('');

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(res1).toMatch(uuidRegex);
    expect(res2).toMatch(uuidRegex);
    expect(res3).toMatch(uuidRegex);
  });

  it('should reject invalid characters (e.g. spaces, special symbols, injection attempts) and return fresh UUID', () => {
    const invalidWithSpaces = 'corr 123';
    const invalidWithSpecial = 'corr$123!';
    const invalidWithQuotes = 'corr" OR 1=1 --';
    const invalidWithSlashes = 'corr/123\\456';

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(resolveCorrelationId(invalidWithSpaces)).toMatch(uuidRegex);
    expect(resolveCorrelationId(invalidWithSpecial)).toMatch(uuidRegex);
    expect(resolveCorrelationId(invalidWithQuotes)).toMatch(uuidRegex);
    expect(resolveCorrelationId(invalidWithSlashes)).toMatch(uuidRegex);
  });

  it('should reject IDs exceeding 64 characters and return fresh UUID', () => {
    const tooLong = 'a'.repeat(65);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(resolveCorrelationId(tooLong)).toMatch(uuidRegex);
  });

  it('should handle array header values by taking the first entry', () => {
    const validArray = ['corr-array-1', 'corr-array-2'];
    expect(resolveCorrelationId(validArray)).toBe('corr-array-1');

    const invalidArray = ['corr with spaces', 'valid-corr'];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(resolveCorrelationId(invalidArray)).toMatch(uuidRegex);
  });
});
