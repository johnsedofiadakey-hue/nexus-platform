import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@nexus.com";
  const password = "admin123";
  
  console.log(`🚀 Resetting admin account...`);
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE"
      },
      create: {
        email,
        name: "Super Admin",
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE"
      }
    });

    console.log("---");
    console.log("✅ SUCCESS! Admin record created/updated.");
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🛡️ Role: ${admin.role}`);
    // Only log password in local development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔑 DEV ONLY - Password: ${password}`);
    }
    console.log("---");
  } catch (e) {
    console.error("❌ RESET FAILED:");
    console.error(e.message || e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });