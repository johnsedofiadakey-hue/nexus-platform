import { prisma } from "@/lib/prisma";

async function main() {
  console.log('👤 Assigning john@nexus.com to a shop...\n');
  
  // Find John
  const john = await prisma.user.findUnique({
    where: { email: 'john@nexus.com' },
    select: { 
      id: true, 
      email: true, 
      name: true,
      role: true,
      shopId: true,
      shop: { select: { name: true } }
    }
  });
  
  if (!john) {
    console.log('❌ User john@nexus.com not found');
    return;
  }
  
  console.log(`📋 Found user: ${john.name} (${john.email})`);
  console.log(`   Role: ${john.role}`);
  
  if (john.shopId) {
    console.log(`✅ Already assigned to: ${john.shop?.name}`);
    return;
  }
  
  // Get first shop (Accra Central)
  const shop = await prisma.shop.findFirst({
    where: { 
      name: { contains: 'Accra Central' }
    }
  });
  
  if (!shop) {
    console.log('❌ No shops found');
    return;
  }
  
  // Update John's shop assignment
  await prisma.user.update({
    where: { id: john.id },
    data: { shopId: shop.id }
  });
  
  console.log(`✅ Assigned ${john.name} to: ${shop.name} (${shop.location})`);
  console.log(`   GPS: ${shop.latitude}, ${shop.longitude}`);
  console.log(`   Radius: ${shop.radius}m`);
}

main()
  .catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
