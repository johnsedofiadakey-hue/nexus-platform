import { PrismaClient } from "@prisma/client";

// 🛡️ FINAL CONFIGURATION
// Host: aws-1-eu-west-1.pooler.supabase.com (IPv4 - Works on your WiFi)
// Port: 6543 (Transaction Mode - Best for Serverless)
// Password: "Sedofia1010." (With the dot included)

// ⚠️ SUPABASE TRANSACTION POOLER (Port 6543) - Requires ?pgbouncer=true
const FINAL_URL = "postgresql://postgres.lqkpyqcokdeaefmisgbs:Sedofia1010.@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        // 🚀 TRANSACTION MODE: Must disable prepared statements via &pgbouncer=true
        url: FINAL_URL + "?pgbouncer=true&connection_limit=1",
      },
    },
    log: ["error"], // Keep console clean
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;