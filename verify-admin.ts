const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@stormglide.com';
  const password = 'NexusAdmin2026!';
  
  console.log('⏳ Connecting to Neon...');
  
  // 1. Clear existing
  await prisma.user.deleteMany({ where: { email } });
  
  // 2. Hash
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // 3. Create Fresh
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Nexus Admin',
      password: hashedPassword,
      role: 'ADMIN',
    }
  });

  console.log('✅ DATABASE ENTRY CREATED');
  console.log('User ID:', user.id);
  console.log('Hashed Password in DB:', user.password.substring(0, 10) + '...');
}

main().catch(console.error).finally(() => prisma.$disconnect());