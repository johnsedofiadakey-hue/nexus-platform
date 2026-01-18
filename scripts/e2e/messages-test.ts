#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

async function main() {
  const prisma = new PrismaClient()
  try {
    // Ensure admin and staff exist (idempotent)
    const adminPassword = await hash('admin123', 10)
    const staffPassword = await hash('password123', 10)

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
    })

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
    })

    console.log('Admin id:', admin.id)
    console.log('Staff id:', staff.id)

    // Create test messages both ways
    await prisma.chatMessage.create({ data: { content: 'E2E test: admin -> staff', senderId: admin.id, receiverId: staff.id } })
    await prisma.chatMessage.create({ data: { content: 'E2E test: staff -> admin', senderId: staff.id, receiverId: admin.id } })

    // Fetch conversation
    const convo = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: admin.id, receiverId: staff.id },
          { senderId: staff.id, receiverId: admin.id }
        ]
      },
      orderBy: { createdAt: 'asc' },
      include: { sender: true, receiver: true }
    })

    console.log('Conversation rows:')
    convo.forEach(m => {
      console.log(`${m.createdAt.toISOString()} | ${m.sender.name} -> ${m.receiver.name}: ${m.content}`)
    })

  } catch (e) {
    console.error('E2E test failed', e)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()
