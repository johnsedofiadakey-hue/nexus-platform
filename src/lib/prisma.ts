// path: /src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

/**
 * Nexus Framework Prisma Singleton
 * This prevents creating multiple database connections during Turbopack HMR.
 */

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

// 1. Create the instance and export it as a NAMED EXPORT
// This satisfies: import { prisma } from "@/lib/prisma"
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// 2. Export it as a DEFAULT EXPORT as well
// This satisfies: import prisma from "@/lib/prisma"
export default prisma;