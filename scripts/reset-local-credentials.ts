import { hash } from "bcryptjs";
import { PrismaClient } from "@nexus/database";

const prisma = new PrismaClient();

function isTruthy(value: string | undefined) {
  return value === "1" || value === "true" || value === "yes";
}

async function main() {
  const adminEmail = (process.env.LOCAL_ADMIN_EMAIL || "admin@nexus.com").toLowerCase().trim();
  const adminPassword = process.env.LOCAL_ADMIN_PASSWORD || "admin123";

  const controlEmail = (process.env.LOCAL_CONTROL_EMAIL || "dev@nexus.com").toLowerCase().trim();
  const controlPassword = process.env.LOCAL_CONTROL_PASSWORD || "dev123";

  const adminHash = await hash(adminPassword, 10);
  const controlHash = await hash(controlPassword, 12);

  const existingAdmin = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: { id: true, organizationId: true, role: true, status: true },
  });

  if (!existingAdmin) {
    throw new Error(
      "No existing ADMIN/SUPER_ADMIN user found. Seed an admin user first, then rerun this reset script."
    );
  }

  const updatedAdmin = await prisma.user.update({
    where: { id: existingAdmin.id },
    data: {
      email: adminEmail,
      password: adminHash,
      status: "ACTIVE",
      passwordResetRequired: false,
    },
    select: { id: true, email: true, role: true, organizationId: true },
  });

  const existingControl = await prisma.platformAdmin.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  const controlData = {
    email: controlEmail,
    passwordHash: controlHash,
    role: "OWNER" as const,
    isActive: true,
    failedLoginAttempts: 0,
    lockUntil: null,
    lastLoginAt: null,
  };

  const updatedControl = existingControl
    ? await prisma.platformAdmin.update({
        where: { id: existingControl.id },
        data: controlData,
        select: { id: true, email: true, role: true, isActive: true },
      })
    : await prisma.platformAdmin.create({
        data: controlData,
        select: { id: true, email: true, role: true, isActive: true },
      });

  if (isTruthy(process.env.RESET_AGENT_PROMOTERS)) {
    await prisma.user.updateMany({
      where: { role: { in: ["AGENT", "WORKER"] } },
      data: { passwordResetRequired: true },
    });
  }

  console.log("✅ Local credentials reset complete");
  console.log("admin:", updatedAdmin);
  console.log("control:", updatedControl);
  console.log(
    "ℹ️ Credentials now set to:",
    JSON.stringify({
      admin: { email: adminEmail, password: adminPassword },
      control: { email: controlEmail, password: controlPassword },
    })
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Credential reset failed");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
