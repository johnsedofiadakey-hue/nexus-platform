const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Fixing auth for admin account...');
  
  // Use consistent admin credentials
  const email = 'admin@nexus.com';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    const admin = await prisma.user.upsert({
      where: { email },
      update: { 
        password: hashedPassword, 
        role: 'ADMIN' 
      },
      create: {
        email,
        name: 'Nexus Administrator',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    console.log('--------------------------------------');
    console.log('✅ SUCCESS: Admin Account Fixed');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: ${password} (for dev/testing only)`);
    console.log(`🛡️ Role: ${admin.role}`);
    console.log('--------------------------------------');
  } catch (error) {
    console.error('❌ Database Error:', error.message);
    throw error;
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit();
  });