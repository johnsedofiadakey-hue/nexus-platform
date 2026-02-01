import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 STARTING SYSTEM RESET...");

  try {
     // 1. Wipe old data
     await prisma.message.deleteMany(); 
     await prisma.shop.deleteMany();
     await prisma.user.deleteMany({
       where: { role: { not: "ADMIN" } }
     });
     console.log("✅ Database cleared.");

     // 2. CREATE THE AGENT
     // Now this WORKS because we added 'position' and 'department' to the schema
     const agent = await prisma.user.create({
       data: {
         email: "ernest@nexus.com",
         name: "Ernest Agent",
         role: "AGENT",
         password: "123",
         position: "Field Operative", 
         department: "Retail"
       },
     });
     console.log(`👤 Created Agent: ${agent.email} | Password: 123`);

     // 3. CREATE THE SHOP
     // Now this WORKS because we added 'status' to the schema
     await prisma.shop.create({
       data: {
         name: "Nexus Retail - HQ",
         location: "Accra Central",
         latitude: 5.6037,
         longitude: -0.1870,
         radius: 200,
         status: "ACTIVE"
       },
     });
     console.log("🏢 Created Shop: Nexus HQ");

  } catch (e) {
     console.error("❌ Seed Failed:", e);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });