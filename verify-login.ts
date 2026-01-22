import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

async function verify() {
  console.log("🔍 DIAGNOSTIC: Checking Admin Credentials...");
  const email = "admin@nexus.com";
  const password = "admin123";

  // 1. Check if User Exists
  const user = await prisma.user.findUnique({
    where: { email },
    include: { shop: true }
  });

  if (!user) {
    console.error("❌ CRITICAL FAILURE: User 'admin@nexus.com' does not exist in the database.");
    return;
  }

  console.log(`✅ User Found: ${user.name}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Status: ${user.status}`);
  console.log(`   Shop ID: ${user.shopId ? user.shopId : "❌ MISSING (Login will fail)"}`);

  // 2. Check Password
  const isMatch = await compare(password, user.password);

  if (isMatch) {
    console.log("✅ PASSWORD MATCH: 'admin123' is correct.");
    console.log("👉 If you still can't log in on the browser, the issue is your Browser Cookies.");
  } else {
    console.error("❌ PASSWORD MISMATCH: The password in the database is NOT 'admin123'.");
    console.error("👉 You must run the restoration script again.");
  }
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());