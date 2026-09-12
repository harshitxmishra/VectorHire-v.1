import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  StructuredLogger,
  categorizeError,
  sanitizeJobErrorMessage,
  ALLOWED_TELEMETRY_KEYS,
} from '../src/common/logging/structured-logger.service';

describe('StructuredLogger and Telemetry Sanitization', () => {
  let logger: StructuredLogger;

  beforeEach(() => {
    logger = new StructuredLogger('TestWorker');
  });

  it('should strictly filter telemetry to allowlisted keys and drop sensitive fields', () => {
    const inputWithPII = {
      event: 'queue.job.started',
      queue: 'resume-processing-queue',
      jobId: 'job-123',
      correlationId: 'corr-xyz-123',
      attempt: 1,
      maxAttempts: 3,
      // Sensitive / unallowed fields that MUST be dropped:
      candidateName: 'John Doe',
      candidateEmail: 'john@example.com',
      candidatePhone: '+1-555-0199',
      resumeText: 'Detailed candidate resume content with private information...',
      githubToken: 'ghp_secretToken1234567890',
      apiKey: 'AIzaSySecretApiKey',
      htmlBody: '<h1>Offer Letter for John Doe</h1>',
      password: 'supersecretpassword',
      rawPayload: { deep: 'nested object' },
      stackTrace: 'Error at /backend/src/secret-path/db.ts:45',
    };

    const sanitized = logger.sanitizeTelemetry(inputWithPII);

    expect(sanitized.event).toBe('queue.job.started');
    expect(sanitized.queue).toBe('resume-processing-queue');
    expect(sanitized.jobId).toBe('job-123');
    expect(sanitized.correlationId).toBe('corr-xyz-123');
    expect(sanitized.attempt).toBe(1);
    expect(sanitized.maxAttempts).toBe(3);
    expect(sanitized.worker).toBe('TestWorker');
    expect(sanitized.timestamp).toBeDefined();

    // Verify all disallowed keys are absent
    expect((sanitized as any).candidateName).toBeUndefined();
    expect((sanitized as any).candidateEmail).toBeUndefined();
    expect((sanitized as any).candidatePhone).toBeUndefined();
    expect((sanitized as any).resumeText).toBeUndefined();
    expect((sanitized as any).githubToken).toBeUndefined();
    expect((sanitized as any).apiKey).toBeUndefined();
    expect((sanitized as any).htmlBody).toBeUndefined();
    expect((sanitized as any).password).toBeUndefined();
    expect((sanitized as any).rawPayload).toBeUndefined();
    expect((sanitized as any).stackTrace).toBeUndefined();

    // Verify every key in sanitized is in ALLOWED_TELEMETRY_KEYS
    for (const key of Object.keys(sanitized)) {
      expect(ALLOWED_TELEMETRY_KEYS.has(key as any)).toBe(true);
    }
  });

  it('should categorize errors into safe operational categories', () => {
    expect(categorizeError(new Error('Connection timed out after 5000ms'))).toBe('timeout');
    expect(categorizeError(new Error('GitHub API rate limit exceeded: 429'))).toBe('rate_limit_error');
    expect(categorizeError(new Error('Invalid API key token provided'))).toBe('auth_error');
    expect(categorizeError(new Error('Candidate with id 999 not found'))).toBe('not_found');
    expect(categorizeError(new Error('Validation failed: missing header'))).toBe('validation_error');
    expect(categorizeError(new Error('Postgres unique constraint violation'))).toBe('database_error');
    expect(categorizeError(new Error('ECONNREFUSED 127.0.0.1:6379'))).toBe('network_error');
    expect(categorizeError(new Error('Gemini model generation failed'))).toBe('provider_error');
    expect(categorizeError(new Error('SMTP send mail timeout'))).toBe('timeout');
    expect(categorizeError(new Error('Unknown unexpected failure'))).toBe('internal_error');
    expect(categorizeError(null)).toBe('unknown_error');
  });

  it('should sanitize job error messages for safe user exposure', () => {
    expect(sanitizeJobErrorMessage('Connection timed out to external host')).toBe('Processing timed out');
    expect(sanitizeJobErrorMessage('Rate limit reached (429)')).toBe(
      'Service temporarily rate limited. Please retry later.'
    );
    expect(sanitizeJobErrorMessage('Invalid token or API key')).toBe(
      'External service authentication error'
    );
    expect(sanitizeJobErrorMessage('No valid candidate rows in CSV')).toBe(
      'Invalid CSV format or missing required headers'
    );
    expect(sanitizeJobErrorMessage('Blocked SSRF request to private IP')).toBe(
      'Invalid or inaccessible resource URL'
    );
    expect(sanitizeJobErrorMessage('Candidate not found in repository')).toBe('Candidate not found');
    expect(sanitizeJobErrorMessage('SMTP Connection error')).toBe('Email delivery service error');
    expect(sanitizeJobErrorMessage('Demonstrator intentional failure for testing')).toBe(
      'Demonstrator intentional failure'
    );
    expect(
      sanitizeJobErrorMessage(
        'SQL error: SELECT * FROM users WHERE password_hash = "secret" failed at /app/src/db.ts:12'
      )
    ).toBe('An error occurred during processing');
    expect(sanitizeJobErrorMessage(undefined)).toBe('An unexpected error occurred during processing');
  });

  it('should emit structured logs on job started, completed, and failed', () => {
    const logSpy = vi.spyOn((logger as any).logger, 'log').mockImplementation(() => {});

    logger.logJobStarted({
      queue: 'ai-evaluation-queue',
      jobId: 'job-ai-1',
      jobName: 'ai.evaluate',
      correlationId: 'corr-1',
      attempt: 1,
      maxAttempts: 3,
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const startPayload = JSON.parse(logSpy.mock.calls[0][0]);
    expect(startPayload.event).toBe('queue.job.started');
    expect(startPayload.queue).toBe('ai-evaluation-queue');
    expect(startPayload.jobId).toBe('job-ai-1');
    expect(startPayload.status).toBe('active');

    logger.logJobCompleted({
      queue: 'ai-evaluation-queue',
      jobId: 'job-ai-1',
      jobName: 'ai.evaluate',
      correlationId: 'corr-1',
      durationMs: 450,
      attempt: 1,
      maxAttempts: 3,
    });

    expect(logSpy).toHaveBeenCalledTimes(2);
    const completePayload = JSON.parse(logSpy.mock.calls[1][0]);
    expect(completePayload.event).toBe('queue.job.completed');
    expect(completePayload.durationMs).toBe(450);
    expect(completePayload.status).toBe('completed');

    logger.logJobFailed({
      queue: 'ai-evaluation-queue',
      jobId: 'job-ai-1',
      jobName: 'ai.evaluate',
      correlationId: 'corr-1',
      durationMs: 120,
      error: new Error('Gemini API timeout'),
      attempt: 1,
      maxAttempts: 3,
    });

    expect(logSpy).toHaveBeenCalledTimes(3);
    const retryPayload = JSON.parse(logSpy.mock.calls[2][0]);
    expect(retryPayload.event).toBe('queue.job.retrying');
    expect(retryPayload.status).toBe('retrying');
    expect(retryPayload.errorCategory).toBe('timeout');

    logger.logJobFailed({
      queue: 'ai-evaluation-queue',
      jobId: 'job-ai-1',
      jobName: 'ai.evaluate',
      correlationId: 'corr-1',
      durationMs: 120,
      error: new Error('Gemini API timeout'),
      attempt: 3,
      maxAttempts: 3,
    });

    expect(logSpy).toHaveBeenCalledTimes(4);
    const failedPayload = JSON.parse(logSpy.mock.calls[3][0]);
    expect(failedPayload.event).toBe('queue.job.failed');
    expect(failedPayload.status).toBe('failed');
    expect(failedPayload.errorCategory).toBe('timeout');
  });
});
