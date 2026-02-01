const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@nexus.com';
  const password = 'admin123';
  
  console.log('⏳ Connecting to database...');
  
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Upsert admin user (idempotent)
    const admin = await prisma.user.upsert({
      where: { email },
      update: { 
        password: hashedPassword, 
        role: 'ADMIN',
        status: 'ACTIVE'
      },
      create: {
        email,
        name: 'Nexus Administrator',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });

    console.log('--------------------------------------');
    console.log('✅ SUCCESS: Admin Account Verified');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🛡️ Role: ${admin.role}`);
    // Only log password in local development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔑 DEV ONLY - Password: ${password}`);
    }
    console.log('--------------------------------------');
  } catch (error) {
    console.error('❌ Database Error:', error.message || error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });