import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// --- 1. CONFIGURATION ---
const PROJECT_ID = "lqkpyqcokdeaefmisgbs";
const PASSWORD = "YOUR_ACTUAL_PASSWORD"; // Ensure no special characters are unencoded

// This format is mandatory for Supabase's newer infrastructure
const connectionString = `postgresql://postgres.${PROJECT_ID}:${PASSWORD}@db.${PROJECT_ID}.supabase.co:5432/postgres`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString,
    },
  },
});

async function main() {
  console.log(`🚀 Attempting to connect to Tenant: ${PROJECT_ID}...`);
  
  const hashedPassword = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@nexus.com" },
    update: {
      password: hashedPassword,
      role: "ADMIN",
    },
    create: {
      email: "admin@nexus.com",
      name: "Super Admin",
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("---");
  console.log("✅ SUCCESS! Admin record created/updated.");
  console.log(`📧 User: ${admin.email}`);
  console.log("🔑 Pass: password123");
  console.log("---");
}

main()
  .catch((e) => {
    console.error("❌ CONNECTION FAILED:");
    console.error(e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });