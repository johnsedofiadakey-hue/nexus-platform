import { prisma } from "./apps/admin/src/lib/prisma";

async function main() {
  console.log('🔧 Setting admin bypass for john@nexus.com...\n');
  
  const user = await prisma.user.update({
    where: { email: 'john@nexus.com' },
    data: { bypassGeofence: true },
    select: {
      email: true,
      name: true,
      bypassGeofence: true,
      shop: {
        select: { name: true }
      }
    }
  });
  
  console.log('✅ Updated user:');
  console.log(`   Name: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Shop: ${user.shop?.name}`);
  console.log(`   Bypass Geofence: ${user.bypassGeofence}`);
}

main()
  .catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
