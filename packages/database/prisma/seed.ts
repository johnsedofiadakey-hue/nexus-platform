import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 STARTING SYSTEM RESET...");

  try {
    // 1. Wipe old data
    await prisma.subscription.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.message.deleteMany();
    await prisma.shop.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();

    console.log("✅ Database cleared.");

    // 2. CREATE DEFAULT ORGANIZATION
    const org = await prisma.organization.create({
      data: {
        name: "Nexus Retail Ltd",
        slug: "nexus-retail-ltd",
        plan: "ENTERPRISE",
        status: "ACTIVE"
      }
    });
    console.log("🏢 Created Organization:", org.name);

    // 3. CREATE THE AGENT (Linked to Org)
    const hashedPassword = await hash("123", 10);

    const agent = await prisma.user.create({
      data: {
        email: "ernest@nexus.com",
        name: "Ernest Agent",
        role: "AGENT",
        password: hashedPassword,
        position: "Field Operative",
        department: "Retail",
        organizationId: org.id
      },
    });
    console.log(`👤 Created Agent: ${agent.email} | Password: 123`);

    // 4. CREATE THE SHOP (Linked to Org)
    await prisma.shop.create({
      data: {
        name: "Nexus Retail - HQ",
        location: "Accra Central",
        latitude: 5.6037,
        longitude: -0.1870,
        radius: 200,
        status: "ACTIVE",
        organizationId: org.id
      },
    });
    console.log("🏪 Created Shop: Nexus HQ");

  } catch (e) {
    console.error("❌ Seed Failed:", e);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });