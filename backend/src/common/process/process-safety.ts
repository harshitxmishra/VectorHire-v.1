import { INestApplication } from '@nestjs/common';
import { StructuredLogger } from '../logging/structured-logger.service';

/**
 * Attaches process-level crash safety handlers for uncaughtException and unhandledRejection.
 * Ensures all fatal process errors are logged using StructuredLogger (with telemetry allowlist),
 * initiates graceful NestJS application shutdown, and terminates the process with a non-zero exit code.
 */
export function setupProcessSafety(appProvider: () => INestApplication | undefined): void {
  const logger = new StructuredLogger('ProcessSafety');
  let isShuttingDown = false;

  const handleFatal = async (event: string, error: unknown) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    try {
      logger.logProcessFatal({
        event,
        error,
      });
    } catch {
      // Fallback if logger throws
    }

    try {
      const app = appProvider();
      if (app) {
        await app.close();
      }
    } catch {
      // Ignore errors during emergency app closing
    } finally {
      process.exit(1);
    }
  };

  process.on('uncaughtException', (err: Error) => {
    void handleFatal('process.uncaught_exception', err);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    void handleFatal('process.unhandled_rejection', reason);
  });
}
