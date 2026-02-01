import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 STARTING SYSTEM RESET...");

  try {
    // 1. Wipe old data
    await prisma.message.deleteMany();
    await prisma.shop.deleteMany();
    await prisma.user.deleteMany({
      where: { role: { not: "ADMIN" } }
    });
    console.log("✅ Database cleared.");

    // 2. CREATE ADMIN USER with hashed password
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.upsert({
      where: { email: "admin@nexus.com" },
      update: {
        password: adminPassword,
        role: "ADMIN",
        status: "ACTIVE"
      },
      create: {
        email: "admin@nexus.com",
        name: "Super Admin",
        role: "ADMIN",
        password: adminPassword,
        position: "Administrator",
        department: "Management",
        status: "ACTIVE"
      }
    });
    console.log(`👤 Created/Updated Admin: ${admin.email}`);
    console.log(`🔑 DEV ONLY - Admin Password: admin123`);

    // 3. CREATE THE AGENT
    const agentPassword = await bcrypt.hash("agent123", 10);
    const agent = await prisma.user.upsert({
      where: { email: "ernest@nexus.com" },
      update: {},
      create: {
        email: "ernest@nexus.com",
        name: "Ernest Agent",
        role: "AGENT",
        password: agentPassword,
        position: "Field Operative",
        department: "Retail",
        status: "ACTIVE"
      }
    });
    console.log(`👤 Created Agent: ${agent.email}`);
    console.log(`🔑 DEV ONLY - Agent Password: agent123`);

    // 4. CREATE THE SHOP
    await prisma.shop.create({
      data: {
        name: "Nexus Retail - HQ",
        location: "Accra Central",
        latitude: 5.6037,
        longitude: -0.1870,
        radius: 200,
        status: "ACTIVE"
      }
    });
    console.log("🏢 Created Shop: Nexus HQ");

    console.log("✅ Seed completed successfully!");
  } catch (e) {
    console.error("❌ Seed Failed:", e);
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