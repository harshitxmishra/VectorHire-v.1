import { Logger } from '@nestjs/common';

export interface StructuredTelemetryFields {
  event: string;
  timestamp: string;
  correlationId?: string;
  queue?: string;
  jobId?: string;
  jobName?: string;
  durationMs?: number;
  attempt?: number;
  maxAttempts?: number;
  status?: string;
  errorCode?: string;
  errorCategory?: string;
  worker?: string;
}

/**
 * Strict allowlist of permitted telemetry fields.
 * Any other field (candidate info, emails, tokens, payloads, stack traces) is explicitly dropped.
 */
export const ALLOWED_TELEMETRY_KEYS: ReadonlySet<keyof StructuredTelemetryFields> = new Set([
  'event',
  'timestamp',
  'correlationId',
  'queue',
  'jobId',
  'jobName',
  'durationMs',
  'attempt',
  'maxAttempts',
  'status',
  'errorCode',
  'errorCategory',
  'worker',
]);

/**
 * Categorizes an error into a safe, high-level operational category.
 */
export function categorizeError(err: unknown): string {
  if (!err) return 'unknown_error';

  const message = (err instanceof Error ? err.message : String(err)).toLowerCase();

  if (message.includes('timeout') || message.includes('timed out') || message.includes('abort')) {
    return 'timeout';
  }
  if (message.includes('rate limit') || message.includes('429') || message.includes('too many requests')) {
    return 'rate_limit_error';
  }
  if (
    message.includes('auth') ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('token') ||
    message.includes('key') ||
    message.includes('credential')
  ) {
    return 'auth_error';
  }
  if (message.includes('not found') || message.includes('404')) {
    return 'not_found';
  }
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('bad request') ||
    message.includes('parse') ||
    message.includes('header')
  ) {
    return 'validation_error';
  }
  if (
    message.includes('database') ||
    message.includes('postgres') ||
    message.includes('sql') ||
    message.includes('constraint') ||
    message.includes('relation')
  ) {
    return 'database_error';
  }
  if (
    message.includes('econnrefused') ||
    message.includes('etimedout') ||
    message.includes('enotfound') ||
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('fetch failed')
  ) {
    return 'network_error';
  }
  if (
    message.includes('gemini') ||
    message.includes('github') ||
    message.includes('smtp') ||
    message.includes('openai') ||
    message.includes('provider')
  ) {
    return 'provider_error';
  }

  return 'internal_error';
}

/**
 * Sanitizes an error message for safe exposure without leaking internal filepaths,
 * SQL queries, API keys, or candidate PII.
 */
export function sanitizeJobErrorMessage(failedReason?: string): string {
  if (!failedReason) {
    return 'An unexpected error occurred during processing';
  }

  const lower = failedReason.toLowerCase();

  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'Processing timed out';
  }
  if (lower.includes('rate limit') || lower.includes('429')) {
    return 'Service temporarily rate limited. Please retry later.';
  }
  if (
    lower.includes('token') ||
    lower.includes('key') ||
    lower.includes('credential') ||
    lower.includes('unauthorized') ||
    lower.includes('forbidden')
  ) {
    return 'External service authentication error';
  }
  if (lower.includes('no valid candidate rows')) {
    return 'Invalid CSV format or missing required headers';
  }
  if (lower.includes('ssrf') || lower.includes('private ip') || lower.includes('restricted')) {
    return 'Invalid or inaccessible resource URL';
  }
  if (lower.includes('not found') || lower.includes('candidate not found')) {
    return 'Candidate not found';
  }
  if (lower.includes('smtp') || lower.includes('mail')) {
    return 'Email delivery service error';
  }
  if (lower.includes('demonstrator intentional failure')) {
    return 'Demonstrator intentional failure';
  }

  return 'An error occurred during processing';
}

export class StructuredLogger {
  private readonly logger: Logger;
  private readonly workerName: string;

  constructor(workerName: string) {
    this.workerName = workerName;
    this.logger = new Logger(workerName);
  }

  /**
   * Filters and formats an event object using only allowlisted telemetry keys.
   */
  public sanitizeTelemetry(input: Record<string, any>): StructuredTelemetryFields {
    const sanitized: Partial<StructuredTelemetryFields> = {
      timestamp: new Date().toISOString(),
      worker: this.workerName,
    };

    for (const key of Object.keys(input) as Array<keyof StructuredTelemetryFields>) {
      if (ALLOWED_TELEMETRY_KEYS.has(key) && input[key] !== undefined) {
        (sanitized as any)[key] = input[key];
      }
    }

    if (!sanitized.event) {
      sanitized.event = 'operational.event';
    }

    return sanitized as StructuredTelemetryFields;
  }

  public logEvent(fields: Partial<StructuredTelemetryFields> & { event: string }): void {
    const payload = this.sanitizeTelemetry(fields);
    this.logger.log(JSON.stringify(payload));
  }

  public logJobStarted(params: {
    queue: string;
    jobId?: string;
    jobName?: string;
    correlationId?: string;
    attempt?: number;
    maxAttempts?: number;
  }): void {
    this.logEvent({
      event: 'queue.job.started',
      queue: params.queue,
      jobId: params.jobId,
      jobName: params.jobName,
      correlationId: params.correlationId,
      attempt: params.attempt ?? 1,
      maxAttempts: params.maxAttempts,
      status: 'active',
    });
  }

  public logJobCompleted(params: {
    queue: string;
    jobId?: string;
    jobName?: string;
    correlationId?: string;
    durationMs: number;
    attempt?: number;
    maxAttempts?: number;
  }): void {
    this.logEvent({
      event: 'queue.job.completed',
      queue: params.queue,
      jobId: params.jobId,
      jobName: params.jobName,
      correlationId: params.correlationId,
      durationMs: params.durationMs,
      attempt: params.attempt ?? 1,
      maxAttempts: params.maxAttempts,
      status: 'completed',
    });
  }

  public logJobFailed(params: {
    queue: string;
    jobId?: string;
    jobName?: string;
    correlationId?: string;
    durationMs: number;
    error: unknown;
    attempt?: number;
    maxAttempts?: number;
  }): void {
    const errorCategory = categorizeError(params.error);
    const isRetrying =
      params.attempt !== undefined &&
      params.maxAttempts !== undefined &&
      params.attempt < params.maxAttempts;

    this.logEvent({
      event: isRetrying ? 'queue.job.retrying' : 'queue.job.failed',
      queue: params.queue,
      jobId: params.jobId,
      jobName: params.jobName,
      correlationId: params.correlationId,
      durationMs: params.durationMs,
      attempt: params.attempt ?? 1,
      maxAttempts: params.maxAttempts,
      status: isRetrying ? 'retrying' : 'failed',
      errorCategory,
    });
  }

  public logProcessFatal(params: {
    event: string;
    error: unknown;
    errorCode?: string;
  }): void {
    const errorCategory = categorizeError(params.error);
    this.logEvent({
      event: params.event,
      status: 'fatal',
      errorCategory,
      errorCode: params.errorCode,
    });
  }
}
