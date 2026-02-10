import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('🔧 Creating ADMIN user...\n');

  try {
    // Get the organization
    const org = await prisma.organization.findFirst();

    if (!org) {
      console.error('❌ No organization found! Run seed script first.');
      return;
    }

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@nexus.com' }
    });

    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`🔑 Role: ${existingAdmin.role}`);
      return;
    }

    // Create admin user
    const hashedPassword = await hash('admin123', 10);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@nexus.com',
        name: 'System Administrator',
        role: 'ADMIN',
        password: hashedPassword,
        position: 'Administrator',
        department: 'Management',
        organizationId: org.id,
        status: 'ACTIVE'
      }
    });

    console.log('✅ Admin user created successfully!\n');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: admin123`);
    console.log(`👤 Role: ${admin.role}`);
    console.log(`🏢 Organization: ${org.name}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
