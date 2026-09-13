import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupProcessSafety } from '../src/common/process/process-safety';
import { StructuredLogger, ALLOWED_TELEMETRY_KEYS } from '../src/common/logging/structured-logger.service';

describe('Phase 5.1 Process Safety & Lifecycle', () => {
  let mockExit: any;
  let processListeners: Record<string, Function[]> = {};

  beforeEach(() => {
    processListeners = {};
    mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    vi.spyOn(process, 'on').mockImplementation((event: string, listener: any) => {
      if (!processListeners[event]) {
        processListeners[event] = [];
      }
      processListeners[event].push(listener);
      return process;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('5.1.5 Uncaught Exception / Unhandled Rejection Safety', () => {
    it('attaches process listeners for uncaughtException and unhandledRejection', () => {
      const mockApp = {
        close: vi.fn().mockResolvedValue(undefined),
      };

      setupProcessSafety(() => mockApp as any);

      expect(processListeners['uncaughtException']).toBeDefined();
      expect(processListeners['uncaughtException'].length).toBeGreaterThan(0);
      expect(processListeners['unhandledRejection']).toBeDefined();
      expect(processListeners['unhandledRejection'].length).toBeGreaterThan(0);
    });

    it('StructuredLogger.logProcessFatal formats telemetry strictly within allowlist', () => {
      const logger = new StructuredLogger('TestWorker');
      const logSpy = vi.spyOn((logger as any).logger, 'log').mockImplementation(() => {});

      logger.logProcessFatal({
        event: 'process.uncaught_exception',
        error: new Error('Database connection failed unexpectedly'),
        errorCode: 'FATAL_DB_ERR',
      });

      expect(logSpy).toHaveBeenCalledTimes(1);
      const loggedJson = JSON.parse(logSpy.mock.calls[0][0]);

      // Verify all keys in output belong to ALLOWED_TELEMETRY_KEYS
      for (const key of Object.keys(loggedJson)) {
        expect(ALLOWED_TELEMETRY_KEYS.has(key as any)).toBe(true);
      }

      expect(loggedJson.event).toBe('process.uncaught_exception');
      expect(loggedJson.status).toBe('fatal');
      expect(loggedJson.errorCategory).toBe('database_error');
      expect(loggedJson.errorCode).toBe('FATAL_DB_ERR');
      expect(loggedJson.worker).toBe('TestWorker');

      // Ensure no raw message or sensitive properties leaked
      expect(loggedJson).not.toHaveProperty('message');
      expect(loggedJson).not.toHaveProperty('stack');
    });

    it('uncaughtException triggers graceful app.close() and exits non-zero (1)', async () => {
      const mockApp = {
        close: vi.fn().mockResolvedValue(undefined),
      };

      setupProcessSafety(() => mockApp as any);

      const handler = processListeners['uncaughtException'][0];
      await handler(new Error('Fatal unhandled runtime exception'));

      expect(mockApp.close).toHaveBeenCalledTimes(1);
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('unhandledRejection triggers graceful app.close() and exits non-zero (1)', async () => {
      const mockApp = {
        close: vi.fn().mockResolvedValue(undefined),
      };

      setupProcessSafety(() => mockApp as any);

      const handler = processListeners['unhandledRejection'][0];
      await handler(new Error('Unhandled promise rejection in worker'));

      expect(mockApp.close).toHaveBeenCalledTimes(1);
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('is idempotent and prevents shutdown loops on multiple simultaneous exceptions', async () => {
      const mockApp = {
        close: vi.fn().mockResolvedValue(undefined),
      };

      setupProcessSafety(() => mockApp as any);

      const handler = processListeners['uncaughtException'][0];
      await Promise.all([
        handler(new Error('Error 1')),
        handler(new Error('Error 2')),
      ]);

      expect(mockApp.close).toHaveBeenCalledTimes(1);
      expect(mockExit).toHaveBeenCalledTimes(1);
    });
  });
});
