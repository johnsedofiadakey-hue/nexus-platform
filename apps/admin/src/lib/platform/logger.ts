import pino from "pino";

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");

export const logger = pino({
  level,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "body.password",
      "token",
    ],
    remove: true,
  },
  base: {
    service: "nexus-admin-api",
    env: process.env.NODE_ENV || "development",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export type LogContext = {
  requestId?: string;
  route?: string;
  userId?: string;
  orgId?: string | null;
  ip?: string;
};

export function withLogContext(context: LogContext) {
  return logger.child(context);
}
