const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Connecting to Neon Database...');
  
  // Hash the password
  const password = 'NexusAdmin2026!';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    const admin = await prisma.user.upsert({
      where: { email: 'admin@stormglide.com' },
      update: { 
        password: hashedPassword, 
        role: 'ADMIN' 
      },
      create: {
        email: 'admin@stormglide.com',
        name: 'Nexus Administrator',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('--------------------------------------');
    console.log('✅ SUCCESS: Admin Account Verified');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🛡️ Role: ${admin.role}`);
    console.log('--------------------------------------');
  } catch (error) {
    console.error('❌ Database Error:', error.message);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit();
  });