import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 1. Find the main Shop (Nexus HQ)
  const shop = await prisma.shop.findFirst({
    where: { name: 'Nexus HQ (Accra)' }
  })

  if (!shop) {
    console.log("❌ Shop 'Nexus HQ' not found. Please run your main seed first.")
    return
  }

  // 2. Create the Sales Rep
  const password = await hash('123456', 12)
  
  const rep = await prisma.user.upsert({
    where: { email: 'kwame@nexus.com' },
    update: {},
    create: {
      email: 'kwame@nexus.com',
      name: 'Kwame Sales',
      password,
      role: 'SALES_REP', // Important: Matches your role logic
      shopId: shop.id,   // Important: Links him to the shop
      status: 'ACTIVE'
    }
  })

  console.log(`✅ Sales Rep Created: ${rep.email} / 123456`)
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })