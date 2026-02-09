const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  
  console.log('🏪 Creating shops...\n');
  
  // Get the organization first
  const org = await prisma.organization.findFirst();
  
  if (!org) {
    console.log('❌ No organization found. Creating one...');
    const newOrg = await prisma.organization.create({
      data: {
        name: "Nexus Retail Ltd",
        slug: "nexus-retail-ltd",
        plan: "ENTERPRISE",
        status: "ACTIVE"
      }
    });
    console.log('✅ Created organization:', newOrg.name);
  }
  
  const orgId = org?.id || (await prisma.organization.findFirst()).id;
  
  // Check existing shops
  const existingShops = await prisma.shop.findMany({
    select: { name: 1, location: 1 }
  });
  
  console.log(`📊 Found ${existingShops.length} existing shops:`);
  existingShops.forEach(s => console.log(`   - ${s.name} (${s.location})`));
  
  // Create new shops
  const shopsToCreate = [
    {
      name: "Nexus Retail - Accra Central",
      location: "Accra Central",
      latitude: 5.6037,
      longitude: -0.1870,
      radius: 200,
      status: "ACTIVE",
      organizationId: orgId
    },
    {
      name: "Nexus Retail - Kumasi Branch",
      location: "Kumasi, Adum",
      latitude: 6.6885,
      longitude: -1.6244,
      radius: 150,
      status: "ACTIVE",
      organizationId: orgId
    },
    {
      name: "Nexus Retail - Tema Harbor",
      location: "Tema, Community 1",
      latitude: 5.6698,
      longitude: -0.0166,
      radius: 180,
      status: "ACTIVE",
      organizationId: orgId
    },
    {
      name: "Nexus Retail - Takoradi Mall",
      location: "Takoradi Market Circle",
      latitude: 4.8971,
      longitude: -1.7537,
      radius: 200,
      status: "ACTIVE",
      organizationId: orgId
    },
    {
      name: "Nexus Retail - Tamale North",
      location: "Tamale Central",
      latitude: 9.4034,
      longitude: -0.8424,
      radius: 150,
      status: "ACTIVE",
      organizationId: orgId
    }
  ];
  
  console.log('\n🔧 Creating new shops...');
  
  for (const shopData of shopsToCreate) {
    // Check if shop already exists
    const exists = await prisma.shop.findFirst({
      where: { 
        name: shopData.name 
      }
    });
    
    if (exists) {
      console.log(`⏭️  Skipped: ${shopData.name} (already exists)`);
    } else {
      const shop = await prisma.shop.create({ data: shopData });
      console.log(`✅ Created: ${shop.name} - ${shop.location}`);
    }
  }
  
  // Show final count
  const totalShops = await prisma.shop.count();
  console.log(`\n✅ Total shops in database: ${totalShops}`);
  
  await prisma.$disconnect();
})().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
