import winston from 'winston';

/**
 * Structured JSON logger using Winston.
 *
 * Why Winston? It supports multiple transports (console, file, external),
 * structured JSON output, and log levels. JSON logs are easy to parse
 * with log aggregation tools like Datadog or CloudWatch.
 *
 * Every log entry includes a requestId for tracing a request through the system.
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'feedvex' },
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'development'
          ? winston.format.combine(winston.format.colorize(), winston.format.simple())
          : winston.format.json(),
    }),
  ],
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
    })
  );
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generates a unique request ID (UUID v4).
 * Include this in all log entries for a request to trace it end-to-end.
 */
export function generateRequestId(): string {
  return generateUUID();
}

/**
 * Masks sensitive values in log output.
 * Shows only first 4 characters to confirm the value is set without exposing it.
 */
export function maskSensitive(value?: string): string {
  if (!value) return 'not set';
  return `${value.slice(0, 4)}****`;
}

export { logger };
