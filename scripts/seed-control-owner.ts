import { hash } from "bcryptjs";
import { PrismaClient } from "@nexus/database";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.CONTROL_OWNER_EMAIL?.toLowerCase().trim();
  const password = process.env.CONTROL_OWNER_PASSWORD;

  if (!email || !password) {
    throw new Error("CONTROL_OWNER_EMAIL and CONTROL_OWNER_PASSWORD are required");
  }

  if (password.length < 12) {
    throw new Error("CONTROL_OWNER_PASSWORD must be at least 12 characters");
  }

  const passwordHash = await hash(password, 12);

  await prisma.platformAdmin.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "OWNER",
      isActive: true,
      failedLoginAttempts: 0,
      lockUntil: null,
    },
    create: {
      email,
      passwordHash,
      role: "OWNER",
      isActive: true,
    },
  });

  console.log("Control owner account ensured successfully.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "seed failed");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
