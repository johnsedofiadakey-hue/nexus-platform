import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log(`🚀 Resetting admin account...`);
  
  const email = "admin@nexus.com";
  const password = "admin123";
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: "ADMIN",
    },
    create: {
      email,
      name: "Super Admin",
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("---");
  console.log("✅ SUCCESS! Admin record created/updated.");
  console.log(`📧 User: ${admin.email}`);
  console.log(`🔑 Pass: ${password} (for dev/testing only)`);
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