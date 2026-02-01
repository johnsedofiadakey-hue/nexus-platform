import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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

     // 2. CREATE THE AGENT with bcrypt-hashed password
     const agentPassword = await bcrypt.hash("123", 10);
     const agent = await prisma.user.create({
       data: {
         email: "ernest@nexus.com",
         name: "Ernest Agent",
         role: "AGENT",
         password: agentPassword,
         position: "Field Operative", 
         department: "Retail"
       },
     });
     console.log(`👤 Created Agent: ${agent.email} | Password: 123 (hashed in DB)`);

     // 3. CREATE THE SHOP
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

     // 4. CREATE/UPDATE ADMIN USER with consistent email
     const adminPassword = await bcrypt.hash("admin123", 10);
     const admin = await prisma.user.upsert({
       where: { email: "admin@nexus.com" },
       update: {
         password: adminPassword,
         role: "ADMIN",
       },
       create: {
         email: "admin@nexus.com",
         name: "Admin User",
         password: adminPassword,
         role: "ADMIN",
         status: "ACTIVE",
       },
     });
     console.log(`👑 Admin User: ${admin.email} | Password: admin123 (hashed in DB)`);

  } catch (e) {
     console.error("❌ Seed Failed:", e);
     console.error("Failed during seed operation. Check your database connection and schema.");
     throw e;
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });