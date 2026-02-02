import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🛠️ Starting System Restore...");

  // 1. Ensure Default Organization Exists
  console.log("🏢 Checking Organization...");
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "System Admin Org",
        slug: "sys-admin",
        status: "ACTIVE"
      }
    });
  }

  // 2. Create/Update the Admin User
  console.log("👤 Restoring Admin User...");
  const adminEmail = "sedofia1010@gmail.com";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'SUPER_ADMIN', // Updated Role enum if changed, or keep SUPER_USER if valid
      status: 'ACTIVE',
      organizationId: org.id
    },
    create: {
      name: "Sedofia Admin",
      email: adminEmail,
      password: "password123",
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      phone: "0550000000",
      organizationId: org.id
    }
  });

  console.log(`✅ Admin Ready: ${admin.email}`);

  // 3. Create/Update the HQ Shop
  console.log("🏢 Restoring Headquarters...");

  const shop = await prisma.shop.upsert({
    where: { id: 'headquarters-main' },
    update: {
      name: 'Nexus HQ',
      // createdById removed
      organizationId: org.id
    },
    create: {
      id: 'headquarters-main',
      name: 'Nexus HQ',
      location: 'Accra, Ghana',
      latitude: 5.6037,
      longitude: -0.1870,
      radius: 500,
      openingTime: "08:00 AM",
      organizationId: org.id
    }
  });

  console.log(`✅ Shop Ready: ${shop.name}`);

  // 4. Link Admin to Shop
  await prisma.user.update({
    where: { id: admin.id },
    data: { shopId: shop.id }
  });

  console.log("🚀 RESTORE COMPLETE.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });