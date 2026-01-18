import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  CLEANING DATABASE (Wiping previous data)')

  // By default, avoid destructive deletes to preserve data (including messages and users).
  // To force a full reset during development, set env var `FORCE_SEED=true`.
  if (process.env.FORCE_SEED === 'true') {
    console.log('⚠️ FORCE_SEED=true detected — performing destructive reset')
    // 1. Delete in order to respect Foreign Keys
    await prisma.saleItem.deleteMany()
    await prisma.sale.deleteMany()
    await prisma.chatMessage.deleteMany()
    await prisma.attendance.deleteMany()
    await prisma.dailyReport.deleteMany()
    await prisma.leaveRequest.deleteMany()
    await prisma.product.deleteMany()
    await prisma.subCategory.deleteMany()
    await prisma.category.deleteMany()
    await prisma.user.deleteMany()
    await prisma.shop.deleteMany()

    console.log('✅ Destructive reset complete.')
  } else {
    console.log('ℹ️ FORCE_SEED not set — skipping destructive reset. Existing data preserved.')
  }
  console.log('🌱 SEEDING NEW DATA...')

  // 2. Create Shops
  const headOffice = await prisma.shop.create({
    data: {
      name: 'Nexus Head Office',
      location: 'Airport City, Accra',
      latitude: 5.6037,
      longitude: -0.1870,
      radius: 200,
      managerName: 'Kofi Mensah',
      managerPhone: '+233 55 555 5555',
      openingTime: '08:00 AM',
      closingTime: '06:00 PM'
    }
  })

  const kumasiHub = await prisma.shop.create({
    data: {
      name: 'Kumasi Central Hub',
      location: 'Adum, Kumasi',
      latitude: 6.6885,
      longitude: -1.6244,
      radius: 300,
      managerName: 'Ama Serwaa',
      managerPhone: '+233 24 444 4444'
    }
  })

  // 3. Create Categories
  const rawMat = await prisma.category.create({ data: { name: 'RAW MATERIALS' } })
  const finished = await prisma.category.create({ data: { name: 'FINISHED GOODS' } })

  // 4. Create SubCategories
  const glass = await prisma.subCategory.create({
    data: { name: 'Glass Sheets', categoryId: rawMat.id }
  })
  const aluminum = await prisma.subCategory.create({
    data: { name: 'Aluminum Profiles', categoryId: rawMat.id }
  })
  const windows = await prisma.subCategory.create({
    data: { name: 'Sliding Windows', categoryId: finished.id }
  })
  const doors = await prisma.subCategory.create({
    data: { name: 'Security Doors', categoryId: finished.id }
  })

  // 5. Create Inventory (Products)
  const products = [
    { name: 'Clear Float Glass 6mm', sku: 'GLS-001', price: 450.00, stock: 120, min: 20, type: 'RAW_MATERIAL', sub: glass.id, shop: headOffice.id },
    { name: 'Tinted Blue Glass 5mm', sku: 'GLS-002', price: 520.00, stock: 85, min: 15, type: 'RAW_MATERIAL', sub: glass.id, shop: headOffice.id },
    { name: 'Aluminum Top Rail (Matte)', sku: 'ALU-101', price: 180.00, stock: 300, min: 50, type: 'RAW_MATERIAL', sub: aluminum.id, shop: headOffice.id },
    { name: 'Aluminum Bottom Track', sku: 'ALU-102', price: 210.00, stock: 45, min: 50, type: 'RAW_MATERIAL', sub: aluminum.id, shop: headOffice.id }, // Low Stock
    { name: 'Standard Sliding Window (4x4)', sku: 'WIN-500', price: 1200.00, stock: 15, min: 5, type: 'FINISHED_GOOD', sub: windows.id, shop: headOffice.id },
    { name: 'Luxury Pivot Door (Glass)', sku: 'DOR-900', price: 3500.00, stock: 4, min: 2, type: 'FINISHED_GOOD', sub: doors.id, shop: headOffice.id },
    
    // Kumasi Stock
    { name: 'Clear Float Glass 6mm', sku: 'GLS-001-K', price: 460.00, stock: 50, min: 10, type: 'RAW_MATERIAL', sub: glass.id, shop: kumasiHub.id },
    { name: 'Standard Sliding Window (4x4)', sku: 'WIN-500-K', price: 1250.00, stock: 8, min: 5, type: 'FINISHED_GOOD', sub: windows.id, shop: kumasiHub.id },
  ]

  for (const p of products) {
    await prisma.product.create({
      data: {
        productName: p.name,
        sku: p.sku,
        priceGHS: p.price,
        quantity: p.stock,
        minStock: p.min,
        formulation: p.type as any,
        subCategoryId: p.sub,
        shopId: p.shop
      }
    })
  }

  // 6. Create Users
  const password = await hash('password123', 10)
  const adminPass = await hash('admin123', 10)

  // Admin
  await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@nexus.com',
      password: adminPass,
      role: 'SUPER_USER',
      status: 'ACTIVE',
      shopId: headOffice.id
    }
  })

  // Sales Rep (Assigned to Head Office)
  await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@nexus.com',
      password: password,
      role: 'SALES_REP',
      status: 'ACTIVE',
      phone: '+233 50 000 0000',
      shopId: headOffice.id,
      monthlyTargetRev: 20000,
      monthlyTargetVol: 50
    }
  })

  console.log('🚀 SEEDING COMPLETE. Login with:')
  console.log('   Admin: admin@nexus.com / admin123')
  console.log('   Staff: john@nexus.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })