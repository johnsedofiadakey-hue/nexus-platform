const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
  const prisma = new PrismaClient();
  
  console.log('🔍 Checking admin user...\n');
  
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@nexus.com' }
  });
  
  if (admin) {
    console.log('✅ Admin user found:');
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   Status:', admin.status);
    console.log('   Password hash:', admin.password.substring(0, 30) + '...');
    
    const isValid = await bcrypt.compare('password123', admin.password);
    console.log('\n🔐 Password "password123" test:', isValid ? '✅ VALID' : '❌ INVALID');
    
    if (!isValid) {
      console.log('\n🔧 Fixing password...');
      const newHash = await bcrypt.hash('password123', 10);
      await prisma.user.update({
        where: { email: 'admin@nexus.com' },
        data: { password: newHash }
      });
      console.log('✅ Password updated!');
      
      // Verify fix
      const updatedAdmin = await prisma.user.findUnique({ where: { email: 'admin@nexus.com' } });
      const nowValid = await bcrypt.compare('password123', updatedAdmin.password);
      console.log('   Re-test:', nowValid ? '✅ NOW VALID' : '❌ STILL INVALID');
    }
  } else {
    console.log('❌ Admin user NOT found in database!');
  }
  
  await prisma.$disconnect();
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
