import { PrismaClient } from "@prisma/client";
import { hash, compare } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking existing users...");
  
  const allUsers = await prisma.user.findMany();
  console.log(`📊 Found ${allUsers.length} users:`);
  allUsers.forEach(u => console.log(`   - ${u.email} (${u.role}, Status: ${u.status})`));
  
  console.log("\n🔧 Creating/updating admin user...");

  const hashedPassword = await hash("password123", 10);
  console.log("🔐 Generated password hash:", hashedPassword);

  const admin = await prisma.user.upsert({
    where: { email: "admin@nexus.com" },
    update: {
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
    create: {
      email: "admin@nexus.com",
      name: "Super Admin",
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("\n✅ Admin user created/updated:");
  console.log(`   Email: ${admin.email}`);
  console.log(`   Password: password123`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   Status: ${admin.status}`);
  
  // Test password
  const isValid = await compare("password123", admin.password);
  console.log(`\n🔐 Password test: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
