const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
  const prisma = new PrismaClient();
  
  const john = await prisma.user.findUnique({ where: { email: 'john@nexus.com' } });
  
  if (john) {
    console.log('✅ John found:', john.email, '| Role:', john.role);
    const isValid = await bcrypt.compare('123', john.password);
    console.log('   Password "123" valid:', isValid);
    
    if (!isValid) {
      console.log('🔧 Updating password to "123"...');
      const newHash = await bcrypt.hash('123', 10);
      await prisma.user.update({
        where: { email: 'john@nexus.com' },
        data: { password: newHash, status: 'ACTIVE' }
      });
      console.log('✅ Password updated!');
    }
  } else {
    console.log('❌ John not found. Creating...');
    const hashedPassword = await bcrypt.hash('123', 10);
    await prisma.user.create({
      data: {
        email: 'john@nexus.com',
        name: 'John Worker',
        password: hashedPassword,
        role: 'WORKER',
        status: 'ACTIVE'
      }
    });
    console.log('✅ Created john@nexus.com with password "123"');
  }
  
  await prisma.$disconnect();
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
