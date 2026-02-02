import { PrismaClient } from "@prisma/client";

// 🛡️ FINAL CONFIGURATION
// Host: aws-1-eu-west-1.pooler.supabase.com (IPv4 - Works on your WiFi)
// Port: 5432 (Session Mode - Fixes the "Prepared Statement" crash)
// Password: "Sedofia1010." (With the dot included)

const FINAL_URL = "postgresql://postgres.lqkpyqcokdeaefmisgbs:Sedofia1010.@aws-1-eu-west-1.pooler.supabase.com:5432/postgres";

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: FINAL_URL,
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