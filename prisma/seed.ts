import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Seed Process...');

  // 1. CLEANUP: Delete everything to ensure a fresh start
  // (Order matters due to foreign key constraints)
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();      // Fixed: Was 'inventory'
  await prisma.subCategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.conductIncident.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.user.deleteMany();
  await prisma.shop.deleteMany();

  console.log('🧹 Database Wiped Clean.');

  // 2. CREATE HQ SHOP (The Default Location)
  const hqShop = await prisma.shop.create({
    data: {
      name: 'Nexus Head Office',
      location: 'Accra, Ghana',
      latitude: 5.6037,
      longitude: -0.1870,
      managerName: 'System Admin',
      managerPhone: '+233000000000',
      isActive: true
    }
  });

  console.log('🏢 Created HQ Shop.');

  // 3. CREATE SUPER ADMIN USER
  // This is your primary login
  const adminPassword = await hash('admin123', 10);
  
  const admin = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@nexus.com',
      password: adminPassword,
      role: 'SUPER_USER',
      status: 'ACTIVE',
      shopId: hqShop.id,
      phone: '+233 50 000 0000'
    }
  });

  console.log('👤 Created Super Admin: admin@nexus.com / admin123');

  // 4. CREATE CATEGORIES (Standard Retail Setup)
  const catHome = await prisma.category.create({
    data: { name: 'HOME APPLIANCES' }
  });
  
  const catElectronics = await prisma.category.create({
    data: { name: 'ELECTRONICS' }
  });

  // 5. CREATE SUB-CATEGORIES
  await prisma.subCategory.create({
    data: { name: 'AIR CONDITIONERS', categoryId: catHome.id }
  });
  
  await prisma.subCategory.create({
    data: { name: 'REFRIGERATORS', categoryId: catHome.id }
  });

  await prisma.subCategory.create({
    data: { name: 'TELEVISIONS', categoryId: catElectronics.id }
  });

  console.log('📦 Created Standard Categories.');
  console.log('✅ Seeding Complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });