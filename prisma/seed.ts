import { PrismaClient, Role, StaffStatus, Severity } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 INITIATING LG GHANA HIERARCHICAL DEPLOYMENT [NEXUS 2026]...')

  // 0. SYSTEM PURGE (FRESH START)
  // ---------------------------------------------------------
  await prisma.sale.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.subCategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.conductIncident.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.user.deleteMany();
  await prisma.shop.deleteMany();

  const hashedPassword = await bcrypt.hash('nexus2026', 10)

  // 1. TAXONOMY INITIALIZATION (CATEGORIES & SUB-CATEGORIES)
  // ---------------------------------------------------------
  console.log('📁 BUILDING TAXONOMY...')

  const catAppliance = await prisma.category.create({
    data: {
      name: 'HOME APPLIANCE',
      subCategories: {
        create: [
          { name: 'AIR CONDITION' },
          { name: 'REFRIGERATOR' },
          { name: 'CHEST FREEZER' },
          { name: 'MICROWAVE' },
          { name: 'VACUUM CLEANER' },
          { name: 'WASHING MACHINE' },
          { name: 'GAS COOKER' },
        ]
      }
    },
    include: { subCategories: true }
  })

  const catEntertainment = await prisma.category.create({
    data: {
      name: 'HOME ENTERTAINMENT',
      subCategories: {
        create: [
          { name: 'TV' },
          { name: 'AUDIO' },
        ]
      }
    },
    include: { subCategories: true }
  })

  // 2. RETAIL NODES (SHOPS)
  // ---------------------------------------------------------
  console.log('📡 MAPPING REGIONAL HUBS...')

  const shopMelcom = await prisma.shop.create({
    data: {
      id: 'melcom-accra-mall',
      name: 'Melcom - Accra Mall',
      location: 'Tetteh Quarshie, Accra',
      latitude: 5.6225,
      longitude: -0.1730,
    }
  })

  const shopGame = await prisma.shop.create({
    data: {
      id: 'game-kumasi-mall',
      name: 'Game - Kumasi City Mall',
      location: 'Asokwa, Kumasi',
      latitude: 6.6747,
      longitude: -1.6101,
    }
  })

  // 3. PERSONNEL ENROLLMENT (HR DATA)
  // ---------------------------------------------------------
  console.log('👥 ENROLLING VETTED PERSONNEL...')

  const commander = await prisma.user.create({
    data: {
      email: 'admin@stormglide.com',
      name: 'Commander Truth',
      password: hashedPassword,
      role: Role.SUPER_USER,
      status: StaffStatus.ACTIVE,
      staffId: 'LG-HQ-001',
    }
  })

  const repAccra = await prisma.user.create({
    data: {
      email: 'rep.accra@stormglide.com',
      name: 'Kojo Bonsu',
      password: hashedPassword,
      role: Role.SALES_REP,
      status: StaffStatus.ACTIVE,
      staffId: 'LG-ACC-401',
      shopId: shopMelcom.id,
      ghanaCardId: 'GHA-712345678-1',
      phone: '0240000000',
      address: 'East Legon, Accra'
    }
  })

  // 4. INVENTORY ALLOCATION (LINKED TO SUB-CATEGORIES)
  // ---------------------------------------------------------
  console.log('📦 ALLOCATING STRUCTURED INVENTORY...')

  // Find the sub-category IDs created in step 1
  const tvSub = catEntertainment.subCategories.find(s => s.name === 'TV')!
  const acSub = catAppliance.subCategories.find(s => s.name === 'AIR CONDITION')!
  const fridgeSub = catAppliance.subCategories.find(s => s.name === 'REFRIGERATOR')!

  await prisma.inventory.createMany({
    data: [
      {
        sku: 'LG-OLED-65-C3',
        productName: 'LG OLED 65" C3 Series 4K TV',
        priceGHS: 28500,
        quantity: 12,
        subCategoryId: tvSub.id,
        shopId: shopMelcom.id,
        formulation: 'FINISHED_GOOD',
      },
      {
        sku: 'LG-DUAL-15-AC',
        productName: 'LG Dual Inverter AC 1.5HP',
        priceGHS: 6800,
        quantity: 45,
        subCategoryId: acSub.id,
        shopId: shopGame.id,
        formulation: 'FINISHED_GOOD',
      },
      {
        sku: 'LG-INSTA-601L',
        productName: 'LG InstaView Refrigerator 601L',
        priceGHS: 18400,
        quantity: 4,
        subCategoryId: fridgeSub.id,
        shopId: shopMelcom.id,
        formulation: 'FINISHED_GOOD',
      }
    ]
  })

  console.log('---------------------------------------------------------')
  console.log('✅ STRATEGIC HIERARCHY DEPLOYED [NEXUS 2026]')
  console.log(`📂 CATEGORIES: 2 | SUB-CATS: 9`)
  console.log(`📡 ACTIVE NODES: 2 | PERSONNEL: 2`)
  console.log('---------------------------------------------------------')
}

main()
  .catch((e) => {
    console.error('❌ DEPLOYMENT FAILURE:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })