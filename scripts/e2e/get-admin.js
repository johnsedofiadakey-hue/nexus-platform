#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
(async function(){
  const prisma = new PrismaClient();
  try {
    const admin = await prisma.user.findFirst({ where: { role: { in: ['SUPER_USER', 'ADMIN'] } } });
    console.log('admin id:', admin ? admin.id : 'NOT FOUND');
  } catch (e) {
    console.error('error', e);
    process.exitCode = 1;
  } finally { await prisma.$disconnect(); }
})();
