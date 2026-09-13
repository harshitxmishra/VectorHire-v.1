import { randomUUID } from 'crypto';

const CORRELATION_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

/**
 * Validates and extracts a correlation ID from request headers or input.
 * Accepts only alphanumeric characters, hyphens, and underscores up to 64 characters.
 * Falls back to generating a fresh UUID v4 if missing, empty, or containing invalid characters.
 */
export function resolveCorrelationId(headerValue?: string | string[] | null): string {
  if (!headerValue) {
    return randomUUID();
  }

  const candidate = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (typeof candidate !== 'string') {
    return randomUUID();
  }

  const trimmed = candidate.trim();
  if (!trimmed || trimmed.length > 64 || !CORRELATION_ID_REGEX.test(trimmed)) {
    return randomUUID();
  }

  return trimmed;
}
