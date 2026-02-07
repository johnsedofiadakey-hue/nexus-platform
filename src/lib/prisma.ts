import { PrismaClient } from "@prisma/client";

/**
 * 🛡️ SECURE PRISMA CLIENT CONFIGURATION
 * 
 * Database: Supabase PostgreSQL (Transaction Pooler)
 * Connection: Uses environment variables for security
 * Mode: Transaction pooling (pgbouncer=true required)
 */

// Validate environment variables
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not defined. Please set it in your .env.local file."
  );
}

const prismaClientSingleton = () => {
  // Get base URL from environment
  const baseUrl = process.env.DATABASE_URL!;

  // Add required pgbouncer parameter for Supabase transaction pooler
  const connectionUrl = baseUrl.includes("?")
    ? `${baseUrl}&pgbouncer=true&connection_limit=1`
    : `${baseUrl}?pgbouncer=true&connection_limit=1`;

  return new PrismaClient({
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;