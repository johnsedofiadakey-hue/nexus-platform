import * as Sentry from "@sentry/nextjs";
import { logger } from "./logger";

export function captureException(error: unknown, context: Record<string, unknown>) {
  logger.error({ err: error, ...context }, "Unhandled exception");
  Sentry.captureException(error, { extra: context });
}

export function detectSlowQuery(durationMs: number, model: string, operation: string) {
  if (durationMs >= 500) {
    logger.warn({ durationMs, model, operation }, "Slow DB query detected");
  }
}
