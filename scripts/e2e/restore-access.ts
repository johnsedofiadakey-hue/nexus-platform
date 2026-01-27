import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🛠️ Starting System Restore...");

  // 1. Create/Update the Admin User
  console.log("👤 Restoring Admin User...");
  const adminEmail = "sedofia1010@gmail.com"; 
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'SUPER_USER',
      status: 'ACTIVE',
    },
    create: {
      name: "Sedofia Admin",
      email: adminEmail,
      password: "password123", 
      role: 'SUPER_USER',
      status: 'ACTIVE',
      phone: "0550000000"
    }
  });

  console.log(`✅ Admin Ready: ${admin.email}`);

  // 2. Create/Update the HQ Shop
  console.log("🏢 Restoring Headquarters...");
  
  const shop = await prisma.shop.upsert({
    where: { id: 'headquarters-main' }, 
    update: {
      name: 'Nexus HQ',
      createdById: admin.id
    },
    create: {
      id: 'headquarters-main',
      name: 'Nexus HQ',
      location: 'Accra, Ghana',
      latitude: 5.6037, 
      longitude: -0.1870,
      radius: 500,
      openingTime: "08:00 AM",
      createdById: admin.id
    }
  });

  console.log(`✅ Shop Ready: ${shop.name}`);

  // 3. Link Admin to Shop
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