import { PrismaClient } from "@nexus/database";

/**
 * 🛡️ SECURE PRISMA CLIENT CONFIGURATION
 * 
 * Database: Supabase PostgreSQL (Transaction Pooler)
 * Connection: Uses environment variables for security
 * Mode: Transaction pooling (pgbouncer=true required)
 */

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  // Build time: return a dummy client that will fail at runtime if used
  if (!process.env.DATABASE_URL) {
    // During build, create a minimal client that won't actually connect
    const client = new PrismaClient({
      log: [],
    });

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = client;
    }

    return client;
  }

  // Runtime: create properly configured client
  const baseUrl = process.env.DATABASE_URL;

  // ✅ SESSION MODE (Port 5432) - No pgbouncer parameter needed
  // Transaction Mode (Port 6543) would need pgbouncer=true
  const connectionUrl = baseUrl;

  const client = new PrismaClient({
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma = getPrismaClient();