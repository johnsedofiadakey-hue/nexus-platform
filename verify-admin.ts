const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@nexus.com';
  const password = 'admin123';
  
  console.log('⏳ Verifying admin account...');
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Upsert admin user (idempotent)
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
    },
    create: {
      email,
      name: 'Nexus Admin',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    }
  });

  console.log('✅ ADMIN ACCOUNT VERIFIED');
  console.log('User ID:', user.id);
  console.log('📧 Email:', email);
  console.log('🔑 Password:', password, '(for dev/testing only)');
  console.log('Hashed Password in DB:', user.password.substring(0, 10) + '...');
}

main().catch(console.error).finally(() => prisma.$disconnect());