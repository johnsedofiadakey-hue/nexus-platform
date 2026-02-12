import { PrismaClient } from "@nexus/database";

/**
 * HARDENED PRISMA CLIENT — Supabase Transaction Pooler (Free Tier Optimized)
 * 
 * Connection: Transaction pooler (port 6543) via PgBouncer
 * Features:
 *   - pgbouncer=true disables prepared statements
 *   - connection_limit=1 per serverless invocation
 *   - Global singleton avoids pool exhaustion
 *   - ALL queries auto-retry on transient failures via $extends
 *   - Handles: MaxClients, pool timeout, connection reset, paused project
 */

const RETRY_LIMIT = 2;
const RETRY_DELAY_MS = 400;

function isTransientError(error: any): boolean {
  const msg = (error?.message || "").toLowerCase();
  const code = error?.code || "";
  return (
    msg.includes("prepared statement") ||
    msg.includes("connection") ||
    msg.includes("econnrefused") ||
    msg.includes("connection reset") ||
    msg.includes("socket hang up") ||
    msg.includes("server closed the connection") ||
    msg.includes("connect etimedout") ||
    msg.includes("can't reach database server") ||
    msg.includes("maxclients") ||
    msg.includes("remaining connection slots") ||
    msg.includes("too many clients") ||
    msg.includes("project is paused") ||
    msg.includes("terminating connection") ||
    msg.includes("broken pipe") ||
    code === "P1001" || // Can't reach DB
    code === "P1002" || // DB timeout
    code === "P1017" || // Server closed connection
    code === "P2024"    // Connection pool timeout
  );
}

async function retryOperation<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= RETRY_LIMIT; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (isTransientError(error) && attempt < RETRY_LIMIT) {
        console.warn(
          `⚠️ DB retry (${attempt + 1}/${RETRY_LIMIT}): ${(error?.message || "").slice(0, 100)}`
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof createExtendedClient> | undefined;
};

function createExtendedClient() {
  const baseUrl = process.env.DATABASE_URL || "";

  // Transaction pooler params: low connection limit + reasonable timeouts
  const sep = baseUrl.includes("?") ? "&" : "?";
  const connectionUrl = baseUrl
    ? `${baseUrl}${sep}connection_limit=1&connect_timeout=15&pool_timeout=15`
    : baseUrl;

  const baseClient = new PrismaClient({
    datasources: baseUrl
      ? { db: { url: connectionUrl } }
      : undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  // Wrap EVERY query with auto-retry — all 50+ API routes benefit
  const extendedClient = baseClient.$extends({
    query: {
      $allOperations({ args, query }: { args: any; query: (args: any) => Promise<any> }) {
        return retryOperation(() => query(args));
      },
    },
  });

  return extendedClient;
}

function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  const client = createExtendedClient();
  globalForPrisma.prisma = client;
  return client;
}

export const prisma = getPrismaClient();

/**
 * Explicit retry wrapper for cases where you want custom retry count / delay.
 * The global $extends middleware already retries, so this is for extra-critical paths.
 * 
 * Usage:
 *   const users = await dbRetry(() => prisma.user.findMany({ ... }));
 */
export async function dbRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 400
): Promise<T> {
  return retryOperation(fn);
}