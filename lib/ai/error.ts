import { AIProviderError } from '@/lib/ai/types';

/**
 * Converts any thrown error into a recruiter-safe message. Our own
 * deliberate, user-actionable errors (candidate not found, no GitHub URL,
 * GitHub API 404, etc.) pass through unchanged. Anything originating from
 * an AI provider (rate limits, timeouts, malformed responses) is replaced
 * with a generic message — raw provider errors are never shown to the
 * recruiter, only logged server-side.
 */
export function friendlyAIErrorMessage(error: unknown): string {
  if (error instanceof AIProviderError) {
    return 'AI analysis is temporarily unavailable. Please try again shortly.';
  }

  if (error instanceof Error && /AI request failed across all configured providers/i.test(error.message)) {
    return 'AI analysis is temporarily unavailable. Please try again shortly.';
  }

  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
