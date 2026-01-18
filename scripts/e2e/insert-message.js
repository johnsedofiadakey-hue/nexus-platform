#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
(async function(){
  const prisma = new PrismaClient();
  try {
    const admin = await prisma.user.findUnique({ where: { email: 'admin@nexus.com' } });
    const staff = await prisma.user.findUnique({ where: { email: 'john@nexus.com' } });
    if (!admin || !staff) {
      console.error('Admin or staff user not found. Run e2e messages first.');
      process.exit(1);
    }

    const m = await prisma.chatMessage.create({ data: { content: 'RUNTIME TEST: hello from script', senderId: admin.id, receiverId: staff.id } });
    console.log('Inserted message id:', m.id);
  } catch (e) {
    console.error('Insert failed', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
