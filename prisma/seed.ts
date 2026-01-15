import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 INITIATING STRATEGIC DATA DEPLOYMENT...')
  
  const hashedPassword = await bcrypt.hash('nexus2026', 10)

  // 1. SYSTEM ENTITIES (USERS & ROLES)
  // ---------------------------------------------------------
  
  // The Commander (Super User)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@stormglide.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@stormglide.com',
      name: 'Commander Truth',
      password: hashedPassword,
      role: 'SUPER_USER',
    },
  })

  // Regional Manager (Admin)
  const manager = await prisma.user.upsert({
    where: { email: 'manager@stormglide.com' },
    update: {},
    create: {
      email: 'manager@stormglide.com',
      name: 'Kofi Mensah',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  // Field Operative (Sales Rep)
  const salesRep = await prisma.user.upsert({
    where: { email: 'rep1@stormglide.com' },
    update: {},
    create: {
      email: 'rep1@stormglide.com',
      name: 'Ama Serwaa',
      password: hashedPassword,
      role: 'SALES_REP',
    },
  })

  // 2. GEOGRAPHICAL NODES (SHOPS)
  // ---------------------------------------------------------

  // Node 01: Accra Mall (The Hub)
  const shopAccra = await prisma.shop.upsert({
    where: { id: 'accra-mall-01' },
    update: {},
    create: {
      id: 'accra-mall-01',
      name: 'Accra Mall Hub',
      location: 'Tetteh Quarshie Interchange',
      latitude: 5.6225,
      longitude: -0.1730,
      radius: 150,
    },
  })

  // Node 02: Kumasi City Mall (Regional Support)
  const shopKumasi = await prisma.shop.upsert({
    where: { id: 'kumasi-mall-02' },
    update: {},
    create: {
      id: 'kumasi-mall-02',
      name: 'Kumasi Regional Center',
      location: 'Asokwa, Kumasi',
      latitude: 6.6747,
      longitude: -1.6101,
      radius: 200,
    },
  })

  // 3. OPERATIONAL LINKING (ASSIGNMENTS)
  // ---------------------------------------------------------
  
  // Link Ama Serwaa to Accra Mall
  await prisma.user.update({
    where: { id: salesRep.id },
    data: { shopId: shopAccra.id }
  })

  // 4. LIVE TRANSACTIONAL DATA (MOCK SALES FOR TODAY)
  // ---------------------------------------------------------
  
  // Generating activity at Accra Mall to light up the map
  const today = new Date()
  await prisma.sale.createMany({
    data: [
      {
        totalAmount: 450.50,
        paymentMethod: 'MOBILE_MONEY',
        items: JSON.stringify([{ name: 'Industrial Drill', qty: 1, price: 450.50 }]),
        shopId: shopAccra.id,
        userId: salesRep.id,
        createdAt: today,
      },
      {
        totalAmount: 1200.00,
        paymentMethod: 'CASH',
        items: JSON.stringify([{ name: 'Safety Gear Bulk', qty: 5, price: 240.00 }]),
        shopId: shopAccra.id,
        userId: salesRep.id,
        createdAt: today,
      }
    ]
  })

  console.log('✅ DEPLOYMENT COMPLETE')
  console.log(`📡 NODES ACTIVE: 2 (Accra, Kumasi)`)
  console.log(`👥 PERSONNEL ACTIVE: 3`)
}

main()
  .catch((e) => {
    console.error('❌ DEPLOYMENT FAILURE:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })