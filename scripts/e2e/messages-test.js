#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async function main(){
  const prisma = new PrismaClient();
  try {
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const staffPassword = bcrypt.hashSync('password123', 10);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@nexus.com' },
      update: {},
      create: {
        name: 'Super Admin',
        email: 'admin@nexus.com',
        password: adminPassword,
        role: 'SUPER_USER',
        status: 'ACTIVE'
      }
    });

    const staff = await prisma.user.upsert({
      where: { email: 'john@nexus.com' },
      update: {},
      create: {
        name: 'John Doe',
        email: 'john@nexus.com',
        password: staffPassword,
        role: 'SALES_REP',
        status: 'ACTIVE'
      }
    });

    console.log('Admin id:', admin.id);
    console.log('Staff id:', staff.id);

    await prisma.message.create({ data: { content: 'E2E test: admin -> staff', senderId: admin.id, receiverId: staff.id } });
    await prisma.message.create({ data: { content: 'E2E test: staff -> admin', senderId: staff.id, receiverId: admin.id } });

    const convo = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: admin.id, receiverId: staff.id },
          { senderId: staff.id, receiverId: admin.id }
        ]
      },
      orderBy: { createdAt: 'asc' },
      include: { sender: true, receiver: true }
    });

    console.log('Conversation rows:');
    convo.forEach(m => {
      console.log(`${m.createdAt.toISOString()} | ${m.sender.name} -> ${m.receiver.name}: ${m.content}`);
    });

  } catch (e) {
    console.error('E2E test failed:', e.message || e);
    console.error('Full error:', e);
    process.exitCode = 1;
  } finally {
    console.log('Disconnecting from database...');
    await prisma.$disconnect();
  }
})();
