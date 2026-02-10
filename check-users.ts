import { PrismaClient } from '@prisma/client';
import { compare } from 'bcryptjs';

const prisma = new PrismaClient();

async function checkUsers() {
    console.log('🔍 Checking database for users...\n');

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                organizationId: true,
                password: true
            }
        });

        console.log(`Found ${users.length} user(s):\n`);

        for (const user of users) {
            console.log(`📧 Email: ${user.email}`);
            console.log(`👤 Name: ${user.name}`);
            console.log(`🔑 Role: ${user.role}`);
            console.log(`🏢 Org ID: ${user.organizationId}`);
            console.log(`🔒 Password Hash: ${user.password.substring(0, 20)}...`);

            // Test password
            const testPassword = '123';
            const isValid = await compare(testPassword, user.password);
            console.log(`✅ Password '123' valid: ${isValid}\n`);
        }

        if (users.length === 0) {
            console.log('⚠️  No users found in database!');
            console.log('Run: cd packages/database && npx tsx ../../prisma/seed.ts');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
