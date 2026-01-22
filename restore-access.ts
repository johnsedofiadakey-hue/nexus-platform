import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Initializing System Restoration...");

  // 1. Find or Create Default HQ Shop
  let hq = await prisma.shop.findFirst({
    where: { name: "Nexus HQ" }
  });

  if (!hq) {
    console.log("⚠️ HQ not found. Creating new Hub...");
    hq = await prisma.shop.create({
      data: {
        name: "Nexus HQ",
        location: "Accra, Ghana",
        latitude: 5.6037,
        longitude: -0.1870,
        radius: 500,
        isActive: true // <--- FIXED: Used 'isActive' instead of 'status'
      }
    });
  }
  console.log(`✅ Hub Station Verified: ${hq.name} (ID: ${hq.id})`);

  // 2. Force-Update Admin
  const adminPwd = await hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@nexus.com" },
    update: {
      password: adminPwd,
      role: "ADMIN",
      status: "ACTIVE", // This is correct for the USER table
      shopId: hq.id
    },
    create: {
      email: "admin@nexus.com",
      name: "System Administrator",
      password: adminPwd,
      role: "ADMIN",
      status: "ACTIVE",
      shopId: hq.id
    },
  });
  console.log("✅ Admin Reset: admin@nexus.com");

  // 3. Force-Update Sales Rep
  const salesPwd = await hash("123", 12);
  await prisma.user.upsert({
    where: { email: "john@nexus.com" },
    update: {
      password: salesPwd,
      role: "SALES_REP",
      status: "ACTIVE",
      shopId: hq.id
    },
    create: {
      email: "john@nexus.com",
      name: "John Sales",
      password: salesPwd,
      role: "SALES_REP",
      status: "ACTIVE",
      shopId: hq.id
    },
  });
  console.log("✅ Sales Rep Reset: john@nexus.com");
}

main()
  .catch((e) => {
    console.error("❌ Restoration Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });