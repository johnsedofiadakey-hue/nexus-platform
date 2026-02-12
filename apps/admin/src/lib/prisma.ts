import { PrismaClient } from "@nexus/database";

/**
 * 🛡️ HARDENED PRISMA CLIENT
 * 
 * Database: Supabase PostgreSQL (Session Pooler, port 5432)
 * Features:
 *   - Global singleton prevents connection exhaustion
 *   - Auto-reconnect on dropped connections
 *   - Retry wrapper for transient failures
 *   - Connection limit for serverless environments
 */

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
  prismaReady: boolean;
};

function createPrismaClient(): PrismaClient {
  const baseUrl = process.env.DATABASE_URL || "";

  // Append connection_limit for serverless to prevent pool exhaustion
  const sep = baseUrl.includes("?") ? "&" : "?";
  const connectionUrl = baseUrl
    ? `${baseUrl}${sep}connection_limit=5&connect_timeout=10&pool_timeout=10`
    : baseUrl;

  const client = new PrismaClient({
    datasources: baseUrl
      ? { db: { url: connectionUrl } }
      : undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return client;
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();

  // Cache in global scope to survive hot-reloads (dev) and serverless reuse (prod)
  globalForPrisma.prisma = client;

  return client;
}

export const prisma = getPrismaClient();

/**
 * Retry wrapper for database operations.
 * Handles transient Supabase/PgBouncer failures:
 *   - "prepared statement" desync
 *   - Connection reset / timeout
 *   - ECONNREFUSED on cold start
 * 
 * Usage:
 *   const users = await dbRetry(() => prisma.user.findMany({ ... }));
 */
export async function dbRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 300
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const msg = error?.message || "";
      const isTransient =
        msg.includes("prepared statement") ||
        msg.includes("connection") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("Connection reset") ||
        msg.includes("socket hang up") ||
        msg.includes("server closed the connection") ||
        msg.includes("connect ETIMEDOUT") ||
        msg.includes("Can't reach database server") ||
        error?.code === "P1001" || // Can't reach DB
        error?.code === "P1002" || // DB timeout
        error?.code === "P1017" || // Server closed connection
        error?.code === "P2024";   // Connection pool timeout

      if (isTransient && attempt < retries) {
        console.warn(
          `⚠️ DB transient error (attempt ${attempt + 1}/${retries + 1}): ${msg.slice(0, 120)}`
        );
        // Force reconnect by disconnecting the stale client
        try { await prisma.$disconnect(); } catch { /* ignore */ }
        // Exponential backoff
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}