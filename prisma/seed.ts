import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Nexus Seed...');

  // --- 1. BULLETPROOF CLEANUP (Fixes the Foreign Key Crash) ---
  console.log('🧹 Clearing old data...');
  
  // A. Delete leaf nodes (Data that depends on others)
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.attendance.deleteMany();     // Added HR stuff just in case
  await prisma.leaveRequest.deleteMany();
  await prisma.dailyReport.deleteMany();
  await prisma.message.deleteMany();

  // B. Break the "User <-> Shop" Cycle
  // We set all users' shopId to null so they stop pointing to Shops
  await prisma.user.updateMany({ data: { shopId: null } });

  // C. Delete Shops first (Because they point to Users via createdBy)
  await prisma.shop.deleteMany();

  // D. Finally Delete Users (Now safe because no Shops point to them)
  await prisma.user.deleteMany();
  
  console.log('✨ Clean slate established.');

  // --- 2. CREATE SUPER ADMIN ---
  const passwordHash = await hash('password123', 10);
  
  const admin = await prisma.user.create({
    data: {
      name: 'Truth Admin',
      email: 'admin@nexus.com',
      password: passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: '0500000000',
      image: null // Admin doesn't need a photo yet
    },
  });
  console.log('👤 Admin Created: admin@nexus.com');

  // --- 3. CREATE SHOPS (Accra Locations) ---
  const shops = await Promise.all([
    prisma.shop.create({
      data: {
        name: 'Nexus Osu Hub',
        location: 'Oxford Street, Osu',
        latitude: 5.55602,
        longitude: -0.19690,
        radius: 200,
        createdById: admin.id,
        managerName: 'Kojo Osu',
        managerPhone: '0201111111'
      }
    }),
    prisma.shop.create({
      data: {
        name: 'Nexus East Legon',
        location: 'Lagos Avenue',
        latitude: 5.63560,
        longitude: -0.16330,
        radius: 300,
        createdById: admin.id,
        managerName: 'Ama Legon',
        managerPhone: '0202222222'
      }
    }),
    prisma.shop.create({
      data: {
        name: 'Nexus Spintex',
        location: 'Coca Cola Roundabout',
        latitude: 5.63000,
        longitude: -0.12000,
        radius: 250,
        createdById: admin.id,
        managerName: 'Yaw Spintex',
        managerPhone: '0203333333'
      }
    })
  ]);
  console.log('🏢 3 Shops Created (Osu, Legon, Spintex).');

  // --- 4. CREATE SALES REPS (Mobile Users) ---
  const reps = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Rep Osu',
        email: 'osu@nexus.com',
        password: passwordHash,
        role: 'SALES_REP',
        shopId: shops[0].id,
        phone: '0551111111',
        ghanaCard: 'GHA-111111111-1',
        status: 'ACTIVE',
        // Optional: Add a placeholder base64 image if you want to test photos
        // image: "data:image/png;base64,..." 
      }
    }),
    prisma.user.create({
      data: {
        name: 'Rep Legon',
        email: 'legon@nexus.com',
        password: passwordHash,
        role: 'SALES_REP',
        shopId: shops[1].id,
        phone: '0552222222',
        ghanaCard: 'GHA-222222222-2',
        status: 'ACTIVE'
      }
    }),
    prisma.user.create({
      data: {
        name: 'Rep Spintex',
        email: 'spintex@nexus.com',
        password: passwordHash,
        role: 'SALES_REP',
        shopId: shops[2].id,
        phone: '0553333333',
        ghanaCard: 'GHA-333333333-3',
        status: 'ACTIVE'
      }
    })
  ]);
  console.log('📱 3 Sales Reps Created.');

  // --- 5. CREATE INVENTORY ---
  await prisma.product.createMany({
    data: [
      {
        productName: 'Samsung 55" UHD TV',
        sku: 'SAM-TV-55',
        priceGHS: 6500,
        quantity: 10,
        shopId: shops[0].id,
        category: 'HOME_ENTERTAINMENT',
        subCat: 'TV'
      },
      {
        productName: 'Nasco 2.0HP AC',
        sku: 'NAS-AC-20',
        priceGHS: 3200,
        quantity: 15,
        shopId: shops[0].id,
        category: 'HOME_APPLIANCE',
        subCat: 'Air Condition'
      },
      {
        productName: 'LG Fridge 205L',
        sku: 'LG-REF-205',
        priceGHS: 4800,
        quantity: 5,
        shopId: shops[0].id,
        category: 'HOME_APPLIANCE',
        subCat: 'Refrigerator'
      }
    ]
  });
  console.log('📦 Inventory added to Osu Hub.');

  console.log('✅ SEED COMPLETE! System ready.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });