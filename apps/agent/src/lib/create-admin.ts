import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await hash("nexus2026", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@stormglide.com" },
    update: {},
    create: {
      email: "admin@stormglide.com",
      name: "Commander Truth",
      password: password,
      role: "SUPER_ADMIN",
    },
  });
  console.log("✅ OPERATIVE CREATED: admin@stormglide.com / nexus2026");
}

main();