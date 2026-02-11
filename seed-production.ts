import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding production database...');

    // Create organization
    const org = await prisma.organization.upsert({
        where: { slug: 'nexus-retail-ltd' },
        update: {},
        create: {
            name: 'Nexus Retail Ltd',
            slug: 'nexus-retail-ltd',
            plan: 'ENTERPRISE',
            status: 'ACTIVE',
        },
    });
    console.log('✅ Organization created:', org.name);

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@nexus.com' },
        update: {},
        create: {
            email: 'admin@nexus.com',
            password: adminPassword,
            name: 'System Administrator',
            role: 'ADMIN',
            position: 'Administrator',
            department: 'Management',
            organization: {
                connect: { id: org.id }
            },
        },
    });
    console.log('✅ Admin user created:', admin.email);

    // Create shop
    const shop = await prisma.shop.upsert({
        where: {
            id: 'nexus-hq-shop' // Use a deterministic ID
        },
        update: {},
        create: {
            id: 'nexus-hq-shop',
            name: 'Nexus Retail - HQ',
            location: 'Accra Central',
            latitude: 5.6037,
            longitude: -0.1870,
            radius: 200,
            status: 'ACTIVE',
            organization: {
                connect: { id: org.id }
            },
        },
    });
    console.log('✅ Shop created:', shop.name);

    // Create agent user
    const agentPassword = await bcrypt.hash('123', 10);
    const agent = await prisma.user.upsert({
        where: { email: 'ernest@nexus.com' },
        update: {},
        create: {
            email: 'ernest@nexus.com',
            password: agentPassword,
            name: 'Ernest Agent',
            role: 'AGENT',
            position: 'Field Operative',
            department: 'Retail',
            organization: {
                connect: { id: org.id }
            },
            shop: {
                connect: { id: shop.id }
            },
        },
    });
    console.log('✅ Agent user created:', agent.email);

    console.log('\n🎉 Production database seeded successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Admin: admin@nexus.com / admin123');
    console.log('Agent: ernest@nexus.com / 123');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
