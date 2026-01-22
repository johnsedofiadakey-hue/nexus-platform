import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Nexus Database Seed...");

  // 1. CLEANUP (Optional: Only if you want a fresh start)
  // await prisma.saleItem.deleteMany();
  // await prisma.sale.deleteMany();
  // await prisma.product.deleteMany();

  // 2. CREATE MASTER ADMIN
  const adminPassword = await hash("NexusAdmin2026!", 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@stormglide.com' },
    update: {},
    create: {
      email: 'admin@stormglide.com',
      name: 'John Admin',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Admin Created: ${admin.email}`);

  // 3. CREATE INITIAL SHOP
  const shop = await prisma.shop.upsert({
    where: { id: 'accra-central-hub' },
    update: {},
    create: {
      id: 'accra-central-hub',
      name: 'Accra Central Hub',
      location: 'Accra, Ghana',
      latitude: 5.6037,
      longitude: -0.1870,
      radius: 200,
    },
  });

  // 4. SEED UNIQUE PRODUCTS
  const products = [
    { productName: "LG ArtCool 1.5HP", sku: "LG-AC-001", priceGHS: 4500, quantity: 20 },
    { productName: "LG Vivace 9KG Washer", sku: "LG-WM-V9", priceGHS: 6200, quantity: 15 },
    { productName: "LG InstaView Refrigerator", sku: "LG-RF-IV", priceGHS: 12500, quantity: 5 },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: { quantity: p.quantity, priceGHS: p.priceGHS },
      create: {
        productName: p.productName,
        sku: p.sku,
        priceGHS: p.priceGHS,
        quantity: p.quantity,
        shopId: shop.id,
      },
    });
  }

  console.log("✨ Seeding Complete: 1 Admin, 1 Shop, 3 Unique Products.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });