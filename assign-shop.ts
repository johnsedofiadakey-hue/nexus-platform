import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignAgentToShop() {
    console.log('🔧 Assigning agent to shop...\n');

    try {
        // Get the shop
        const shop = await prisma.shop.findFirst();

        if (!shop) {
            console.error('❌ No shop found! Run seed script first.');
            return;
        }

        // Get the agent
        const agent = await prisma.user.findUnique({
            where: { email: 'ernest@nexus.com' }
        });

        if (!agent) {
            console.error('❌ Agent not found!');
            return;
        }

        // Assign agent to shop
        const updated = await prisma.user.update({
            where: { email: 'ernest@nexus.com' },
            data: {
                shopId: shop.id
            }
        });

        console.log('✅ Agent assigned to shop successfully!\n');
        console.log(`👤 Agent: ${updated.name} (${updated.email})`);
        console.log(`🏪 Shop: ${shop.name}`);
        console.log(`📍 Location: ${shop.location}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

assignAgentToShop();
